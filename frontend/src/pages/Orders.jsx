import { useState, useEffect } from 'react';
import { Plus, Eye, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ customer: '', total: '', status: 'Pending' });

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      setOrders(await apiFetch(`/orders${params}`));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ ...formData, total: parseFloat(formData.total), items: '[]' }) });
      setShowModal(false);
      setFormData({ customer: '', total: '', status: 'Pending' });
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiFetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ id, status }) });
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Orders</h1><p className="page-subtitle">Track and manage customer orders</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> New Order</button>
      </div>
      <div className="filters-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Fulfilled">Fulfilled</option>
        </select>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="order-id">{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.date}</td>
                <td>${parseFloat(order.total || 0).toFixed(2)}</td>
                <td>
                  <select className="status-select" value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Fulfilled">Fulfilled</option>
                  </select>
                </td>
                <td className="actions-cell"><button className="action-btn" title="View"><Eye size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Order</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Customer</label><input type="text" value={formData.customer} onChange={(e) => setFormData({...formData, customer: e.target.value})} required /></div>
              <div className="form-group"><label>Total Amount ($)</label><input type="number" step="0.01" value={formData.total} onChange={(e) => setFormData({...formData, total: e.target.value})} required /></div>
              <div className="form-group"><label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
