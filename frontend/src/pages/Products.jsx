import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';

function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', quantity: '', price: '', cost: '', location: '', category: '', supplier: '', reorderLevel: '50', mfgDate: '', expiryDate: '' });

  useEffect(() => { fetchItems(); }, [searchTerm, categoryFilter, statusFilter]);

  const normalize = (item) => ({
    ...item,
    reorderLevel: item.reorder_level ?? item.reorderLevel ?? 50,
    mfgDate: item.mfg_date ?? item.mfgDate ?? null,
    expiryDate: item.expiry_date ?? item.expiryDate ?? null,
  });

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      const data = await apiFetch(`/items?${params}`);
      setItems(Array.isArray(data) ? data.map(normalize) : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toDateInput = (d) => {
    if (!d) return '';
    try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...formData,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost || 0),
        reorderLevel: parseInt(formData.reorderLevel || 50),
        mfgDate: formData.mfgDate || null,
        expiryDate: formData.expiryDate || null,
      };
      if (editingItem) {
        await apiFetch(`/items/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/items', { method: 'POST', body: JSON.stringify(body) });
      }
      closeModal();
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this item?')) {
      await apiFetch(`/items/${id}`, { method: 'DELETE' });
      fetchItems();
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      cost: item.cost,
      location: item.location || '',
      category: item.category || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorder_level ?? item.reorderLevel ?? 50,
      mfgDate: toDateInput(item.mfg_date ?? item.mfgDate),
      expiryDate: toDateInput(item.expiry_date ?? item.expiryDate),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', sku: '', quantity: '', price: '', cost: '', location: '', category: '', supplier: '', reorderLevel: '50', mfgDate: '', expiryDate: '' });
  };

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  return (
    <div className="page-container" data-testid="products-page">
      <div className="page-header">
        <div><h1>Products</h1><p className="page-subtitle">Manage your inventory products</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-product-btn"><Plus size={18} /> Add Product</button>
      </div>
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="products-search-input" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} data-testid="products-category-filter">
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Accessories">Accessories</option>
          <option value="Furniture">Furniture</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="products-status-filter">
          <option value="">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Quantity</th><th>Price</th><th>Location</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="product-name">{item.name}</td>
                <td className="sku">{item.sku}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>${parseFloat(item.price || 0).toFixed(2)}</td>
                <td>{item.location}</td>
                <td>{item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0,10) : '—'}</td>
                <td><span className={`status-badge ${item.status?.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                <td className="actions-cell">
                  <button className="action-btn" title="Edit" onClick={() => openEdit(item)} data-testid={`edit-product-${item.id}`}><Edit size={16} /></button>
                  <button className="action-btn danger" title="Delete" onClick={() => handleDelete(item.id)} data-testid={`delete-product-${item.id}`}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="product-modal">
            <h2>{editingItem ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Product Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><label>SKU</label><input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
                    <option value="">Select</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>
                <div className="form-group"><label>Quantity</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price ($)</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required /></div>
                <div className="form-group"><label>Cost ($)</label><input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Location</label>
                  <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required>
                    <option value="">Select</option>
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="West Coast Hub">West Coast Hub</option>
                    <option value="Midwest Center">Midwest Center</option>
                  </select>
                </div>
                <div className="form-group"><label>Reorder Level</label><input type="number" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})} data-testid="input-reorder-level" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>MFG Date</label><input type="date" value={formData.mfgDate} onChange={(e) => setFormData({...formData, mfgDate: e.target.value})} data-testid="input-mfg-date" /></div>
                <div className="form-group"><label>Expiry Date</label><input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} data-testid="input-expiry-date" /></div>
              </div>
              <div className="form-group"><label>Supplier</label>
                <select value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})}>
                  <option value="">Select</option>
                  <option value="TechSupply Co">TechSupply Co</option>
                  <option value="CableWorld">CableWorld</option>
                  <option value="Office Furnishings">Office Furnishings</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" data-testid="save-product-btn">{editingItem ? 'Update' : 'Add'} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
