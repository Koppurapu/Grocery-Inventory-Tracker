const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        total_orders INTEGER DEFAULT 0,
        rating DECIMAL(2,1) DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS warehouses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        manager VARCHAR(100),
        items INTEGER DEFAULT 0,
        capacity INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        orders INTEGER DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0,
        balance DECIMAL(12,2) DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        quantity INTEGER DEFAULT 0,
        price DECIMAL(10,2) DEFAULT 0,
        cost DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'In Stock',
        location VARCHAR(100),
        category VARCHAR(50),
        supplier VARCHAR(100),
        reorder_level INTEGER DEFAULT 50,
        last_updated DATE DEFAULT CURRENT_DATE
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(20) PRIMARY KEY,
        customer VARCHAR(100),
        date DATE DEFAULT CURRENT_DATE,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Pending',
        items JSONB
      );
      
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id VARCHAR(20) PRIMARY KEY,
        supplier VARCHAR(100),
        date DATE DEFAULT CURRENT_DATE,
        expected_date DATE,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Pending',
        items JSONB
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100)
      );
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
        INSERT INTO items (name, sku, quantity, price, cost, status, location, category, supplier, reorder_level, last_updated) VALUES 
        ('Wireless Mouse', 'WM-001', 145, 29.99, 15.00, 'In Stock', 'Main Warehouse', 'Electronics', 'TechSupply Co', 50, CURRENT_DATE),
        ('Mechanical Keyboard', 'MK-002', 32, 89.99, 45.00, 'Low Stock', 'Main Warehouse', 'Electronics', 'TechSupply Co', 50, CURRENT_DATE),
        ('USB-C Cable', 'UC-003', 500, 12.99, 5.00, 'In Stock', 'West Coast Hub', 'Accessories', 'CableWorld', 100, CURRENT_DATE),
        ('Monitor Stand', 'MS-004', 0, 45.99, 22.00, 'Out of Stock', 'Main Warehouse', 'Furniture', 'Office Furnishings', 20, CURRENT_DATE),
        ('Webcam HD', 'WC-005', 78, 59.99, 30.00, 'In Stock', 'West Coast Hub', 'Electronics', 'TechSupply Co', 30, CURRENT_DATE),
        ('Office Chair', 'OC-006', 25, 199.99, 95.00, 'In Stock', 'Midwest Center', 'Furniture', 'Office Furnishings', 10, CURRENT_DATE);
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
      await client.query(`INSERT INTO users (email, password, name) VALUES ('demo@gorecory.com', 'demo123', 'Admin User');`);
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

function getStatus(quantity, reorderLevel) {
  if (quantity === 0) return 'Out of Stock';
  if (quantity < reorderLevel) return 'Low Stock';
  return 'In Stock';
}

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const items = await pool.query('SELECT quantity, price, reorder_level FROM items');
    const orders = await pool.query('SELECT total FROM orders');
    const customers = await pool.query('SELECT COUNT(*) as count FROM customers');
    
    const totalItems = items.rows.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = items.rows.reduce((sum, i) => sum + (i.quantity * i.price), 0);
    const lowStockItems = items.rows.filter(i => i.quantity < i.reorder_level).length;
    const outOfStock = items.rows.filter(i => i.quantity === 0).length;
    const totalOrders = orders.rows.length;
    const pendingOrders = orders.rows.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    const revenue = orders.rows.reduce((sum, o) => sum + parseFloat(o.total), 0);
    
    res.json({ totalItems, totalValue, lowStockItems, outOfStock, totalOrders, pendingOrders, revenue, totalCustomers: parseInt(customers.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Items
app.get('/api/items', async (req, res) => {
  try {
    const { category, search, status } = req.query;
    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];
    
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`; }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
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
    const { name, sku, quantity, price, cost, location, category, supplier, reorderLevel } = req.body;
    const status = getStatus(quantity, reorderLevel || 50);
    const result = await pool.query(
      `INSERT INTO items (name, sku, quantity, price, cost, status, location, category, supplier, reorder_level, last_updated) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE) RETURNING *`,
      [name, sku, quantity, price, cost || 0, status, location, category, supplier, reorderLevel || 50]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { name, sku, quantity, price, cost, location, category, supplier, reorderLevel } = req.body;
    const status = getStatus(quantity, reorderLevel || 50);
    const result = await pool.query(
      `UPDATE items SET name=$1, sku=$2, quantity=$3, price=$4, cost=$5, status=$6, location=$7, category=$8, supplier=$9, reorder_level=$10, last_updated=CURRENT_DATE WHERE id=$11 RETURNING *`,
      [name, sku, quantity, price, cost, status, location, category, supplier, reorderLevel || 50, req.params.id]
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

// Categories
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

// Suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    const result = await pool.query(
      'INSERT INTO suppliers (name, email, phone, address, total_orders, rating) VALUES ($1, $2, $3, $4, 0, 0) RETURNING *',
      [name, email, phone, address]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query(
      'UPDATE suppliers SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING *',
      [name, email, phone, address, req.params.id]
    );
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status, customer } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (customer) { params.push(`%${customer}%`); query += ` AND customer ILIKE $${params.length}`; }
    
    const result = await pool.query(query + ' ORDER BY date DESC', params);
    res.json(result.rows);
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
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Warehouses
app.get('/api/warehouses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    const result = await pool.query(
      'INSERT INTO warehouses (name, address, manager, items, capacity) VALUES ($1, $2, $3, 0, 0) RETURNING *',
      [name, address, manager]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/warehouses/:id', async (req, res) => {
  try {
    const { name, address, manager } = req.body;
    const result = await pool.query(
      'UPDATE warehouses SET name=$1, address=$2, manager=$3 WHERE id=$4 RETURNING *',
      [name, address, manager, req.params.id]
    );
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM warehouses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` WHERE name ILIKE $1 OR email ILIKE $1`; }
    const result = await pool.query(query, params);
    res.json(result.rows);
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
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone, address, orders, total_spent, balance) VALUES ($1, $2, $3, $4, 0, 0, 0) RETURNING *',
      [name, email, phone, address]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING *',
      [name, email, phone, address, req.params.id]
    );
    result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM purchase_orders ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { supplier, expectedDate, total, status, items } = req.body;
    const id = `PO-${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      'INSERT INTO purchase_orders (id, supplier, date, expected_date, total, status, items) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6) RETURNING *',
      [id, supplier, expectedDate, total, status || 'Pending', JSON.stringify(items)]
    );
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

// Reports
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
      const value = item.quantity * item.price;
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
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY quantity * price DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/low-stock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE quantity < reorder_level');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Auth
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    
    if (result.rows[0]) {
      res.json({ success: true, token: 'demo-token-123', user: { name: result.rows[0].name, email: result.rows[0].email } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});