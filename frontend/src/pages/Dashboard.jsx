import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, lowStockItems: 0, outOfStock: 0, totalOrders: 0, pendingOrders: 0, revenue: 0, totalCustomers: 0 });
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [s, i, o] = await Promise.all([
        apiFetch('/stats'),
        apiFetch('/items'),
        apiFetch('/orders'),
      ]);
      setStats(s);
      setItems(i);
      setOrders(o);
    } catch (err) { console.error('Failed to fetch data:', err); }
    setLoading(false);
  };

  const fmt = (n) => n?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
  const fmtCurrency = (n) => n ? `$${fmt(Math.round(n))}` : '$0';

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  const lowStockItems = items.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Dashboard</h1><p className="page-subtitle">Overview of your inventory</p></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Total Items</span><Package size={20} className="stat-icon" /></div>
          <div className="stat-value">{fmt(stats.totalItems)}</div>
          <div className="stat-sub">{fmtCurrency(stats.totalValue)} value</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Low Stock Items</span><AlertTriangle size={20} className="stat-icon warning" /></div>
          <div className="stat-value">{stats.lowStockItems}</div>
          <div className="stat-sub">{stats.outOfStock} out of stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Total Orders</span><ShoppingCart size={20} className="stat-icon" /></div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-sub">{stats.pendingOrders} pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Revenue</span><TrendingUp size={20} className="stat-icon success" /></div>
          <div className="stat-value">{fmtCurrency(stats.revenue)}</div>
          <div className="stat-sub">{stats.totalCustomers} customers</div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header"><h3>Recent Orders</h3><Link to="/orders" className="btn-link">View All</Link></div>
          <div className="orders-list">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="order-item">
                <div className="order-info">
                  <span className="order-id">{order.id}</span>
                  <span className="order-customer">{order.customer}</span>
                </div>
                <div className="order-meta">
                  <span className="order-total">{fmtCurrency(order.total)}</span>
                  <span className={`order-status ${order.status?.toLowerCase()}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h3>Low Stock Alerts</h3><Link to="/products" className="btn-link">View All</Link></div>
          <div className="low-stock-list">
            {lowStockItems.length === 0 ? (
              <p className="no-data">All items are well stocked!</p>
            ) : lowStockItems.map(item => (
              <div key={item.id} className="low-stock-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-sku">{item.sku}</span>
                </div>
                <div className="stock-info">
                  <span className={`stock-badge ${item.status?.toLowerCase().replace(' ', '-')}`}>{item.quantity} left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel" style={{marginTop: '24px'}}>
        <div className="panel-header"><h3>Inventory Overview</h3></div>
        <div className="inventory-chart">
          <div className="chart-bars">
            {[75, 60, 40, 85, 50, 70, 45].map((h, i) => (
              <div key={i} className="bar" style={{height: `${h}%`}}></div>
            ))}
          </div>
          <div className="chart-labels">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
