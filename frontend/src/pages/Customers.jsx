import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, Phone, Mail, MapPin } from 'lucide-react';
import { apiFetch } from '../api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => { fetchCustomers(); }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      const params = searchTerm ? `?search=${searchTerm}` : '';
      setCustomers(await apiFetch(`/customers${params}`));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await apiFetch(`/customers/${editingCustomer.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        await apiFetch('/customers', { method: 'POST', body: JSON.stringify(formData) });
      }
      closeModal();
      fetchCustomers();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this customer?')) {
      await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      fetchCustomers();
    }
  };

  const openEdit = (cust) => { setEditingCustomer(cust); setFormData({ name: cust.name, email: cust.email, phone: cust.phone, address: cust.address }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingCustomer(null); setFormData({ name: '', email: '', phone: '', address: '' }); };
  const fmt = (n) => n ? parseFloat(n).toLocaleString() : '0';

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Customers</h1><p className="page-subtitle">Manage your customer relationships</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Add Customer</button>
      </div>
      <div className="filters-bar">
        <div className="search-box"><Search size={18} /><input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>
      <div className="customers-grid">
        {customers.map(cust => (
          <div key={cust.id} className="customer-card">
            <div className="customer-header">
              <div className="customer-avatar">{cust.name?.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              <div className="customer-info">
                <h3>{cust.name}</h3>
                <p><Mail size={14} /> {cust.email}</p>
                <p><Phone size={14} /> {cust.phone}</p>
                <p><MapPin size={14} /> {cust.address}</p>
              </div>
            </div>
            <div className="customer-stats">
              <div className="stat"><span className="value">{cust.orders || 0}</span><span className="label">Orders</span></div>
              <div className="stat"><span className="value">${fmt(cust.totalSpent)}</span><span className="label">Total Spent</span></div>
              <div className="stat"><span className="value">${fmt(cust.balance)}</span><span className="label">Balance</span></div>
            </div>
            <div className="customer-actions">
              <button onClick={() => openEdit(cust)}><Edit size={16} /> Edit</button>
              <button className="danger" onClick={() => handleDelete(cust.id)}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Company Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
              <div className="form-group"><label>Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editingCustomer ? 'Update' : 'Add'} Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
