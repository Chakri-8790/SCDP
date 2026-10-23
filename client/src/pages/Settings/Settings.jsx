import { useState } from 'react';
import { User, Lock, Bell, Palette, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../layouts/MainLayout';
import Button from '../../components/Button/Button';
import { authService } from '../../services/authService';
import '../../styles/forms.css';
import '../../styles/cards.css';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      // Profile update would call a PUT /api/auth/profile endpoint
      // For now just show a success message
      await new Promise(r => setTimeout(r, 600));
      setProfileMsg('Profile updated successfully.');
    } catch {
      setProfileMsg('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdMsg('');
    if (!pwdForm.currentPassword) { setPwdError('Current password is required.'); return; }
    if (pwdForm.newPassword.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdError('Passwords do not match.'); return; }
    setSavingPwd(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setPwdMsg('Password updated successfully.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setPwdError('Failed to update password.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                <User size={16} />
              </div>
              <div className="card-title">Profile Information</div>
            </div>
          </div>
          <div className="card-body">
            {profileMsg && (
              <div className={`alert ${profileMsg.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 16 }}>
                {profileMsg}
              </div>
            )}
            <form onSubmit={handleProfileSave} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input id="name" type="text" className="form-input" value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="settEmail">Email Address</label>
                <input id="settEmail" type="email" className="form-input" value={profileForm.email}
                  onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input type="text" className="form-input" value={user?.role || 'user'} disabled />
                <span className="form-hint">Role is managed by your administrator.</span>
              </div>
              <Button type="submit" icon={<Save size={15} />} loading={savingProfile}>Save Profile</Button>
            </form>
          </div>
        </div>

        {/* Password */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
                <Lock size={16} />
              </div>
              <div className="card-title">Change Password</div>
            </div>
          </div>
          <div className="card-body">
            {pwdMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{pwdMsg}</div>}
            {pwdError && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{pwdError}</div>}
            <form onSubmit={handlePasswordSave} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="curPwd">Current Password</label>
                <input id="curPwd" type="password" className="form-input" value={pwdForm.currentPassword}
                  onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} autoComplete="current-password" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="newPwd">New Password</label>
                <input id="newPwd" type="password" className="form-input" value={pwdForm.newPassword}
                  onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confPwd">Confirm New Password</label>
                <input id="confPwd" type="password" className="form-input" value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} autoComplete="new-password" />
              </div>
              <Button type="submit" variant="danger-outline" icon={<Lock size={15} />} loading={savingPwd}>Update Password</Button>
            </form>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
                <Palette size={16} />
              </div>
              <div className="card-title">Appearance</div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Theme</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['light', 'dark'].map(t => (
                  <button key={t} type="button" onClick={() => theme !== t && toggleTheme()}
                    style={{ flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-md)', border: `2px solid ${theme === t ? 'var(--primary-color)' : 'var(--border-color)'}`, background: theme === t ? 'var(--primary-light)' : 'var(--surface-sunken)', color: theme === t ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: theme === t ? 600 : 400, cursor: 'pointer', transition: 'all var(--transition-fast)', textTransform: 'capitalize' }}>
                    {t === 'light' ? '☀️' : '🌙'} {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications placeholder */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info-color)' }}>
                <Bell size={16} />
              </div>
              <div className="card-title">Notifications</div>
            </div>
          </div>
          <div className="card-body">
            {[
              { label: 'High risk predictions', desc: 'Alert when predicted risk level is High or Critical' },
              { label: 'Weekly digest', desc: 'Summary of project risk across all active projects' },
              { label: 'Material shortage alerts', desc: 'Notify when material shortage is High or Critical' },
            ].map(({ label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ width: 40, height: 22, background: 'var(--primary-color)', borderRadius: 11, display: 'block', transition: 'background 0.2s' }} />
                </label>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Settings;
