import api from './api';

export const predictionService = {
  create: (data) => api.post('/predictions', data),
  getAll: (params) => api.get('/predictions', { params }),
  getById: (id) => api.get(`/predictions/${id}`),
  delete: (id) => api.delete(`/predictions/${id}`),
  getDashboard: () => api.get('/analytics/dashboard'),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};
