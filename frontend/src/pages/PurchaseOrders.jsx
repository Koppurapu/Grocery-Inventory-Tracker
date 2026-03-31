import { useState, useEffect } from 'react';
import { Plus, Loader2, Eye } from 'lucide-react';
import { apiFetch } from '../api';

function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ supplier: '', expectedDate: '', total: '', status: 'Pending' });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { setOrders(await apiFetch('/purchase-orders')); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({ ...formData, total: parseFloat(formData.total), items: '[]' })
      });
      setShowModal(false);
      setFormData({ supplier: '', expectedDate: '', total: '', status: 'Pending' });
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiFetch(`/purchase-orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ id, status })
      });
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p className="page-subtitle">Manage supplier purchase orders</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New PO
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Expected</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(po => (
              <tr key={po.id}>
                <td>{po.id}</td>
                <td>{po.supplier}</td>
                <td>{fmtDate(po.date)}</td>
                <td>{fmtDate(po.expectedDate)}</td>
                <td>${parseFloat(po.total || 0).toFixed(2)}</td>
                <td>
                  <select
                    className="status-select"
                    value={po.status}
                    onChange={(e) => updateStatus(po.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Received">Received</option>
                  </select>
                </td>
                <td className="actions-cell">
                  <button className="action-btn" title="View"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Purchase Order</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Expected Date</label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrders;
