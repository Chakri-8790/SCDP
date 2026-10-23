import { useState, useEffect, useCallback } from 'react';
import {
  Users, Shield, UserCheck, UserCog, Trash2, Edit3,
  Search, RefreshCw, X, Check, AlertTriangle, Database,
  Activity, FolderOpen, BarChart3, Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import MainLayout from '../../layouts/MainLayout';
import StatCard from '../../components/StatCard/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import PerformanceMetrics from './PerformanceMetrics';
import './Admin.css';

/* ── helpers ──────────────────────────────────────────────────────── */
const ROLES = ['user', 'manager', 'admin'];

const roleBadgeClass = {
  user:    'badge-info',
  manager: 'badge-warning',
  admin:   'badge-danger',
};

const roleIcon = {
  user:    <UserCheck size={13} />,
  manager: <UserCog  size={13} />,
  admin:   <Shield   size={13} />,
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

/* ── Edit-role modal ──────────────────────────────────────────────── */
const EditModal = ({ user, onClose, onSave, saving }) => {
  const [role, setRole] = useState(user.role);
  const [name, setName] = useState(user.name);

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit user">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h3>Edit User</h3>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-form-group">
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              className="admin-input"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="edit-email">Email</label>
            <input id="edit-email" type="text" value={user.email} disabled className="admin-input" />
          </div>

          <div className="admin-form-group">
            <label htmlFor="edit-role">Role</label>
            <select
              id="edit-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="admin-select"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onSave(user._id, { role, name })}
            disabled={saving || (role === user.role && name.trim() === user.name)}
          >
            {saving ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Delete confirm modal ─────────────────────────────────────────── */
const DeleteModal = ({ user, onClose, onConfirm, deleting }) => (
  <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
    <div className="admin-modal admin-modal-sm">
      <div className="admin-modal-header">
        <h3>Delete User</h3>
        <button className="admin-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </div>
      <div className="admin-modal-body">
        <div className="admin-delete-warning">
          <AlertTriangle size={32} className="admin-delete-icon" />
          <p>
            Are you sure you want to delete <strong>{user.name}</strong>?<br />
            This will permanently remove their account, all projects, and all predictions.
          </p>
        </div>
      </div>
      <div className="admin-modal-footer">
        <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={deleting}>Cancel</button>
        <button className="btn btn-danger btn-sm" onClick={() => onConfirm(user._id)} disabled={deleting}>
          {deleting ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
          {deleting ? 'Deleting…' : 'Delete User'}
        </button>
      </div>
    </div>
  </div>
);

/* ── Toast notification ───────────────────────────────────────────── */
const Toast = ({ message, type, onDismiss }) => (
  <div className={`admin-toast admin-toast-${type}`} role="alert">
    {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
    <span>{message}</span>
    <button onClick={onDismiss} aria-label="Dismiss"><X size={14} /></button>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   Main Admin Page
════════════════════════════════════════════════════════════════════ */
const Admin = () => {
  const { user: currentUser } = useAuth();

  /* stats */
  const [activeTab, setActiveTab]     = useState('users');
  const [stats, setStats]         = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError]     = useState('');

  /* users table */
  const [users, setUsers]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError]     = useState('');

  /* filters */
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage]           = useState(1);

  /* modals */
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* toast */
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── fetch stats ──────────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const res = await adminService.getStats();
      setStats(res.data);
    } catch (err) {
      setStatsError(err.message || 'Failed to load stats.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ── fetch users ──────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setTableLoading(true);
    setTableError('');
    try {
      const res = await adminService.getUsers({
        page,
        limit: 15,
        ...(search     ? { search }     : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      setTableError(err.message || 'Failed to load users.');
    } finally {
      setTableLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* reset to page 1 when filters change */
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  /* ── handlers ─────────────────────────────────────────────────── */
  const handleSaveUser = async (id, data) => {
    setSaving(true);
    try {
      const res = await adminService.updateUser(id, data);
      setUsers(prev => prev.map(u => u._id === id ? res.data.user : u));
      setEditTarget(null);
      showToast('User updated successfully.');
      fetchStats(); // refresh role counts
    } catch (err) {
      showToast(err.message || 'Failed to update user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setDeleting(true);
    try {
      await adminService.deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      setDeleteTarget(null);
      showToast('User deleted successfully.');
      fetchStats();
      // reload page if it became empty
      if (users.length === 1 && page > 1) setPage(p => p - 1);
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  /* ── render ───────────────────────────────────────────────────── */
  const roleCounts = stats?.stats?.usersByRole || {};

  return (
    <MainLayout>
      {/* toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      {/* modals */}
      {editTarget && (
        <EditModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveUser}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteUser}
          deleting={deleting}
        />
      )}

      {/* page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Shield size={24} className="page-title-icon" /> Admin Panel
          </h1>
          <p className="page-subtitle">Manage users, roles, and platform activity</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { fetchStats(); fetchUsers(); }}
          aria-label="Refresh"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="admin-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={15} /> Users
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'performance'}
          className={`admin-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <Cpu size={15} /> Performance Metrics
        </button>
      </div>

      {/* ══════════════════ USERS TAB ══════════════════ */}
      {activeTab === 'users' && (<>

      {/* ── Stats row ────────────────────────────────────────────── */}
      {statsLoading ? (
        <LoadingSpinner size="md" text="Loading stats…" />
      ) : statsError ? (
        <ErrorMessage message={statsError} onRetry={fetchStats} />
      ) : (
        <div className="kpi-grid">
          <StatCard
            icon={<Users size={22} />}
            value={stats?.stats?.totalUsers ?? 0}
            label="Total Users"
            iconBg="var(--primary-light)"
            iconColor="var(--primary-color)"
          />
          <StatCard
            icon={<UserCheck size={22} />}
            value={roleCounts.user ?? 0}
            label="Standard Users"
            iconBg="var(--info-bg)"
            iconColor="var(--info-color)"
          />
          <StatCard
            icon={<UserCog size={22} />}
            value={roleCounts.manager ?? 0}
            label="Managers"
            iconBg="var(--warning-bg)"
            iconColor="var(--warning-color)"
          />
          <StatCard
            icon={<Shield size={22} />}
            value={roleCounts.admin ?? 0}
            label="Admins"
            iconBg="var(--danger-bg)"
            iconColor="var(--danger-color)"
          />
          <StatCard
            icon={<FolderOpen size={22} />}
            value={stats?.stats?.totalProjects ?? 0}
            label="Total Projects"
            iconBg="var(--success-bg)"
            iconColor="var(--success-color)"
          />
          <StatCard
            icon={<BarChart3 size={22} />}
            value={stats?.stats?.totalPredictions ?? 0}
            label="Total Predictions"
            iconBg="var(--secondary-light)"
            iconColor="var(--secondary-color)"
          />
        </div>
      )}

      {/* ── Role distribution bar ─────────────────────────────────── */}
      {!statsLoading && !statsError && stats && (
        <div className="card admin-role-card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={16} /> User Distribution by Role
            </div>
          </div>
          <div className="card-body">
            <div className="admin-role-bars">
              {ROLES.map(role => {
                const count = roleCounts[role] ?? 0;
                const total = stats?.stats?.totalUsers || 1;
                const pct   = Math.round((count / total) * 100);
                return (
                  <div key={role} className="admin-role-bar-row">
                    <div className="admin-role-bar-label">
                      <span className={`badge ${roleBadgeClass[role]}`}>
                        {roleIcon[role]} {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                      <span className="admin-role-bar-count">{count} user{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="admin-role-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`admin-role-bar-fill admin-role-bar-${role}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="admin-role-bar-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Users table ──────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header admin-table-header">
          <div className="card-title"><Users size={16} /> All Users</div>
          <div className="admin-table-controls">
            {/* search */}
            <div className="admin-search-wrap">
              <Search size={14} className="admin-search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-search-input"
                aria-label="Search users"
              />
              {search && (
                <button className="admin-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </div>
            {/* role filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="admin-select-sm"
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-body admin-table-body">
          {tableLoading ? (
            <LoadingSpinner size="md" text="Loading users…" />
          ) : tableError ? (
            <ErrorMessage message={tableError} onRetry={fetchUsers} />
          ) : users.length === 0 ? (
            <div className="empty-state">
              <Database className="empty-state-icon" />
              <h3>No users found</h3>
              <p>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table" aria-label="Users table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th aria-label="Actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className={u._id === currentUser?._id ? 'admin-row-self' : ''}>
                        <td>
                          <div className="admin-user-name">
                            <div className="admin-user-avatar" aria-hidden="true">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span>
                              {u.name}
                              {u._id === currentUser?._id && (
                                <span className="admin-you-badge"> (you)</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="admin-email-cell">{u.email}</td>
                        <td>
                          <span className={`badge ${roleBadgeClass[u.role]}`}>
                            {roleIcon[u.role]} {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="admin-date-cell">{formatDate(u.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="table-action-btn"
                              onClick={() => setEditTarget(u)}
                              title="Edit user"
                              aria-label={`Edit ${u.name}`}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              className="table-action-btn danger"
                              onClick={() => setDeleteTarget(u)}
                              title="Delete user"
                              aria-label={`Delete ${u.name}`}
                              disabled={u._id === currentUser?._id}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              {pagination.pages > 1 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Showing {users.length} of {pagination.total} users
                  </span>
                  <div className="admin-pagination-btns">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page <= 1}
                    >
                      ← Prev
                    </button>
                    <span className="admin-pagination-page">
                      Page {pagination.page} / {pagination.pages}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= pagination.pages}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      </>)} {/* end users tab */}

      {/* ══════════════════ PERFORMANCE TAB ══════════════════ */}
      {activeTab === 'performance' && <PerformanceMetrics />}

    </MainLayout>
  );
};

export default Admin;
