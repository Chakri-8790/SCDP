import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import '../../styles/forms.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await authService.resetPassword(token, form.password, form.confirmPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setApiError(err.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--success-color)' }}>
              <CheckCircle size={28} />
            </div>
            <h1 className="auth-title">Password updated</h1>
            <p className="auth-subtitle">Your password has been reset. Redirecting to login…</p>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Enter a new password for your account.</p>
            </div>
            {apiError && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: 20 }}>
                <span>{apiError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="password">New Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon-left" />
                  <input id="password" type={showPwd ? 'text' : 'password'}
                    className={`form-input has-icon-left has-icon-right ${errors.password ? 'error' : ''}`}
                    placeholder="Min. 6 characters" value={form.password}
                    onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })); }}
                    autoComplete="new-password" />
                  <button type="button" className="password-toggle" onClick={() => setShowPwd(s => !s)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error" role="alert">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm">Confirm Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon-left" />
                  <input id="confirm" type="password"
                    className={`form-input has-icon-left ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Repeat new password" value={form.confirmPassword}
                    onChange={(e) => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setErrors(er => ({ ...er, confirmPassword: '' })); }}
                    autoComplete="new-password" />
                </div>
                {errors.confirmPassword && <span className="form-error" role="alert">{errors.confirmPassword}</span>}
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Update Password</Button>
            </form>
            <div className="auth-footer"><Link to="/login">Back to Login</Link></div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
