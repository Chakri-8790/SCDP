import api from './api';

export const authService = {
  register:      (data)                   => api.post('/auth/register', data),
  registerAdmin: (data)                   => api.post('/auth/register-admin', data),
  login:         (data)                   => api.post('/api/auth/login', data),
  getMe:         ()                       => api.get('/auth/me'),
  forgotPassword:(email)                  => api.post('/auth/forgot-password', { email }),
  verifyOtp:     (email, otp)             => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (token, password, confirmPassword) =>
    api.post('/auth/reset-password', { token, password, confirmPassword }),

  // Admin code management (admin-only)
  addAdminCodes:  (codes) => api.post('/auth/admin-codes', { codes }),
  listAdminCodes: ()      => api.get('/auth/admin-codes'),
};
