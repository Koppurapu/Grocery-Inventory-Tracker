import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Phone, Mail, Star } from 'lucide-react';
import { apiFetch } from '../api';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try { setSuppliers(await apiFetch('/suppliers')); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await apiFetch(`/suppliers/${editingSupplier.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(formData) });
      }
      closeModal();
      fetchSuppliers();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this supplier?')) {
      await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
      fetchSuppliers();
    }
  };

  const openEdit = (sup) => { setEditingSupplier(sup); setFormData({ name: sup.name, email: sup.email, phone: sup.phone, address: sup.address }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingSupplier(null); setFormData({ name: '', email: '', phone: '', address: '' }); };
  const renderStars = (rating) => [...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.round(rating || 0) ? '#f59e0b' : 'none'} color={i < Math.round(rating || 0) ? '#f59e0b' : '#cbd5e1'} />);

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Suppliers</h1><p className="page-subtitle">Manage your supplier relationships</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Add Supplier</button>
      </div>
      <div className="suppliers-grid">
        {suppliers.map(sup => (
          <div key={sup.id} className="supplier-card">
            <div className="supplier-header">
              <div className="supplier-avatar">{sup.name?.charAt(0)}</div>
              <div><h3>{sup.name}</h3><div className="rating">{renderStars(sup.rating)}</div></div>
            </div>
            <div className="supplier-contact">
              <p><Mail size={14} /> {sup.email}</p>
              <p><Phone size={14} /> {sup.phone}</p>
              <p>{sup.address}</p>
            </div>
            <div className="supplier-stats">
              <div className="stat"><span className="value">{sup.totalOrders || 0}</span><span className="label">Total Orders</span></div>
            </div>
            <div className="supplier-actions">
              <button onClick={() => openEdit(sup)}><Edit size={16} /> Edit</button>
              <button className="danger" onClick={() => handleDelete(sup.id)}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Supplier Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
              <div className="form-group"><label>Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editingSupplier ? 'Update' : 'Add'} Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
