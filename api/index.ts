import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'loyalty-secret-key-123';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

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
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    const { error } = await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_token_expires: expires })
      .eq('email', email);

    if (error) throw error;

    res.json({ message: 'Codice di recupero inviato (simulato)', debugToken: resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Errore durante la richiesta di reset' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('reset_token', token)
      .single();

    if (error || !user) return res.status(400).json({ error: 'Codice non valido o scaduto' });

    const isExpired = new Date(user.reset_token_expires) < new Date();
    if (isExpired) return res.status(400).json({ error: 'Codice scaduto' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase
      .from('users')
      .update({ password: hashedPassword, reset_token: null, reset_token_expires: null })
      .eq('email', email);

    res.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante il reset della password' });
  }
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
  
  res.json({ message: `Operazione completata per ${user.email}`, newPoints });
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

export default app;
