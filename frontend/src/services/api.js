import axios from 'axios';

// Vite uses import.meta.env, not process.env
const API_BASE_URL = 'http://localhost:4000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests - CLEAN VERSION
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin endpoints
const adminAPI = {
  // Dashboard
  getDashboardStats: () => API.get('/admin/dashboard/stats'),
  
  // Users
  getUsers: (params) => API.get('/admin/users', { params }),
  blockUser: (userId, reason) => API.put(`/admin/users/${userId}/block`, { reason }),
  unblockUser: (userId) => API.put(`/admin/users/${userId}/unblock`),
  
  // Items
  getItems: (params) => API.get('/admin/items', { params }),
  approveItem: (itemId) => API.put(`/admin/items/${itemId}/approve`),
  rejectItem: (itemId, reason) => API.put(`/admin/items/${itemId}/reject`, { reason }),
  deleteItem: (itemId) => API.delete(`/admin/items/${itemId}`),
  
  // Notifications
  sendNotification: (data) => API.post('/admin/notifications/send', data),
};

// Combine regular API and admin API
const apiService = {
  // Regular API methods
  get: (url, config) => API.get(url, config),
  post: (url, data, config) => API.post(url, data, config),
  put: (url, data, config) => API.put(url, data, config),
  delete: (url, config) => API.delete(url, config),
  
  // Admin methods
  admin: adminAPI,
};

export default apiService;