import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Package, BarChart3, ShoppingCart, Users, Warehouse, Truck, FileText, Settings, LogOut, Menu, X, Search, Bell, AlertTriangle, Clock, Mail, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lowStock, setLowStock] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/warehouses', icon: Warehouse, label: 'Warehouses' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const [ls, ne, ords] = await Promise.all([
          apiFetch('/reports/low-stock').catch(() => []),
          apiFetch('/reports/near-expiry?days=15').catch(() => []),
          apiFetch('/orders').catch(() => []),
        ]);
        setLowStock(Array.isArray(ls) ? ls : []);
        setNearExpiry(Array.isArray(ne) ? ne : []);
        const active = (Array.isArray(ords) ? ords : [])
          .filter(o => o.status === 'Shipped' || o.status === 'Processing')
          .slice(0, 5);
        setDeliveries(active);
      } catch (e) {
        // silent
      }
    };
    loadNotifs();
  }, [location.pathname]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [notifOpen]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSendEmail = async () => {
    setEmailStatus(null);
    setEmailSending(true);
    try {
      const res = await apiFetch('/alerts/email', {
        method: 'POST',
        body: JSON.stringify({ days: 15 }),
      });
      setEmailStatus({ ok: true, msg: `Sent to ${res.to}` });
    } catch (err) {
      setEmailStatus({ ok: false, msg: err.data?.error || 'Failed to send email' });
    } finally {
      setEmailSending(false);
    }
  };

  const totalBadge = lowStock.length + nearExpiry.length + deliveries.length;

  const userRaw = localStorage.getItem('user');
  let userName = 'Admin User';
  try {
    const u = userRaw ? JSON.parse(userRaw) : null;
    if (u && u.name) userName = u.name;
  } catch { /* noop */ }
  const initials = userName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} data-testid="sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <Package className="brand-icon" />
            {sidebarOpen && <span>Gorecory</span>}
          </Link>
          <button
            className="sidebar-toggle"
            data-testid="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              title={item.label}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/dashboard" className="nav-item" title="Settings">
            <Settings size={20} />
            {sidebarOpen && <span className="nav-label">Settings</span>}
          </Link>
          <a href="#" className="nav-item" onClick={handleLogout} data-testid="logout-btn" title="Logout">
            <LogOut size={20} />
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </a>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search products, orders..." />
          </div>
          <div className="top-bar-actions">
            <div className="notif-wrapper" ref={notifRef}>
              <button
                className="icon-btn"
                data-testid="notif-bell-btn"
                onClick={() => setNotifOpen(v => !v)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {totalBadge > 0 && (
                  <span className="notification-badge" data-testid="notif-badge">{totalBadge}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-panel" data-testid="notif-panel">
                  <div className="notif-header">
                    <strong>Notifications</strong>
                    <span className="notif-sub">Low stock · Expiry · Deliveries</span>
                  </div>

                  {totalBadge === 0 && (
                    <div className="notif-empty" data-testid="notif-empty">
                      <CheckCircle2 size={18} /> You're all caught up
                    </div>
                  )}

                  {lowStock.length > 0 && (
                    <div className="notif-section">
                      <div className="notif-section-title"><AlertTriangle size={14} /> Low stock ({lowStock.length})</div>
                      {lowStock.slice(0, 5).map(i => (
                        <div key={`ls-${i.id}`} className="notif-item">
                          <span className="notif-title">{i.name}</span>
                          <span className="notif-detail">Qty {i.quantity} · reorder at {i.reorder_level}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {nearExpiry.length > 0 && (
                    <div className="notif-section">
                      <div className="notif-section-title"><Clock size={14} /> Expiring ≤ 15 days ({nearExpiry.length})</div>
                      {nearExpiry.slice(0, 5).map(i => (
                        <div key={`ne-${i.id}`} className="notif-item">
                          <span className="notif-title">{i.name}</span>
                          <span className="notif-detail">Expires {i.expiry_date ? new Date(i.expiry_date).toISOString().slice(0,10) : '-'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {deliveries.length > 0 && (
                    <div className="notif-section">
                      <div className="notif-section-title"><Truck size={14} /> Active deliveries ({deliveries.length})</div>
                      {deliveries.map(o => (
                        <div key={`o-${o.id}`} className="notif-item">
                          <span className="notif-title">{o.id} · {o.customer}</span>
                          <span className="notif-detail">{o.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="notif-actions">
                    <button
                      className="btn-primary btn-sm"
                      onClick={handleSendEmail}
                      disabled={emailSending}
                      data-testid="send-email-alert-btn"
                    >
                      <Mail size={14} /> {emailSending ? 'Sending...' : 'Send Email Alert'}
                    </button>
                    {emailStatus && (
                      <span className={`notif-email-status ${emailStatus.ok ? 'ok' : 'err'}`} data-testid="email-status">
                        {emailStatus.msg}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-menu">
              <div className="user-avatar">{initials}</div>
              <span className="user-name" data-testid="user-name">{userName}</span>
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
