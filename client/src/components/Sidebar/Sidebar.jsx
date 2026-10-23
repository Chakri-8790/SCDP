import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Zap, History, BarChart3,
  FileText, Settings, Info, LogOut, ChevronLeft, Shield, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',    icon: FolderOpen,       label: 'Projects' },
  { to: '/prediction',  icon: Zap,              label: 'New Prediction' },
  { to: '/predictions', icon: History,          label: 'Prediction History' },
  { to: '/analytics',   icon: BarChart3,        label: 'Analytics' },
  { to: '/reports',     icon: FileText,         label: 'Reports' },
  { to: '/performance', icon: Activity,         label: 'Performance' },
  { to: '/settings',    icon: Settings,         label: 'Settings' },
  { to: '/about',       icon: Info,             label: 'About' },
];

const ADMIN_ITEMS = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
];

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        <nav className="sidebar-nav" role="navigation">
          <div className="sidebar-group">
            {!collapsed && <div className="sidebar-group-label">Main</div>}
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                data-tooltip={collapsed ? label : undefined}
                onClick={onClose}
                aria-label={label}
              >
                <Icon size={20} className="nav-icon" aria-hidden="true" />
                <span className="nav-label">{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Admin-only section */}
          {user?.role === 'admin' && (
            <div className="sidebar-group">
              {!collapsed && <div className="sidebar-group-label">Admin</div>}
              {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  data-tooltip={collapsed ? label : undefined}
                  onClick={onClose}
                  aria-label={label}
                >
                  <Icon size={20} className="nav-icon" aria-hidden="true" />
                  <span className="nav-label">{label}</span>
                </NavLink>
              ))}
            </div>
          )}

          <div className="sidebar-group">
            <button
              className="sidebar-nav-item danger"
              onClick={handleLogout}
              data-tooltip={collapsed ? 'Sign Out' : undefined}
              aria-label="Sign out"
            >
              <LogOut size={20} className="nav-icon" aria-hidden="true" />
              <span className="nav-label">Sign Out</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft size={18} className="collapse-icon" aria-hidden="true" />
            <span className="collapse-label">Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
