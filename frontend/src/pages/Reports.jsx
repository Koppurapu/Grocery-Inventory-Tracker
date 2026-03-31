import { useState, useEffect } from 'react';
import { BarChart3, Package, AlertTriangle, Loader2, Download } from 'lucide-react';
import { apiFetch } from '../api';

function Reports() {
  const [salesData, setSalesData] = useState([]);
  const [inventoryValue, setInventoryValue] = useState({ byCategory: [], byWarehouse: [] });
  const [topItems, setTopItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [sales, inv, top, low] = await Promise.all([
        apiFetch('/reports/sales'),
        apiFetch('/reports/inventory-value'),
        apiFetch('/reports/top-items'),
        apiFetch('/reports/low-stock'),
      ]);
      setSalesData(sales);
      setInventoryValue(inv);
      setTopItems(top);
      setLowStock(low);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const maxRevenue = salesData.length ? Math.max(...salesData.map(d => d.revenue)) : 1;

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" size={48} /><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Reports</h1><p className="page-subtitle">Analyze your inventory performance</p></div>
        <button className="btn-secondary"><Download size={18} /> Export</button>
      </div>
      <div className="reports-tabs">
        <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}><BarChart3 size={18} /> Sales</button>
        <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}><Package size={18} /> Inventory Value</button>
        <button className={activeTab === 'lowstock' ? 'active' : ''} onClick={() => setActiveTab('lowstock')}><AlertTriangle size={18} /> Low Stock</button>
      </div>

      {activeTab === 'sales' && (
        <div className="report-section">
          <div className="report-card">
            <h3>Revenue Overview</h3>
            <div className="chart-container">
              <div className="bar-chart">
                {salesData.map((d, i) => (
                  <div key={i} className="bar-wrapper">
                    <div className="bar" style={{height: `${(d.revenue / maxRevenue) * 100}%`}}>
                      <span className="bar-value">${(d.revenue / 1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="report-card">
            <h3>Orders by Month</h3>
            <div className="stats-row">
              {salesData.map((d, i) => (
                <div key={i} className="mini-stat">
                  <span className="label">{d.month}</span>
                  <span className="value">{d.orders}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="report-section">
          <div className="report-card">
            <h3>Value by Category</h3>
            <div className="value-bars">
              {inventoryValue.byCategory.map((cat, i) => {
                const total = inventoryValue.byCategory.reduce((s, c) => s + c.value, 0);
                return (
                  <div key={i} className="value-bar-item">
                    <div className="value-info"><span className="label">{cat.category}</span><span className="value">${parseFloat(cat.value || 0).toLocaleString()}</span></div>
                    <div className="value-bar"><div className="value-fill" style={{width: `${total ? (cat.value / total) * 100 : 0}%`}}></div></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="report-card">
            <h3>Value by Warehouse</h3>
            <div className="value-bars">
              {inventoryValue.byWarehouse.map((wh, i) => {
                const total = inventoryValue.byWarehouse.reduce((s, c) => s + c.value, 0);
                return (
                  <div key={i} className="value-bar-item">
                    <div className="value-info"><span className="label">{wh.warehouse}</span><span className="value">${parseFloat(wh.value || 0).toLocaleString()}</span></div>
                    <div className="value-bar"><div className="value-fill" style={{width: `${total ? (wh.value / total) * 100 : 0}%`}}></div></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="report-card">
            <h3>Top Items by Value</h3>
            <div className="top-items-list">
              {topItems.slice(0, 5).map((item, i) => (
                <div key={i} className="top-item">
                  <span className="rank">{i + 1}</span>
                  <div className="item-info"><span className="name">{item.name}</span><span className="sku">{item.sku}</span></div>
                  <span className="item-value">${(item.quantity * item.price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lowstock' && (
        <div className="report-section">
          <div className="report-card full">
            <h3>Low Stock Alerts</h3>
            {lowStock.length === 0 ? <p className="no-data">All items are well stocked!</p> : (
              <div className="low-stock-list">
                {lowStock.map((item, i) => (
                  <div key={i} className="low-stock-item">
                    <div className="item-info">
                      <span className="name">{item.name}</span>
                      <span className="sku">{item.sku}</span>
                    </div>
                    <div className="stock-info">
                      <span className="current">Qty: {item.quantity}</span>
                      <span className="reorder">Reorder: {item.reorderLevel}</span>
                    </div>
                    <span className={`severity ${item.quantity === 0 ? 'critical' : 'warning'}`}>
                      {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
