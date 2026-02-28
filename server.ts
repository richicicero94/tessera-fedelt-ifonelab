import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'loyalty-secret-key-123';

// Database setup
const db = new Database('loyalty.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer', -- 'customer' or 'merchant'
    loyalty_code TEXT UNIQUE,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
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
      
      const stmt = db.prepare('INSERT INTO users (email, password, role, loyalty_code) VALUES (?, ?, ?, ?)');
      const result = stmt.run(email, hashedPassword, role || 'customer', loyaltyCode);
      const userId = result.lastInsertRowid;

      const user = { id: userId, email, role: role || 'customer', loyalty_code: loyaltyCode };
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.status(201).json({ message: 'User created successfully', token, user });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed: users.email')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });

  // User Routes
  app.get('/api/user/profile', authenticateToken, (req: any, res) => {
    const user = db.prepare('SELECT id, email, role, loyalty_code, points FROM users WHERE id = ?').get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // Merchant Routes
  app.post('/api/merchant/add-points', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'merchant') return res.status(403).json({ error: 'Only merchants can add points' });

    const { loyaltyCode, points } = req.body;
    if (!loyaltyCode || points === undefined) return res.status(400).json({ error: 'Loyalty code and points required' });

    const user = db.prepare('SELECT * FROM users WHERE loyalty_code = ?').get(loyaltyCode) as any;
    if (!user) return res.status(404).json({ error: 'Customer not found' });

    db.prepare('UPDATE users SET points = points + ? WHERE loyalty_code = ?').run(points, loyaltyCode);
    
    res.json({ message: `Added ${points} points to ${user.email}`, newPoints: user.points + points });
  });

  // Vite middleware for development
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
