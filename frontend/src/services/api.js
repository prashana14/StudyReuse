import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add token
API.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
API.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Admin API methods (optional - remove if not needed)
const adminAPI = {
  getDashboardStats: () => API.get('/admin/dashboard/stats'),
  getUsers: (params) => API.get('/admin/users', { params }),
  blockUser: (userId, reason) => API.put(`/admin/users/${userId}/block`, { reason }),
  unblockUser: (userId) => API.put(`/admin/users/${userId}/unblock`),
  getItems: (params) => API.get('/admin/items', { params }),
  approveItem: (itemId) => API.put(`/admin/items/${itemId}/approve`),
  rejectItem: (itemId, reason) => API.put(`/admin/items/${itemId}/reject`, { reason }),
  deleteItem: (itemId) => API.delete(`/admin/items/${itemId}`),
  sendNotification: (data) => API.post('/admin/notifications/send', data),
};

// Main API object
const apiService = {
  // Regular HTTP methods
  get: (url, config) => API.get(url, config),
  post: (url, data, config) => API.post(url, data, config),
  put: (url, data, config) => API.put(url, data, config),
  patch: (url, data, config) => API.patch(url, data, config),
  delete: (url, config) => API.delete(url, config),
  
  // Admin methods
  admin: adminAPI,
  
  // Specific endpoints for convenience
  items: {
    getAll: (params) => API.get('/items', { params }),
    getById: (id) => API.get(`/items/${id}`),
    create: (data) => API.post('/items', data),
    update: (id, data) => API.put(`/items/${id}`, data),
    delete: (id) => API.delete(`/items/${id}`),
    search: (query, params) => API.get('/items/search', { params: { q: query, ...params } }),
    getMyItems: () => API.get('/items/my'),
  },
  
  users: {
    login: (data) => API.post('/users/login', data),
    register: (data) => API.post('/users/register', data),
    profile: () => API.get('/users/profile'),
    updateProfile: (data) => API.put('/users/profile', data),
  },
  
  notifications: {
    getAll: (params) => API.get('/notifications', { params }),
    markAsRead: (id) => API.put(`/notifications/${id}/read`),
    markAllAsRead: () => API.put('/notifications/read/all'),
    delete: (id) => API.delete(`/notifications/${id}`),
    getUnreadCount: () => API.get('/notifications/unread/count'),
  },
  
  barter: {
    create: (data) => API.post('/barter', data),
    getMy: () => API.get('/barter/my'),
    update: (id, data) => API.put(`/barter/${id}`, data),
  },
  
  // Direct Axios instance (for complex cases)
  axios: API,
};

// Export both default and named exports
export default apiService;
export { API, adminAPI };