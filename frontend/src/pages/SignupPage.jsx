import { Link, useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '../api';

function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const navigate = useNavigate();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" data-testid="signup-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="login-brand">
            <Package className="brand-icon" />
            <span>Gorecory Inventory Tracker</span>
          </Link>
        </div>

        <div className="login-card">
          <h1>Create your account</h1>
          <p className="login-subtitle">Start managing your inventory in minutes</p>

          {error && <div className="error-message" data-testid="signup-error">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  data-testid="signup-name-input"
                  type="text"
                  id="name"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={update('name')}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  data-testid="signup-email-input"
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  data-testid="signup-password-input"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={update('password')}
                  required
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  data-testid="signup-confirm-input"
                  type={showPassword ? 'text' : 'password'}
                  id="confirm"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={update('confirm')}
                  required
                />
              </div>
            </div>

            <button data-testid="signup-submit-btn" type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : 'Create account'}
            </button>
          </form>

          <p className="signup-link">
            Already have an account? <Link to="/login" data-testid="signup-goto-login">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-showcase">
          <h2>Manage your inventory with confidence</h2>
          <ul className="showcase-features">
            <li>Track inventory across multiple locations</li>
            <li>Streamline order fulfillment</li>
            <li>Get real-time business insights</li>
            <li>Integrate with your favorite tools</li>
          </ul>
          <div className="showcase-stats">
            <div className="stat"><span className="stat-number">10,000+</span><span className="stat-label">Businesses</span></div>
            <div className="stat"><span className="stat-number">50M+</span><span className="stat-label">Items Tracked</span></div>
            <div className="stat"><span className="stat-number">99.9%</span><span className="stat-label">Uptime</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
