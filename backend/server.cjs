const express = require('express');
const http = require('http');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';
const RESET_TTL_MINUTES = 60;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not set in environment');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ============= Helpers =============
function isBcryptHash(str) { return typeof str === 'string' && /^\$2[aby]\$/.test(str); }

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
}

function getStatus(quantity, reorderLevel) {
  if (quantity === 0) return 'Out of Stock';
  if (quantity < reorderLevel) return 'Low Stock';
  return 'In Stock';
}

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL);
      CREATE TABLE IF NOT EXISTS suppliers (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100), phone VARCHAR(50), address TEXT, total_orders INTEGER DEFAULT 0, rating DECIMAL(2,1) DEFAULT 0);
      CREATE TABLE IF NOT EXISTS warehouses (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, address TEXT, manager VARCHAR(100), items INTEGER DEFAULT 0, capacity INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100), phone VARCHAR(50), address TEXT, orders INTEGER DEFAULT 0, total_spent DECIMAL(12,2) DEFAULT 0, balance DECIMAL(12,2) DEFAULT 0);
      CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, sku VARCHAR(50) UNIQUE NOT NULL, quantity INTEGER DEFAULT 0, price DECIMAL(10,2) DEFAULT 0, cost DECIMAL(10,2) DEFAULT 0, status VARCHAR(20) DEFAULT 'In Stock', location VARCHAR(100), category VARCHAR(50), supplier VARCHAR(100), reorder_level INTEGER DEFAULT 50, last_updated DATE DEFAULT CURRENT_DATE);
      CREATE TABLE IF NOT EXISTS orders (id VARCHAR(20) PRIMARY KEY, customer VARCHAR(100), date DATE DEFAULT CURRENT_DATE, total DECIMAL(10,2) DEFAULT 0, status VARCHAR(20) DEFAULT 'Pending', items JSONB);
      CREATE TABLE IF NOT EXISTS purchase_orders (id VARCHAR(20) PRIMARY KEY, supplier VARCHAR(100), date DATE DEFAULT CURRENT_DATE, expected_date DATE, total DECIMAL(10,2) DEFAULT 0, status VARCHAR(20) DEFAULT 'Pending', items JSONB);
      CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(100) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(100));
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
    `);

    await client.query(`
      ALTER TABLE items ADD COLUMN IF NOT EXISTS mfg_date DATE;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS expiry_date DATE;
    `);

    const catCount = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catCount.rows[0].count) === 0) {
      await client.query(`INSERT INTO categories (name) VALUES ('Electronics'), ('Accessories'), ('Furniture');`);
    }

    const supCount = await client.query('SELECT COUNT(*) FROM suppliers');
    if (parseInt(supCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO suppliers (name, email, phone, address, total_orders, rating) VALUES
        ('TechSupply Co', 'orders@techsupply.com', '555-1111', '100 Tech Lane, Shenzhen', 45, 4.8),
        ('CableWorld', 'sales@cableworld.com', '555-2222', '200 Cable St, Taipei', 32, 4.5),
        ('Office Furnishings', 'orders@officefurn.com', '555-3333', '300 Furnish Ave, Houston', 18, 4.2);
      `);
    }

    const whCount = await client.query('SELECT COUNT(*) FROM warehouses');
    if (parseInt(whCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO warehouses (name, address, manager, items, capacity) VALUES
        ('Main Warehouse', '123 Industrial Ave, New York, NY', 'John Smith', 847, 85),
        ('West Coast Hub', '456 Commerce Blvd, Los Angeles, CA', 'Sarah Johnson', 562, 62),
        ('Midwest Center', '789 Logistics Way, Chicago, IL', 'Mike Brown', 310, 48);
      `);
    }

    const custCount = await client.query('SELECT COUNT(*) FROM customers');
    if (parseInt(custCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO customers (name, email, phone, address, orders, total_spent, balance) VALUES
        ('Acme Corp', 'contact@acme.com', '555-1234', '100 Main St, New York, NY', 12, 15432.00, 1234.50),
        ('TechStart Inc', 'info@techstart.com', '555-5678', '200 Tech Blvd, San Francisco, CA', 8, 8567.00, 567.00),
        ('Global Solutions', 'sales@global.com', '555-9012', '300 Business Park, Chicago, IL', 23, 34890.00, 2340.00);
      `);
    }

    const itemCount = await client.query('SELECT COUNT(*) FROM items');
    if (parseInt(itemCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO items (name, sku, quantity, price, cost, status, location, category, supplier, reorder_level, mfg_date, expiry_date, last_updated) VALUES
        ('Wireless Mouse', 'WM-001', 145, 29.99, 15.00, 'In Stock', 'Main Warehouse', 'Electronics', 'TechSupply Co', 50, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '300 days', CURRENT_DATE),
        ('Mechanical Keyboard', 'MK-002', 32, 89.99, 45.00, 'Low Stock', 'Main Warehouse', 'Electronics', 'TechSupply Co', 50, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE),
        ('USB-C Cable', 'UC-003', 500, 12.99, 5.00, 'In Stock', 'West Coast Hub', 'Accessories', 'CableWorld', 100, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '400 days', CURRENT_DATE),
        ('Monitor Stand', 'MS-004', 0, 45.99, 22.00, 'Out of Stock', 'Main Warehouse', 'Furniture', 'Office Furnishings', 20, NULL, NULL, CURRENT_DATE),
        ('Webcam HD', 'WC-005', 78, 59.99, 30.00, 'In Stock', 'West Coast Hub', 'Electronics', 'TechSupply Co', 30, CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '12 days', CURRENT_DATE),
        ('Office Chair', 'OC-006', 25, 199.99, 95.00, 'In Stock', 'Midwest Center', 'Furniture', 'Office Furnishings', 10, NULL, NULL, CURRENT_DATE);
      `);
    }

    const orderCount = await client.query('SELECT COUNT(*) FROM orders');
    if (parseInt(orderCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO orders (id, customer, date, total, status, items) VALUES
        ('ORD-001', 'Acme Corp', '2024-01-15', 1249.99, 'Fulfilled', '[{"itemId":1,"quantity":10,"price":29.99},{"itemId":2,"quantity":10,"price":89.99}]'),
        ('ORD-002', 'TechStart Inc', '2024-01-15', 567.50, 'Processing', '[{"itemId":3,"quantity":25,"price":12.99},{"itemId":5,"quantity":5,"price":59.99}]'),
        ('ORD-003', 'Global Solutions', '2024-01-14', 2340.00, 'Shipped', '[{"itemId":6,"quantity":10,"price":199.99}]'),
        ('ORD-004', 'Quick Retail', '2024-01-14', 189.99, 'Pending', '[{"itemId":3,"quantity":15,"price":12.99}]');
      `);
    }

    const poCount = await client.query('SELECT COUNT(*) FROM purchase_orders');
    if (parseInt(poCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO purchase_orders (id, supplier, date, expected_date, total, status, items) VALUES
        ('PO-001', 'TechSupply Co', '2024-01-10', '2024-01-20', 2500.00, 'Received', '[{"itemId":1,"quantity":100,"cost":15.00}]'),
        ('PO-002', 'CableWorld', '2024-01-12', '2024-01-22', 1500.00, 'Pending', '[{"itemId":3,"quantity":200,"cost":5.00}]'),
        ('PO-003', 'Office Furnishings', '2024-01-14', '2024-01-24', 3800.00, 'Shipped', '[{"itemId":6,"quantity":20,"cost":95.00}]');
      `);
    }

    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const demoHash = await bcrypt.hash('demo123', 10);
      await client.query('INSERT INTO users (email, password, name) VALUES ($1, $2, $3)', ['demo@gorecory.com', demoHash, 'Admin User']);
    }

    await client.query(`
      UPDATE items SET status = CASE
        WHEN quantity = 0 THEN 'Out of Stock'
        WHEN quantity < reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
      END;
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

// ============= Public AUTH routes =============
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), hash, name]
    );
    const user = result.rows[0];
    res.json({ success: true, token: signToken(user), user: { name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    let ok = false;
    if (isBcryptHash(row.password)) {
      ok = await bcrypt.compare(password, row.password);
    } else if (row.password === password) {
      ok = true;
      try {
        const newHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, row.id]);
      } catch (e) { console.error('Legacy upgrade failed:', e); }
    }

    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, token: signToken(row), user: { name: row.name, email: row.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Return the currently-authenticated user (JWT-verified)
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.sub]);
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============= Forgot / Reset password =============
function hashResetToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: (parseInt(process.env.SMTP_PORT) || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Uniform response to avoid user enumeration
    const safeResponse = { success: true, message: 'If that email exists, a reset link has been sent.' };

    const r = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = r.rows[0];
    if (!user) return res.json(safeResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    // Invalidate prior unused tokens for the user
    await pool.query(
      "UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [user.id]
    );
    await pool.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    const base = process.env.APP_BASE_URL || '';
    const resetUrl = `${base}/reset-password/${rawToken}`;

    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Reset your Gorecory password',
          html: `
            <div style="font-family:Arial,sans-serif;color:#1e293b;max-width:560px;margin:auto">
              <h2 style="color:#2563eb">Reset your password</h2>
              <p>Hi ${user.name || ''}, we received a request to reset your Gorecory account password.</p>
              <p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Reset password</a></p>
              <p style="font-size:13px;color:#64748b">Or paste this link into your browser:<br/>${resetUrl}</p>
              <p style="font-size:12px;color:#64748b">This link expires in ${RESET_TTL_MINUTES} minutes. If you didn't request a reset, you can ignore this email.</p>
            </div>`
        });
      } catch (mailErr) {
        console.error('Reset email send failed:', mailErr.message);
      }
    } else {
      console.log('[DEV] Password reset link for', user.email, ':', resetUrl);
    }

    res.json(safeResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const tokenHash = hashResetToken(token);
    const r = await pool.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at, u.email, u.name
       FROM password_resets pr JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = $1`,
      [tokenHash]
    );
    const row = r.rows[0];
    if (!row) return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (row.used_at) return res.status(400).json({ error: 'This reset link has already been used' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'This reset link has expired' });

    const newHash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, row.user_id]);
    await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [row.id]);

    const user = { id: row.user_id, email: row.email, name: row.name };
    res.json({ success: true, token: signToken(user), user: { name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============= PROTECTED ROUTES (all below require auth) =============
// Apply middleware to all subsequent /api routes
app.use('/api', requireAuth);

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const items = await pool.query('SELECT quantity, price, reorder_level FROM items');
    const orders = await pool.query('SELECT total, status FROM orders');
    const customers = await pool.query('SELECT COUNT(*) as count FROM customers');

    const totalItems = items.rows.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = items.rows.reduce((sum, i) => sum + (i.quantity * parseFloat(i.price)), 0);
    const lowStockItems = items.rows.filter(i => i.quantity < i.reorder_level).length;
    const outOfStock = items.rows.filter(i => i.quantity === 0).length;
    const totalOrders = orders.rows.length;
    const pendingOrders = orders.rows.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    const revenue = orders.rows.reduce((sum, o) => sum + parseFloat(o.total), 0);

    res.json({ totalItems, totalValue, lowStockItems, outOfStock, totalOrders, pendingOrders, revenue, totalCustomers: parseInt(customers.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Items (with pagination) =====
app.get('/api/items', async (req, res) => {
  try {
    const { category, search, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conds = [];
    const params = [];
    if (category) { params.push(category); conds.push(`category = $${params.length}`); }
    if (status) { params.push(status); conds.push(`status = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conds.push(`(name ILIKE $${params.length} OR sku ILIKE $${params.length})`); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM items ${where}`, params);
    const total = parseInt(countRes.rows[0].total);

    const listParams = [...params, limit, offset];
    const query = `SELECT * FROM items ${where} ORDER BY id ASC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`;
    const result = await pool.query(query, listParams);

    // Back-compat: if no page param, return array. Otherwise return envelope.
    if (req.query.page === undefined && req.query.limit === undefined) {
      return res.json(result.rows);
    }
    res.json({ items: result.rows, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/items', async (req, res) => {
  try {
    const { name, sku, quantity, price, cost, location, category, supplier, reorderLevel, mfgDate, expiryDate } = req.body;
    const status = getStatus(quantity, reorderLevel || 50);
    const result = await pool.query(
      `INSERT INTO items (name, sku, quantity, price, cost, status, location, category, supplier, reorder_level, mfg_date, expiry_date, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE) RETURNING *`,
      [name, sku, quantity, price, cost || 0, status, location, category, supplier, reorderLevel || 50, mfgDate || null, expiryDate || null]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { name, sku, quantity, price, cost, location, category, supplier, reorderLevel, mfgDate, expiryDate } = req.body;
    const status = getStatus(quantity, reorderLevel || 50);
    const result = await pool.query(
      `UPDATE items SET name=$1, sku=$2, quantity=$3, price=$4, cost=$5, status=$6, location=$7, category=$8, supplier=$9, reorder_level=$10, mfg_date=$11, expiry_date=$12, last_updated=CURRENT_DATE WHERE id=$13 RETURNING *`,
      [name, sku, quantity, price, cost, status, location, category, supplier, reorderLevel || 50, mfgDate || null, expiryDate || null, req.params.id]
    );
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Categories =====
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [req.body.name]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Suppliers =====
app.get('/api/suppliers', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM suppliers')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query('INSERT INTO suppliers (name, email, phone, address, total_orders, rating) VALUES ($1, $2, $3, $4, 0, 0) RETURNING *', [name, email, phone, address]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query('UPDATE suppliers SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING *', [name, email, phone, address, req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/suppliers/:id', async (req, res) => {
  try { await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Orders (with pagination + WS broadcast) =====
app.get('/api/orders', async (req, res) => {
  try {
    const { status, customer } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conds = [];
    const params = [];
    if (status) { params.push(status); conds.push(`status = $${params.length}`); }
    if (customer) { params.push(`%${customer}%`); conds.push(`customer ILIKE $${params.length}`); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM orders ${where}`, params);
    const total = parseInt(countRes.rows[0].total);

    const listParams = [...params, limit, offset];
    const query = `SELECT * FROM orders ${where} ORDER BY date DESC, id DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`;
    const result = await pool.query(query, listParams);

    if (req.query.page === undefined && req.query.limit === undefined) {
      return res.json(result.rows);
    }
    res.json({ items: result.rows, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer, total, status, items } = req.body;
    const id = `ORD-${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      'INSERT INTO orders (id, customer, date, total, status, items) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5) RETURNING *',
      [id, customer, total, status || 'Pending', JSON.stringify(items)]
    );
    broadcast({ type: 'order.created', order: result.rows[0] });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const prior = await pool.query('SELECT status FROM orders WHERE id=$1', [req.params.id]);
    const result = await pool.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (result.rows[0]) {
      broadcast({
        type: 'order.status_changed',
        order: result.rows[0],
        previousStatus: prior.rows[0]?.status || null,
        newStatus: status
      });
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Warehouses =====
app.get('/api/warehouses', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM warehouses')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/warehouses/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses WHERE id = $1', [req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/warehouses', async (req, res) => {
  try {
    const { name, address, manager } = req.body;
    const result = await pool.query('INSERT INTO warehouses (name, address, manager, items, capacity) VALUES ($1, $2, $3, 0, 0) RETURNING *', [name, address, manager]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/warehouses/:id', async (req, res) => {
  try {
    const { name, address, manager } = req.body;
    const result = await pool.query('UPDATE warehouses SET name=$1, address=$2, manager=$3 WHERE id=$4 RETURNING *', [name, address, manager, req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/warehouses/:id', async (req, res) => {
  try { await pool.query('DELETE FROM warehouses WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Customers =====
app.get('/api/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` WHERE name ILIKE $1 OR email ILIKE $1`; }
    res.json((await pool.query(query, params)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/customers/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query('INSERT INTO customers (name, email, phone, address, orders, total_spent, balance) VALUES ($1, $2, $3, $4, 0, 0, 0) RETURNING *', [name, email, phone, address]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query('UPDATE customers SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING *', [name, email, phone, address, req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/customers/:id', async (req, res) => {
  try { await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Purchase Orders =====
app.get('/api/purchase-orders', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM purchase_orders ORDER BY date DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { supplier, expectedDate, total, status, items } = req.body;
    const id = `PO-${Date.now().toString().slice(-6)}`;
    const result = await pool.query('INSERT INTO purchase_orders (id, supplier, date, expected_date, total, status, items) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6) RETURNING *', [id, supplier, expectedDate, total, status || 'Pending', JSON.stringify(items)]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/purchase-orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE purchase_orders SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Reports =====
app.get('/api/reports/sales', async (req, res) => {
  res.json([
    { month: 'Aug', revenue: 12500, orders: 45 },
    { month: 'Sep', revenue: 15200, orders: 52 },
    { month: 'Oct', revenue: 14800, orders: 48 },
    { month: 'Nov', revenue: 18500, orders: 61 },
    { month: 'Dec', revenue: 22000, orders: 75 },
    { month: 'Jan', revenue: 19400, orders: 68 },
  ]);
});

app.get('/api/reports/inventory-value', async (req, res) => {
  try {
    const items = await pool.query('SELECT category, location, quantity, price FROM items');
    const byCategory = {};
    const byWarehouse = {};
    items.rows.forEach(item => {
      const value = item.quantity * parseFloat(item.price);
      byCategory[item.category] = (byCategory[item.category] || 0) + value;
      byWarehouse[item.location] = (byWarehouse[item.location] || 0) + value;
    });
    res.json({
      byCategory: Object.entries(byCategory).map(([category, value]) => ({ category, value })),
      byWarehouse: Object.entries(byWarehouse).map(([warehouse, value]) => ({ warehouse, value }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/top-items', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM items ORDER BY quantity * price DESC LIMIT 10')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/low-stock', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM items WHERE quantity < reorder_level')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/near-expiry', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 15;
    const result = await pool.query(
      `SELECT * FROM items WHERE expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + ($1 || ' days')::interval ORDER BY expiry_date ASC`,
      [days]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== Alerts =====
app.get('/api/alerts/messages', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 15;
    const lowStock = await pool.query('SELECT id, name, sku, quantity, reorder_level FROM items WHERE quantity < reorder_level ORDER BY quantity ASC');
    const nearExpiry = await pool.query(
      `SELECT id, name, sku, expiry_date FROM items WHERE expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + ($1 || ' days')::interval ORDER BY expiry_date ASC`,
      [days]
    );
    const messages = [];
    lowStock.rows.forEach(i => messages.push({ type: 'low_stock', title: `${i.name} low stock`, detail: `Only ${i.quantity} left (reorder at ${i.reorder_level})`, sku: i.sku }));
    nearExpiry.rows.forEach(i => {
      const d = new Date(i.expiry_date);
      const today = new Date(); today.setHours(0,0,0,0);
      const daysLeft = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      messages.push({ type: 'near_expiry', title: `${i.name} expiring soon`, detail: `Expires in ${daysLeft} day(s) on ${d.toISOString().slice(0,10)}`, sku: i.sku });
    });
    res.json({ days, lowStock: lowStock.rows, nearExpiry: nearExpiry.rows, messages, total: messages.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/alerts/email', async (req, res) => {
  try {
    const days = parseInt((req.body && req.body.days) || req.query.days) || 15;
    const to = (req.body && req.body.to) || process.env.ALERT_EMAIL_TO;

    const transporter = getTransporter();
    if (!transporter) return res.status(500).json({ error: 'SMTP is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS in backend environment.' });
    if (!to) return res.status(400).json({ error: 'Recipient email missing. Provide "to" in request or set ALERT_EMAIL_TO.' });

    const lowStock = await pool.query('SELECT name, sku, quantity, reorder_level FROM items WHERE quantity < reorder_level ORDER BY quantity ASC');
    const nearExpiry = await pool.query(
      `SELECT name, sku, expiry_date FROM items WHERE expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + ($1 || ' days')::interval ORDER BY expiry_date ASC`,
      [days]
    );

    const rows = [];
    lowStock.rows.forEach(i => rows.push(`<tr><td>Low Stock</td><td>${i.name}</td><td>${i.sku}</td><td>Qty ${i.quantity} / Reorder ${i.reorder_level}</td></tr>`));
    nearExpiry.rows.forEach(i => rows.push(`<tr><td>Near Expiry</td><td>${i.name}</td><td>${i.sku}</td><td>Expires ${new Date(i.expiry_date).toISOString().slice(0,10)}</td></tr>`));

    const html = `
      <div style="font-family:Arial,sans-serif;color:#1e293b">
        <h2>Gorecory Inventory Alerts</h2>
        <p>Summary for the next <b>${days}</b> days.</p>
        <p><b>Low stock items:</b> ${lowStock.rows.length}<br/><b>Items near expiry:</b> ${nearExpiry.rows.length}</p>
        <table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse;width:100%">
          <thead style="background:#f1f5f9"><tr><th>Type</th><th>Item</th><th>SKU</th><th>Detail</th></tr></thead>
          <tbody>${rows.join('') || '<tr><td colspan="4">No alerts</td></tr>'}</tbody>
        </table>
      </div>`;

    const info = await transporter.sendMail({
      from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `Gorecory Inventory Alerts (${lowStock.rows.length} low stock, ${nearExpiry.rows.length} near expiry)`,
      html
    });

    res.json({ success: true, messageId: info.messageId, to, lowStockCount: lowStock.rows.length, nearExpiryCount: nearExpiry.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============= WebSocket (order realtime) =============
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

function broadcast(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */) {
      try { client.send(data); } catch (_) { /* noop */ }
    }
  });
}

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/api/ws')) {
    socket.destroy();
    return;
  }
  // Token in query string: /api/ws?token=<jwt>
  try {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) { socket.destroy(); return; }
    jwt.verify(token, JWT_SECRET);
  } catch (e) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws) => {
  try { ws.send(JSON.stringify({ type: 'connected', ts: Date.now() })); } catch (_) { /* noop */ }
});

initDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server + WS running on http://0.0.0.0:${PORT}`);
  });
});
