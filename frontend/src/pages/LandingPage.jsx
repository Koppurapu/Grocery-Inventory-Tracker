import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Warehouse, TrendingUp, CreditCard, BarChart3, Users, Truck, CheckCircle } from 'lucide-react';

function LandingPage() {
  return (
    <div className="landing">
      <nav className="navbar">
        <div className="nav-brand">
          <Package className="brand-icon" />
          <span>Gorecory Inventory Tracker</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#integrations">Integrations</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn-login">Login</Link>
          <Link to="/dashboard" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>Engineered to handle all your inventory needs</h1>
          <p>Your complete inventory management software to track inventory, streamline sales, fulfill orders, and oversee warehouses from a single window.</p>
          <div className="hero-cta">
            <Link to="/dashboard" className="btn-primary btn-large">Create your free account</Link>
            <button className="btn-secondary">Talk to sales</button>
          </div>
          <p className="hero-trust">Trusted by 10,000+ businesses worldwide</p>
        </div>
        <div className="hero-image">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
            <div className="preview-content">
              <div className="preview-stats">
                <div className="stat-card">
                  <span className="stat-label">Total Items</span>
                  <span className="stat-value">2,847</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Orders Today</span>
                  <span className="stat-value">156</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Revenue</span>
                  <span className="stat-value">$24,589</span>
                </div>
              </div>
              <div className="preview-chart">
                <div className="chart-bar" style={{height: '60%'}}></div>
                <div className="chart-bar" style={{height: '80%'}}></div>
                <div className="chart-bar" style={{height: '45%'}}></div>
                <div className="chart-bar" style={{height: '90%'}}></div>
                <div className="chart-bar" style={{height: '70%'}}></div>
                <div className="chart-bar" style={{height: '85%'}}></div>
                <div className="chart-bar" style={{height: '55%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-grid" id="features">
        <div className="section-header">
          <h2>Everything you need to manage your inventory operations</h2>
        </div>
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon inventory-icon">
              <Package />
            </div>
            <h3>Inventory</h3>
            <p>Tracking and controlling your inventory is a lot easier with complete inventory software that puts an end to stock mismatches.</p>
            <ul className="feature-list">
              <li><CheckCircle size={14} /> Sort items, create item groups</li>
              <li><CheckCircle size={14} /> Trace item movements</li>
              <li><CheckCircle size={14} /> Set reorder points</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon order-icon">
              <ShoppingCart />
            </div>
            <h3>Order</h3>
            <p>Power your online sales with comprehensive software to manage inventory and dedicate more time to growing your business.</p>
            <ul className="feature-list">
              <li><CheckCircle size={14} /> Manage sales and purchase orders</li>
              <li><CheckCircle size={14} /> Streamline online sales</li>
              <li><CheckCircle size={14} /> Simplify fulfillment</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon warehouse-icon">
              <Warehouse />
            </div>
            <h3>Warehouse</h3>
            <p>Manage different locations with ease and eliminate the need for multiple spreadsheets.</p>
            <ul className="feature-list">
              <li><CheckCircle size={14} /> Handle stock across locations</li>
              <li><CheckCircle size={14} /> Transfer orders between warehouses</li>
              <li><CheckCircle size={14} /> Generate picklists</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="benefits-section">
        <div className="benefit-card">
          <div className="benefit-image">
            <div className="benefit-placeholder">
              <Package size={48} />
            </div>
          </div>
          <div className="benefit-content">
            <h3>Track effectively</h3>
            <h4>Complete visibility for your items</h4>
            <p>Track different items across locations as they move through your inventory based on serial numbers and batches.</p>
          </div>
        </div>
        <div className="benefit-card reverse">
          <div className="benefit-image">
            <div className="benefit-placeholder">
              <Warehouse size={48} />
            </div>
          </div>
          <div className="benefit-content">
            <h3>Scale efficiently</h3>
            <h4>Warehouse management</h4>
            <p>Initiate transfer orders, generate picklists, and dispatch orders from the nearest warehouse.</p>
          </div>
        </div>
        <div className="benefit-card">
          <div className="benefit-image">
            <div className="benefit-placeholder">
              <Users size={48} />
            </div>
          </div>
          <div className="benefit-content">
            <h3>Collaborate better</h3>
            <h4>Dedicated customer portal</h4>
            <p>Build stronger customer relationships with a dedicated space to view and manage all transactions, pay online, and initiate conversations.</p>
          </div>
        </div>
      </section>

      <section className="capabilities-section">
        <h2>Your next-gen inventory software</h2>
        <div className="capabilities-grid">
          <div className="capability-card">
            <div className="capability-icon">
              <Package />
            </div>
            <h3>Sell more with assemblies</h3>
            <ul>
              <li>Classify items by size, color, brand</li>
              <li>Create product assemblies with flexible pricing</li>
              <li>Generate item names and SKUs automatically</li>
            </ul>
          </div>
          <div className="capability-card">
            <div className="capability-icon">
              <TrendingUp />
            </div>
            <h3>Accelerate sales across channels</h3>
            <ul>
              <li>Integrate with Shopify, Amazon, eBay, Etsy</li>
              <li>Sync stock levels across sales channels</li>
              <li>Fulfill orders from a centralized system</li>
            </ul>
          </div>
          <div className="capability-card">
            <div className="capability-icon">
              <CreditCard />
            </div>
            <h3>Get paid faster</h3>
            <ul>
              <li>Integrate with PayPal, Stripe, and 10+ gateways</li>
              <li>Enjoy faster payments from customers</li>
              <li>Update invoice statuses in real time</li>
            </ul>
          </div>
          <div className="capability-card">
            <div className="capability-icon">
              <Truck />
            </div>
            <h3>Pack and track all your orders</h3>
            <ul>
              <li>Track package movement seamlessly</li>
              <li>Integrate with 40+ shipping carriers</li>
              <li>Generate shipping labels and send updates</li>
            </ul>
          </div>
          <div className="capability-card">
            <div className="capability-icon">
              <BarChart3 />
            </div>
            <h3>Get real-time business insights</h3>
            <ul>
              <li>Analyze sales channel performance</li>
              <li>Identify fast-selling items and trends</li>
              <li>Export detailed reports in minutes</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <h2>Trusted by businesses worldwide</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p>"We have been able to simplify our in-house inventory management with increased efficiency and flexibility."</p>
            <div className="testimonial-author">
              <div className="author-avatar">P</div>
              <div className="author-info">
                <strong>Priyal Bafna</strong>
                <span>Senior Manager, Rapido Bike</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p>"InventoryPro has been amazing for us in collecting all of our online and offline sales in one place."</p>
            <div className="testimonial-author">
              <div className="author-avatar">A</div>
              <div className="author-info">
                <strong>Adam Petyt</strong>
                <span>Director, Element Packaging</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p>"Managing stocks and returns across multiple warehouses has been easier than expected."</p>
            <div className="testimonial-author">
              <div className="author-avatar">P</div>
              <div className="author-info">
                <strong>Patrick Fletcher</strong>
                <span>Director, Alloygator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="integrations-section" id="integrations">
        <h2>Integrations to help you scale</h2>
        <p>Connect your favorite apps and gather all your information in one place</p>
        <div className="integrations-grid">
          <div className="integration-logo">Shopify</div>
          <div className="integration-logo">Amazon</div>
          <div className="integration-logo">eBay</div>
          <div className="integration-logo">Etsy</div>
          <div className="integration-logo">WooCommerce</div>
          <div className="integration-logo">Stripe</div>
          <div className="integration-logo">PayPal</div>
          <div className="integration-logo">UPS</div>
          <div className="integration-logo">FedEx</div>
          <div className="integration-logo">QuickBooks</div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Powerful inventory management software</h2>
        <p>Start your risk-free 14-day free trial today</p>
        <Link to="/dashboard" className="btn-primary btn-large">Get Started</Link>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Integrations</a>
            <a href="#">API</a>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">Help Center</a>
            <a href="#">Webinars</a>
            <a href="#">Blog</a>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
            <a href="#">Press</a>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 InventoryPro. All rights reserved.</p>
          <div className="social-links">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;