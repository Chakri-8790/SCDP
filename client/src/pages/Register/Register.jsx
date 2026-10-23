import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Shield, KeyRound, ArrowRight, BarChart2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/forms.css';
import './Register.css';

/* password strength helper */
const getStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-5
};

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const strengthColor = ['', '#dc2626', '#d97706', '#ca8a04', '#059669', '#059669'];

const Register = () => {
  const { register, registerAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // default to admin tab if ?mode=admin in URL
  const defaultMode = new URLSearchParams(location.search).get('mode') === 'admin' ? 'admin' : 'user';
  const [mode, setMode] = useState(defaultMode);

  // user form
  const [uForm,    setUForm]    = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [uErrors,  setUErrors]  = useState({});
  const [uApiErr,  setUApiErr]  = useState('');
  const [uLoading, setULoading] = useState(false);
  const [uShowPwd, setUShowPwd] = useState(false);
  const [uShowCfm, setUShowCfm] = useState(false);

  // admin form
  const [aForm,    setAForm]    = useState({ name: '', email: '', password: '', confirmPassword: '', adminCode: '' });
  const [aErrors,  setAErrors]  = useState({});
  const [aApiErr,  setAApiErr]  = useState('');
  const [aLoading, setALoading] = useState(false);
  const [aShowPwd, setAShowPwd] = useState(false);
  const [aShowCfm, setAShowCfm] = useState(false);
  const [codeStatus, setCodeStatus] = useState('idle'); // 'idle'|'valid'|'invalid'

  const uStrength = getStrength(uForm.password);
  const aStrength = getStrength(aForm.password);

  /* validate SCDP format live */
  useEffect(() => {
    const raw = aForm.adminCode.trim().toUpperCase();
    if (!raw) { setCodeStatus('idle'); return; }
    setCodeStatus(/^SCDP-\d{4}$/.test(raw) ? 'valid' : 'invalid');
  }, [aForm.adminCode]);

  /* ── validators ──────────────────────────────────────────── */
  const validateUser = () => {
    const e = {};
    if (!uForm.name.trim())  e.name = 'Full name is required';
    if (!uForm.email)        e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(uForm.email)) e.email = 'Enter a valid email';
    if (!uForm.password)     e.password = 'Password is required';
    else if (uForm.password.length < 6) e.password = 'Min. 6 characters';
    if (uForm.password !== uForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const validateAdmin = () => {
    const e = {};
    if (!aForm.name.trim())  e.name = 'Full name is required';
    if (!aForm.email)        e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(aForm.email)) e.email = 'Enter a valid email';
    if (!aForm.password)     e.password = 'Password is required';
    else if (aForm.password.length < 6) e.password = 'Min. 6 characters';
    if (aForm.password !== aForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    const code = aForm.adminCode.trim().toUpperCase();
    if (!code) e.adminCode = 'Admin invite code is required';
    else if (!/^SCDP-\d{4}$/.test(code)) e.adminCode = 'Format must be SCDP-XXXX (e.g. SCDP-0042)';
    return e;
  };

  /* ── submit ──────────────────────────────────────────────── */
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const v = validateUser();
    if (Object.keys(v).length) { setUErrors(v); return; }
    setUErrors({}); setUApiErr(''); setULoading(true);
    try {
      await register({ name: uForm.name, email: uForm.email, password: uForm.password, confirmPassword: uForm.confirmPassword });
      navigate('/dashboard');
    } catch (err) {
      setUApiErr(err.message || 'Registration failed. Please try again.');
    } finally { setULoading(false); }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const v = validateAdmin();
    if (Object.keys(v).length) { setAErrors(v); return; }
    setAErrors({}); setAApiErr(''); setALoading(true);
    try {
      await registerAdmin({
        name: aForm.name, email: aForm.email,
        password: aForm.password, confirmPassword: aForm.confirmPassword,
        adminCode: aForm.adminCode.trim().toUpperCase(),
      });
      navigate('/admin');
    } catch (err) {
      setAApiErr(err.message || 'Admin registration failed. Check your invite code.');
    } finally { setALoading(false); }
  };

  /* ── field setters ───────────────────────────────────────── */
  const setU = (f) => (e) => { setUForm(p => ({ ...p, [f]: e.target.value })); if (uErrors[f]) setUErrors(p => ({ ...p, [f]: '' })); setUApiErr(''); };
  const setA = (f) => (e) => { setAForm(p => ({ ...p, [f]: e.target.value })); if (aErrors[f]) setAErrors(p => ({ ...p, [f]: '' })); setAApiErr(''); };

  const switchMode = (m) => { setMode(m); setUApiErr(''); setAApiErr(''); };

  /* ── strength bar ────────────────────────────────────────── */
  const StrengthBar = ({ score }) => score === 0 ? null : (
    <div className="reg-strength" aria-label={`Password strength: ${strengthLabel[score]}`}>
      <div className="reg-strength-bars">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="reg-strength-seg"
            style={{ background: i <= score ? strengthColor[score] : 'var(--border-color)' }}
          />
        ))}
      </div>
      <span style={{ color: strengthColor[score] }}>{strengthLabel[score]}</span>
    </div>
  );

  return (
    <div className="reg-root">

      {/* ── Brand strip ────────────────────────────────────── */}
      <div className={`reg-brand ${mode === 'admin' ? 'reg-brand-admin' : ''}`}>
        <div className="reg-brand-inner">
          <div className="reg-brand-logo">
            <BarChart2 size={28} />
          </div>
          <h1 className="reg-brand-name">SmartConstruct AI</h1>
          <p className="reg-brand-tag">Join thousands of construction professionals</p>

          {mode === 'user' ? (
            <ul className="reg-brand-perks">
              {['Free account — no credit card', 'AI delay predictions', '19-feature risk engine', 'Full analytics dashboard'].map(p => (
                <li key={p}><CheckCircle2 size={15} />{p}</li>
              ))}
            </ul>
          ) : (
            <div className="reg-brand-admin-info">
              <div className="reg-brand-admin-icon"><Shield size={32} /></div>
              <p>Admin accounts require a valid <strong>SCDP-XXXX</strong> invite code issued by the platform owner.</p>
              <p>Each code is single-use and grants full administrator privileges.</p>
            </div>
          )}

          <div className="reg-brand-bottom">
            Already have an account? <Link to="/login" className="reg-brand-link">Sign in</Link>
          </div>
        </div>
      </div>

      {/* ── Form panel ─────────────────────────────────────── */}
      <div className="reg-form-panel">
        <div className="reg-form-inner">

          {/* mode toggle */}
          <div className="reg-tabs" role="tablist">
            <button role="tab" aria-selected={mode === 'user'}
              className={`reg-tab ${mode === 'user' ? 'active' : ''}`}
              onClick={() => switchMode('user')} type="button">
              <User size={14} /> User Account
            </button>
            <button role="tab" aria-selected={mode === 'admin'}
              className={`reg-tab reg-tab-admin ${mode === 'admin' ? 'active' : ''}`}
              onClick={() => switchMode('admin')} type="button">
              <Shield size={14} /> Admin Account
            </button>
          </div>

          {/* ══ USER REGISTER ══════════════════════════════════ */}
          {mode === 'user' && (
            <div className="reg-panel">
              <div className="reg-panel-header">
                <div className="reg-panel-icon reg-panel-icon-user"><User size={22} /></div>
                <h2 className="reg-panel-title">Create your account</h2>
                <p className="reg-panel-sub">Start predicting construction delays today</p>
              </div>

              {uApiErr && <div className="reg-alert reg-alert-error" role="alert"><span>⚠</span> {uApiErr}</div>}

              <form onSubmit={handleUserSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="u-name">Full Name <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon-left" />
                    <input id="u-name" type="text"
                      className={`form-input has-icon-left ${uErrors.name ? 'error' : ''}`}
                      placeholder="Jane Smith" value={uForm.name} onChange={setU('name')} autoComplete="name" />
                  </div>
                  {uErrors.name && <span className="form-error" role="alert">{uErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="u-email">Email Address <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon-left" />
                    <input id="u-email" type="email"
                      className={`form-input has-icon-left ${uErrors.email ? 'error' : ''}`}
                      placeholder="you@example.com" value={uForm.email} onChange={setU('email')} autoComplete="email" />
                  </div>
                  {uErrors.email && <span className="form-error" role="alert">{uErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="u-pwd">Password <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input id="u-pwd" type={uShowPwd ? 'text' : 'password'}
                      className={`form-input has-icon-left has-icon-right ${uErrors.password ? 'error' : ''}`}
                      placeholder="Min. 6 characters" value={uForm.password} onChange={setU('password')} autoComplete="new-password" />
                    <button type="button" className="password-toggle" onClick={() => setUShowPwd(s => !s)} aria-label="Toggle password">
                      {uShowPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <StrengthBar score={uStrength} />
                  {uErrors.password && <span className="form-error" role="alert">{uErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="u-cfm">Confirm Password <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input id="u-cfm" type={uShowCfm ? 'text' : 'password'}
                      className={`form-input has-icon-left has-icon-right ${uErrors.confirmPassword ? 'error' : ''}`}
                      placeholder="Repeat password" value={uForm.confirmPassword} onChange={setU('confirmPassword')} autoComplete="new-password" />
                    <button type="button" className="password-toggle" onClick={() => setUShowCfm(s => !s)} aria-label="Toggle confirm">
                      {uShowCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {uErrors.confirmPassword && <span className="form-error" role="alert">{uErrors.confirmPassword}</span>}
                </div>

                <button type="submit" className="reg-submit-btn reg-submit-user" disabled={uLoading}>
                  {uLoading
                    ? <span className="reg-spinner" aria-hidden="true" />
                    : <><span>Create Account</span><ArrowRight size={15} /></>}
                </button>
              </form>

              <p className="reg-panel-footer">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
          )}

          {/* ══ ADMIN REGISTER ════════════════════════════════= */}
          {mode === 'admin' && (
            <div className="reg-panel reg-panel-admin-mode">
              <div className="reg-panel-header">
                <div className="reg-panel-icon reg-panel-icon-admin"><Shield size={22} /></div>
                <h2 className="reg-panel-title">Create Admin Account</h2>
                <p className="reg-panel-sub">Requires a valid SCDP-XXXX invite code</p>
              </div>

              {aApiErr && <div className="reg-alert reg-alert-error" role="alert"><span>⚠</span> {aApiErr}</div>}

              <form onSubmit={handleAdminSubmit} noValidate>
                {/* Invite code — prominent, first */}
                <div className="form-group">
                  <label className="form-label" htmlFor="a-code">
                    Admin Invite Code <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <KeyRound size={16} className="input-icon-left" />
                    <input id="a-code" type="text"
                      className={`form-input has-icon-left ${aErrors.adminCode ? 'error' : codeStatus === 'valid' ? 'valid' : ''}`}
                      placeholder="SCDP-XXXX"
                      value={aForm.adminCode}
                      onChange={(e) => { setA('adminCode')(e); }}
                      maxLength={9}
                      autoComplete="off"
                      style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}
                    />
                    {codeStatus === 'valid' && (
                      <span className="reg-code-ok" aria-label="Valid format"><CheckCircle2 size={16} /></span>
                    )}
                  </div>
                  {aErrors.adminCode
                    ? <span className="form-error" role="alert">{aErrors.adminCode}</span>
                    : <span className="form-hint">Format: SCDP-0001 · Single-use code provided by the platform owner</span>
                  }
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="a-name">Full Name <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon-left" />
                    <input id="a-name" type="text"
                      className={`form-input has-icon-left ${aErrors.name ? 'error' : ''}`}
                      placeholder="Admin Name" value={aForm.name} onChange={setA('name')} autoComplete="name" />
                  </div>
                  {aErrors.name && <span className="form-error" role="alert">{aErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="a-email">Email Address <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon-left" />
                    <input id="a-email" type="email"
                      className={`form-input has-icon-left ${aErrors.email ? 'error' : ''}`}
                      placeholder="admin@example.com" value={aForm.email} onChange={setA('email')} autoComplete="email" />
                  </div>
                  {aErrors.email && <span className="form-error" role="alert">{aErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="a-pwd">Password <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input id="a-pwd" type={aShowPwd ? 'text' : 'password'}
                      className={`form-input has-icon-left has-icon-right ${aErrors.password ? 'error' : ''}`}
                      placeholder="Min. 6 characters" value={aForm.password} onChange={setA('password')} autoComplete="new-password" />
                    <button type="button" className="password-toggle" onClick={() => setAShowPwd(s => !s)} aria-label="Toggle">
                      {aShowPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <StrengthBar score={aStrength} />
                  {aErrors.password && <span className="form-error" role="alert">{aErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="a-cfm">Confirm Password <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon-left" />
                    <input id="a-cfm" type={aShowCfm ? 'text' : 'password'}
                      className={`form-input has-icon-left has-icon-right ${aErrors.confirmPassword ? 'error' : ''}`}
                      placeholder="Repeat password" value={aForm.confirmPassword} onChange={setA('confirmPassword')} autoComplete="new-password" />
                    <button type="button" className="password-toggle" onClick={() => setAShowCfm(s => !s)} aria-label="Toggle">
                      {aShowCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {aErrors.confirmPassword && <span className="form-error" role="alert">{aErrors.confirmPassword}</span>}
                </div>

                <button type="submit" className="reg-submit-btn reg-submit-admin" disabled={aLoading}>
                  {aLoading
                    ? <span className="reg-spinner reg-spinner-light" aria-hidden="true" />
                    : <><Shield size={15} /><span>Create Admin Account</span></>}
                </button>
              </form>

              <p className="reg-panel-footer">
                Already have an account? <Link to="/login?mode=admin">Admin Login</Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
