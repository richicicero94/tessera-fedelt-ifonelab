import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'loyalty-secret-key-123';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL || 'https://tytxjcrcnjvszljbmyos.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
  console.error('ERRORE: SUPABASE_SERVICE_ROLE_KEY non trovata nei Secrets!');
}
const supabase = createClient(supabaseUrl, supabaseKey || '');

// Seed default merchant
const seedMerchant = async () => {
  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase credentials missing, skipping seed');
    return;
  }
  const email = 'ifonelab1@gmail.com';
  const password = 'admin1';
  
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, role: 'merchant' }]);
    
    if (error) console.error('Error seeding merchant:', error.message);
    else console.log('Default merchant seeded');
  }
};
seedMerchant();

const app = express();
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const loyaltyCode = role === 'merchant' ? null : crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email, 
        password: hashedPassword, 
        role: role || 'customer', 
        loyalty_code: loyaltyCode,
        points: 0
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
      throw error;
    }

    const user = { id: data.id, email: data.email, role: data.role, loyalty_code: data.loyalty_code };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ message: 'User created successfully', token, user });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// User Routes
app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, loyalty_code, points')
    .eq('id', req.user.id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Merchant Routes
app.post('/api/merchant/add-points', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'merchant') return res.status(403).json({ error: 'Only merchants can add points' });

  const { loyaltyCode, points } = req.body;
  if (!loyaltyCode || points === undefined) return res.status(400).json({ error: 'Loyalty code and points required' });

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('loyalty_code', loyaltyCode)
    .single();

  if (fetchError || !user) return res.status(404).json({ error: 'Customer not found' });

  const newPoints = (user.points || 0) + points;
  const { error: updateError } = await supabase
    .from('users')
    .update({ points: newPoints })
    .eq('loyalty_code', loyaltyCode);

  if (updateError) return res.status(500).json({ error: 'Failed to update points' });
  
  res.json({ message: `Added ${points} points to ${user.email}`, newPoints });
});

app.get('/api/merchant/customers', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'merchant') return res.status(403).json({ error: 'Only merchants can view customers' });
  
  const { data: customers, error } = await supabase
    .from('users')
    .select('id, email, loyalty_code, points, created_at')
    .eq('role', 'customer')
    .order('points', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch customers' });
  res.json(customers);
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }
}

setupVite();

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
