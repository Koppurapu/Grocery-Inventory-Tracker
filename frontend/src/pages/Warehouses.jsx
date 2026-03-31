import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, MapPin, User } from 'lucide-react';
import { apiFetch } from '../api';

function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWH, setEditingWH] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', manager: '' });

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    try { setWarehouses(await apiFetch('/warehouses')); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWH) {
        await apiFetch(`/warehouses/${editingWH.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        await apiFetch('/warehouses', { method: 'POST', body: JSON.stringify(formData) });
      }
      closeModal();
      fetchWarehouses();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this warehouse?')) {
      await apiFetch(`/warehouses/${id}`, { method: 'DELETE' });
      fetchWarehouses();
    }
  };

  const openEdit = (wh) => { setEditingWH(wh); setFormData({ name: wh.name, address: wh.address, manager: wh.manager }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingWH(null); setFormData({ name: '', address: '', manager: '' }); };
  const fmt = (n) => n?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Warehouses</h1><p className="page-subtitle">Manage warehouse locations</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Add Warehouse</button>
      </div>
      <div className="warehouses-grid">
        {warehouses.map(wh => (
          <div key={wh.id} className="warehouse-card">
            <div className="warehouse-header">
              <div className="warehouse-icon"><MapPin size={24} /></div>
              <div><h3>{wh.name}</h3><p style={{fontSize:'13px',color:'var(--text-light)'}}>{wh.address}</p></div>
            </div>
            <div className="warehouse-manager"><User size={14} /> Manager: {wh.manager}</div>
            <div className="warehouse-stats">
              <div className="stat"><span className="value">{fmt(wh.items)}</span><span className="label">Items</span></div>
              <div className="stat"><span className="value">{wh.capacity || 0}%</span><span className="label">Capacity</span></div>
            </div>
            <div className="warehouse-actions">
              <button onClick={() => openEdit(wh)}><Edit size={16} /> Edit</button>
              <button className="danger" onClick={() => handleDelete(wh.id)}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingWH ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Warehouse Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
              <div className="form-group"><label>Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required /></div>
              <div className="form-group"><label>Manager</label><input type="text" value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editingWH ? 'Update' : 'Add'} Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Warehouses;
