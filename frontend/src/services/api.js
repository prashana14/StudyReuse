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
// ✅ STEP 5: Add this to api.js for auto token refresh

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return API(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('token');
        const response = await API.post('/users/refresh-token', {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });
        
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        API.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        
        processQueue(null, newToken);
        isRefreshing = false;
        
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiService;