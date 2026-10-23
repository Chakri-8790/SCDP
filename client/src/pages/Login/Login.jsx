import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, User, ArrowRight, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/forms.css';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from?.pathname || null;

  // shared state
  const [activePanel, setActivePanel] = useState('user'); // 'user' | 'admin'

  // user form
  const [userForm, setUserForm]       = useState({ email: '', password: '', rememberMe: false });
  const [userErrors, setUserErrors]   = useState({});
  const [userApiErr, setUserApiErr]   = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [showUserPwd, setShowUserPwd] = useState(false);

  // admin form
  const [adminForm, setAdminForm]       = useState({ email: '', password: '' });
  const [adminErrors, setAdminErrors]   = useState({});
  const [adminApiErr, setAdminApiErr]   = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminPwd, setShowAdminPwd] = useState(false);

  /* ── validation ─────────────────────────────────────────────── */
  const validateUser = () => {
    const e = {};
    if (!userForm.email)   e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(userForm.email)) e.email = 'Enter a valid email';
    if (!userForm.password) e.password = 'Password is required';
    return e;
  };

  const validateAdmin = () => {
    const e = {};
    if (!adminForm.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(adminForm.email)) e.email = 'Enter a valid email';
    if (!adminForm.password) e.password = 'Password is required';
    return e;
  };

  /* ── submit handlers ─────────────────────────────────────────── */
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const v = validateUser();
    if (Object.keys(v).length) { setUserErrors(v); return; }
    setUserErrors({}); setUserApiErr(''); setUserLoading(true);
    try {
      const res = await login({ email: userForm.email, password: userForm.password });
      const role = res?.data?.user?.role;
      navigate(role === 'admin' ? '/admin' : (from || '/dashboard'), { replace: true });
    } catch (err) {
      setUserApiErr(err.message || 'Invalid email or password.');
    } finally { setUserLoading(false); }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const v = validateAdmin();
    if (Object.keys(v).length) { setAdminErrors(v); return; }
    setAdminErrors({}); setAdminApiErr(''); setAdminLoading(true);
    try {
      const res = await login({ email: adminForm.email, password: adminForm.password });
      const user = res?.data?.user;
      if (user?.role !== 'admin') {
        setAdminApiErr('Access denied. This portal is for administrators only.');
        setAdminLoading(false);
        return;
      }
      navigate(from || '/admin', { replace: true });
    } catch (err) {
      setAdminApiErr(err.message || 'Invalid email or password.');
    } finally { setAdminLoading(false); }
  };

  /* ── field setters ───────────────────────────────────────────── */
  const setUser  = (f) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setUserForm(p => ({ ...p, [f]: v })); if (userErrors[f]) setUserErrors(p => ({ ...p, [f]: '' })); setUserApiErr(''); };
  const setAdmin = (f) => (e) => { setAdminForm(p => ({ ...p, [f]: e.target.value })); if (adminErrors[f]) setAdminErrors(p => ({ ...p, [f]: '' })); setAdminApiErr(''); };

  return (
    <div className="login-root">
      {/* ── Left brand strip ─────────────────────────────────── */}
      <div className="login-brand">
        <div className="login-brand-inner">
          <div className="login-brand-logo">
            <BarChart2 size={28} />
          </div>
          <h1 className="login-brand-name">SmartConstruct AI</h1>
          <p className="login-brand-tagline">Construction Delay Prediction & Risk Management</p>

          <ul className="login-brand-features">
            {[
              'AI-powered delay predictions',
              'Real-time risk monitoring',
              'Actionable recommendations',
              'Project performance analytics',
            ].map(f => (
              <li key={f}>
                <span className="login-brand-check" aria-hidden="true">✓</span> {f}
              </li>
            ))}
          </ul>

          <div className="login-brand-footer">
            New to SmartConstruct?{' '}
            <Link to="/register" className="login-brand-link">Create a free account</Link>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-form-inner">

          {/* tab switcher */}
          <div className="login-tabs" role="tablist">
            <button
              role="tab" aria-selected={activePanel === 'user'}
              className={`login-tab ${activePanel === 'user' ? 'active' : ''}`}
              onClick={() => { setActivePanel('user'); setUserApiErr(''); setAdminApiErr(''); }}
              type="button"
            >
              <User size={15} /> User Login
            </button>
            <button
              role="tab" aria-selected={activePanel === 'admin'}
              className={`login-tab login-tab-admin ${activePanel === 'admin' ? 'active' : ''}`}
              onClick={() => { setActivePanel('admin'); setUserApiErr(''); setAdminApiErr(''); }}
              type="button"
            >
              <Shield size={15} /> Admin Login
            </button>
          </div>

          {/* ══ USER PANEL ══════════════════════════════════════ */}
          {activePanel === 'user' && (
            <div className="login-panel">
              <div className="login-panel-header">
                <div className="login-panel-icon login-panel-icon-user">
                  <User size={24} />
                </div>
                <h2 className="login-panel-title">Welcome back</h2>
                <p className="login-panel-sub">Sign in to your SmartConstruct account</p>
              </div>

              {userApiErr && (
                <div className="login-alert login-alert-error" role="alert">
                  <span>⚠</span> {userApiErr}
                </div>
              )}

              <form onSubmit={handleUserSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="u-email">
                    Email <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon-left" />
                    <input id="u-email" type="email"
                      className={`form-input has-icon-left ${userErrors.email ? 'error' : ''}`}
                      placeholder="you@example.com"
                      value={userForm.email} onChange={setUser('email')}
                      autoComplete="email" aria-invalid={!!userErrors.email}
                    />
                  </div>
                  {userErrors.email && <span className="form-error" role="alert">{userErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="u-password">
                    Password <span className="required">*</span>
                    <Link to="/forgot-password" className="label-hint" style={{ textDecoration: 'none' }}>
                      Forgot password?
                    </Link>
                  </label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input id="u-password" type={showUserPwd ? 'text' : 'password'}
                      className={`form-input has-icon-left has-icon-right ${userErrors.password ? 'error' : ''}`}
                      placeholder="Your password"
                      value={userForm.password} onChange={setUser('password')}
                      autoComplete="current-password" aria-invalid={!!userErrors.password}
                    />
                    <button type="button" className="password-toggle"
                      onClick={() => setShowUserPwd(s => !s)}
                      aria-label={showUserPwd ? 'Hide password' : 'Show password'}>
                      {showUserPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {userErrors.password && <span className="form-error" role="alert">{userErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-check">
                    <input type="checkbox" className="form-check-input"
                      checked={userForm.rememberMe} onChange={setUser('rememberMe')} />
                    <span className="form-check-label">Remember me for 7 days</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="login-submit-btn login-submit-user"
                  disabled={userLoading}
                >
                  {userLoading
                    ? <span className="login-spinner" aria-hidden="true" />
                    : <><span>Sign In</span><ArrowRight size={16} /></>
                  }
                </button>
              </form>

              <p className="login-panel-footer">
                Don't have an account? <Link to="/register">Create one free</Link>
              </p>
            </div>
          )}

          {/* ══ ADMIN PANEL ═════════════════════════════════════ */}
          {activePanel === 'admin' && (
            <div className="login-panel">
              <div className="login-panel-header">
                <div className="login-panel-icon login-panel-icon-admin">
                  <Shield size={24} />
                </div>
                <h2 className="login-panel-title">Admin Portal</h2>
                <p className="login-panel-sub">Restricted — authorised administrators only</p>
              </div>

              <div className="login-admin-notice" role="note">
                <Shield size={13} />
                Only accounts with administrator privileges can sign in here.
              </div>

              {adminApiErr && (
                <div className="login-alert login-alert-error" role="alert">
                  <span>⚠</span> {adminApiErr}
                </div>
              )}

              <form onSubmit={handleAdminSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="a-email">
                    Admin Email <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon-left" />
                    <input id="a-email" type="email"
                      className={`form-input has-icon-left ${adminErrors.email ? 'error' : ''}`}
                      placeholder="admin@example.com"
                      value={adminForm.email} onChange={setAdmin('email')}
                      autoComplete="email" aria-invalid={!!adminErrors.email}
                    />
                  </div>
                  {adminErrors.email && <span className="form-error" role="alert">{adminErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="a-password">
                    Password <span className="required">*</span>
                    <Link to="/forgot-password" className="label-hint" style={{ textDecoration: 'none' }}>
                      Forgot password?
                    </Link>
                  </label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input id="a-password" type={showAdminPwd ? 'text' : 'password'}
                      className={`form-input has-icon-left has-icon-right ${adminErrors.password ? 'error' : ''}`}
                      placeholder="Admin password"
                      value={adminForm.password} onChange={setAdmin('password')}
                      autoComplete="current-password" aria-invalid={!!adminErrors.password}
                    />
                    <button type="button" className="password-toggle"
                      onClick={() => setShowAdminPwd(s => !s)}
                      aria-label={showAdminPwd ? 'Hide' : 'Show'}>
                      {showAdminPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {adminErrors.password && <span className="form-error" role="alert">{adminErrors.password}</span>}
                </div>

                <button
                  type="submit"
                  className="login-submit-btn login-submit-admin"
                  disabled={adminLoading}
                >
                  {adminLoading
                    ? <span className="login-spinner login-spinner-light" aria-hidden="true" />
                    : <><Shield size={15} /><span>Sign in as Admin</span></>
                  }
                </button>
              </form>

              <p className="login-panel-footer">
                Need admin access?{' '}
                <Link to="/register?mode=admin">Register with invite code</Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
