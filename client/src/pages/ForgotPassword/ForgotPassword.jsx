import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, KeyRound, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import '../../styles/forms.css';
import './ForgotPassword.css';

/* ── 3-step flow: EMAIL → OTP → NEW PASSWORD ─────────────────── */
const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', DONE: 'done' };

/* ── single OTP digit input ──────────────────────────────────── */
const OtpInput = ({ value, onChange, onKeyDown, inputRef, index }) => (
  <input
    ref={inputRef}
    type="text"
    inputMode="numeric"
    pattern="\d"
    maxLength={1}
    className="fp-otp-digit"
    value={value}
    onChange={e => onChange(e.target.value, index)}
    onKeyDown={e => onKeyDown(e, index)}
    aria-label={`OTP digit ${index + 1}`}
    autoComplete="off"
  />
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep]           = useState(STEPS.EMAIL);
  const [email, setEmail]         = useState('');
  const [emailError, setEmailError] = useState('');
  const [digits, setDigits]       = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError]   = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [pwdErrors, setPwdErrors] = useState({});
  const [showPwd, setShowPwd]     = useState(false);
  const [showCfm, setShowCfm]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const digitRefs = useRef([]);
  digitRefs.current = Array.from({ length: 6 }, (_, i) => digitRefs.current[i] || { current: null });

  // Cooldown countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ── Step 1: send OTP ─────────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) { setEmailError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email address'); return; }
    setEmailError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(STEPS.OTP);
      setResendCooldown(60);
      setTimeout(() => digitRefs.current[0]?.current?.focus(), 100);
    } catch (err) {
      setEmailError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP digit handlers ───────────────────────────────────── */
  const handleDigitChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return; // digits only
    const next = [...digits];
    next[idx] = val.slice(-1); // take last char if pasted multi
    setDigits(next);
    setOtpError('');
    if (val && idx < 5) digitRefs.current[idx + 1]?.current?.focus();
    // auto-submit when all filled
    if (val && idx === 5 && next.every(d => d !== '')) {
      verifyOtp(next.join(''));
    }
  };

  const handleDigitKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.current?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0)  digitRefs.current[idx - 1]?.current?.focus();
    if (e.key === 'ArrowRight' && idx < 5) digitRefs.current[idx + 1]?.current?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    digitRefs.current[focusIdx]?.current?.focus();
    if (pasted.length === 6) verifyOtp(pasted);
  };

  /* ── Step 2: verify OTP ───────────────────────────────────── */
  const verifyOtp = async (code) => {
    const otp = code || digits.join('');
    if (otp.length < 6) { setOtpError('Enter all 6 digits'); return; }
    setLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      setResetToken(res.data.resetToken);
      setStep(STEPS.PASSWORD);
    } catch (err) {
      setOtpError(err.message || 'Incorrect OTP. Please try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => digitRefs.current[0]?.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: set new password ─────────────────────────────── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!password)             e2.password = 'Password is required';
    else if (password.length < 6) e2.password = 'Min. 6 characters';
    if (password !== confirm)  e2.confirm = 'Passwords do not match';
    if (Object.keys(e2).length) { setPwdErrors(e2); return; }
    setPwdErrors({});
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: resetToken, password, confirmPassword: confirm,
      });
      setStep(STEPS.DONE);
    } catch (err) {
      setPwdErrors({ api: err.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ───────────────────────────────────────────── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setDigits(['', '', '', '', '', '']);
    setOtpError('');
    await handleSendOtp();
  };

  /* ═══════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════ */
  return (
    <AuthLayout>
      <div className="auth-card fp-card">

        {/* ── STEP 1: Email ────────────────────────────────────── */}
        {step === STEPS.EMAIL && (
          <>
            <div className="auth-header">
              <div className="fp-step-icon fp-step-icon-blue"><Mail size={26} /></div>
              <h1 className="auth-title">Forgot password?</h1>
              <p className="auth-subtitle">Enter your registered email — we'll send a 6-digit OTP.</p>
            </div>

            {emailError && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: 20 }}>
                <span>⚠ {emailError}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-email">Email Address <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon-left" />
                  <input id="fp-email" type="email"
                    className={`form-input has-icon-left ${emailError ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    autoComplete="email"
                  />
                </div>
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading}>Send OTP</Button>
            </form>

            <div className="auth-footer">
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </>
        )}

        {/* ── STEP 2: OTP Entry ────────────────────────────────── */}
        {step === STEPS.OTP && (
          <>
            <div className="auth-header">
              <div className="fp-step-icon fp-step-icon-blue"><KeyRound size={26} /></div>
              <h1 className="auth-title">Enter OTP</h1>
              <p className="auth-subtitle">
                We sent a 6-digit code to <strong>{email}</strong>.
                Check your inbox and spam folder.
              </p>
            </div>

            {otpError && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
                <span>⚠ {otpError}</span>
              </div>
            )}

            <div className="fp-otp-row" onPaste={handleOtpPaste} role="group" aria-label="OTP input">
              {digits.map((d, i) => (
                <OtpInput
                  key={i}
                  index={i}
                  value={d}
                  onChange={handleDigitChange}
                  onKeyDown={handleDigitKeyDown}
                  inputRef={el => {
                    if (!digitRefs.current[i]) digitRefs.current[i] = { current: null };
                    digitRefs.current[i].current = el;
                  }}
                />
              ))}
            </div>

            <Button
              fullWidth size="lg" loading={loading}
              onClick={() => verifyOtp()}
              disabled={digits.some(d => !d)}
            >
              Verify OTP
            </Button>

            <div className="fp-resend-row">
              {resendCooldown > 0 ? (
                <span className="fp-resend-timer">
                  <RefreshCw size={13} /> Resend in {resendCooldown}s
                </span>
              ) : (
                <button className="fp-resend-btn" onClick={handleResend} type="button">
                  <RefreshCw size={13} /> Resend OTP
                </button>
              )}
              <button className="fp-back-link" onClick={() => setStep(STEPS.EMAIL)} type="button">
                <ArrowLeft size={13} /> Change email
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: New Password ─────────────────────────────── */}
        {step === STEPS.PASSWORD && (
          <>
            <div className="auth-header">
              <div className="fp-step-icon fp-step-icon-green"><Lock size={26} /></div>
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Choose a strong password for your account.</p>
            </div>

            {pwdErrors.api && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
                <span>⚠ {pwdErrors.api}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-pwd">New Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon-left" />
                  <input id="fp-pwd" type={showPwd ? 'text' : 'password'}
                    className={`form-input has-icon-left has-icon-right ${pwdErrors.password ? 'error' : ''}`}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwdErrors(p => ({ ...p, password: '' })); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPwd(s => !s)} aria-label="Toggle">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdErrors.password && <span className="form-error" role="alert">{pwdErrors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fp-cfm">Confirm Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon-left" />
                  <input id="fp-cfm" type={showCfm ? 'text' : 'password'}
                    className={`form-input has-icon-left has-icon-right ${pwdErrors.confirm ? 'error' : ''}`}
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setPwdErrors(p => ({ ...p, confirm: '' })); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowCfm(s => !s)} aria-label="Toggle">
                    {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdErrors.confirm && <span className="form-error" role="alert">{pwdErrors.confirm}</span>}
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>Reset Password</Button>
            </form>
          </>
        )}

        {/* ── STEP 4: Done ─────────────────────────────────────── */}
        {step === STEPS.DONE && (
          <div style={{ textAlign: 'center' }}>
            <div className="fp-step-icon fp-step-icon-green" style={{ margin: '0 auto 20px' }}>
              <CheckCircle size={30} />
            </div>
            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle" style={{ marginBottom: 28 }}>
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Button fullWidth size="lg" onClick={() => navigate('/login')}>Go to Login</Button>
          </div>
        )}

        {/* Progress dots */}
        {step !== STEPS.DONE && (
          <div className="fp-progress-dots">
            {[STEPS.EMAIL, STEPS.OTP, STEPS.PASSWORD].map((s, i) => (
              <span key={s} className={`fp-dot ${step === s ? 'active' : [STEPS.OTP, STEPS.PASSWORD, STEPS.DONE].indexOf(step) > [STEPS.EMAIL, STEPS.OTP, STEPS.PASSWORD].indexOf(s) - 1 ? 'done' : ''}`} />
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
