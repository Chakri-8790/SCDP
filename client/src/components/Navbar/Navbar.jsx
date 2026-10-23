import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Bell, Search, Settings, LogOut, Shield,
  BarChart2, Menu, ChevronDown, AlertTriangle, Info,
  CheckCircle, X, Check, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials, formatTimeAgo } from '../../utils/helpers';
import api from '../../services/api';
import '../../styles/navbar.css';

/* ── severity → icon + color ─────────────────────────────────── */
const SEVERITY = {
  danger:  { icon: AlertTriangle, color: 'var(--danger-color)',  bg: 'var(--danger-bg)' },
  warning: { icon: AlertTriangle, color: 'var(--warning-color)', bg: 'var(--warning-bg)' },
  success: { icon: CheckCircle,   color: 'var(--success-color)', bg: 'var(--success-bg)' },
  info:    { icon: Info,          color: 'var(--info-color)',    bg: 'var(--info-bg)' },
};

const NotificationItem = ({ n, onRead, onDelete }) => {
  const meta  = SEVERITY[n.severity] || SEVERITY.info;
  const Icon  = meta.icon;
  const path  = n.link;

  return (
    <div
      className={`notif-item ${n.read ? '' : 'notif-item-unread'}`}
      onClick={() => { if (!n.read) onRead([n._id]); }}
    >
      <div className="notif-icon-wrap" style={{ background: meta.bg }}>
        <Icon size={14} style={{ color: meta.color }} />
      </div>
      <div className="notif-body">
        <div className="notif-title">{n.title}</div>
        <div className="notif-msg">{n.message}</div>
        <div className="notif-time">{formatTimeAgo(n.createdAt)}</div>
      </div>
      <div className="notif-actions">
        {path && (
          <Link to={path} className="notif-action-btn" title="View"
            onClick={e => e.stopPropagation()}>
            →
          </Link>
        )}
        <button className="notif-action-btn notif-delete-btn"
          title="Delete"
          onClick={e => { e.stopPropagation(); onDelete(n._id); }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [notifOpen,    setNotifOpen]        = useState(false);
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
  const [notifLoading,  setNotifLoading]    = useState(false);
  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);

  /* ── click outside ──────────────────────────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── poll unread count every 30 s ───────────────────────────── */
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/count');
      setUnreadCount(res.data.count);
    } catch { /* silently ignore */ }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const t = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(t);
  }, [fetchUnreadCount]);

  /* ── load notifications when panel opens ───────────────────── */
  const openNotif = async () => {
    setNotifOpen(o => !o);
    if (!notifOpen) {
      setNotifLoading(true);
      try {
        const res = await api.get('/notifications?limit=20');
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      } catch { /* silently ignore */ }
      finally { setNotifLoading(false); }
    }
  };

  /* ── mark read ──────────────────────────────────────────────── */
  const handleRead = async (ids) => {
    try {
      const res = await api.put('/notifications/read', { ids });
      setUnreadCount(res.data.unreadCount);
      setNotifications(prev => prev.map(n => ids.includes(n._id) ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  const handleReadAll = async () => {
    try {
      const res = await api.put('/notifications/read', { all: true });
      setUnreadCount(res.data.unreadCount);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  /* ── delete ─────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - (notifications.find(n => n._id === id && !n.read) ? 1 : 0)));
    } catch { /* ignore */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); setDropdownOpen(false); };

  return (
    <header className="navbar" role="banner">
      <button className="navbar-hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <Link to="/dashboard" className="navbar-brand" aria-label="SmartConstruct AI Home">
        <div className="navbar-logo" aria-hidden="true"><BarChart2 size={20} /></div>
        <div className="navbar-brand-text">
          <div className="navbar-brand-name">SmartConstruct</div>
          <div className="navbar-brand-tag">AI Platform</div>
        </div>
      </Link>

      <div className="navbar-search" role="search">
        <Search size={15} className="navbar-search-icon" aria-hidden="true" />
        <input type="search" placeholder="Search projects, predictions..." aria-label="Search" />
      </div>

      <div className="navbar-right">
        {/* Theme toggle */}
        <button className="navbar-icon-btn" onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* ── Notification bell ─────────────────────────────── */}
        <div className="notif-wrap" ref={notifRef}>
          <button className="navbar-icon-btn notif-bell-btn" onClick={openNotif}
            aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ''}`}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-panel" role="dialog" aria-label="Notifications">
              <div className="notif-panel-header">
                <span className="notif-panel-title">
                  Notifications {unreadCount > 0 && <span className="notif-count-pill">{unreadCount}</span>}
                </span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all-btn" onClick={handleReadAll}>
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifLoading ? (
                  <div className="notif-empty">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                    <p>No notifications yet.</p>
                    <p style={{ fontSize: 12, opacity: 0.6 }}>AI alerts appear here after predictions.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <NotificationItem key={n._id} n={n} onRead={handleRead} onDelete={handleDelete} />
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="notif-panel-footer">
                  <Link to="/predictions" onClick={() => setNotifOpen(false)}
                    style={{ fontSize: 12, color: 'var(--primary-color)' }}>
                    View all predictions →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="navbar-profile" ref={dropdownRef} onClick={() => setDropdownOpen(o => !o)}>
          <div className="navbar-avatar" aria-hidden="true">{getInitials(user?.name)}</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name || 'User'}</span>
            <span className="navbar-user-role">{user?.role || 'user'}</span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: 2 }} aria-hidden="true" />

          {dropdownOpen && (
            <div className="profile-dropdown" role="menu" aria-label="User menu">
              <div className="profile-dropdown-header">
                <p>{user?.name}</p>
                <span>{user?.email}</span>
              </div>
              <button className="profile-dropdown-item"
                onClick={() => { navigate('/settings'); setDropdownOpen(false); }} role="menuitem">
                <Settings size={15} /> Settings
              </button>
              {user?.role === 'admin' && (
                <>
                  <div className="profile-dropdown-divider" role="separator" />
                  <button className="profile-dropdown-item"
                    onClick={() => { navigate('/admin'); setDropdownOpen(false); }} role="menuitem">
                    <Shield size={15} /> Admin Panel
                  </button>
                </>
              )}
              <div className="profile-dropdown-divider" role="separator" />
              <button className="profile-dropdown-item danger" onClick={handleLogout} role="menuitem">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
