import api from './api';

export const adminService = {
  /** GET /api/admin/performance — ML model metrics + platform stats */
  getPerformanceMetrics: () => api.get('/admin/performance'),

  /** GET /api/admin/stats — user counts by role, totals, recent users */
  getStats: () => api.get('/admin/stats'),

  /** GET /api/admin/users — paginated user list with optional role/search filter */
  getUsers: (params = {}) => api.get('/admin/users', { params }),

  /** PUT /api/admin/users/:id — update role and/or name */
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),

  /** DELETE /api/admin/users/:id — delete user + cascade projects/predictions */
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  /** POST /api/auth/admin-codes — seed new SCDP codes (admin only) */
  addAdminCodes: (codes) => api.post('/auth/admin-codes', { codes }),

  /** GET /api/auth/admin-codes — list all codes with used status */
  listAdminCodes: () => api.get('/auth/admin-codes'),
};
