import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// ======================
// 1. Create API instances
// ======================

// Regular API for JSON requests
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// MULTIPART API for file uploads (Cloudinary/Multer)
const API_MULTIPART = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 30000,
});

// ======================
// 2. Request Interceptors
// ======================

// Helper to add correct auth token based on route
const addCorrectAuthToken = (config) => {
  const isAdminRoute = config.url.includes('/admin/');
  
  if (isAdminRoute) {
    // Use admin token for admin routes
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    // Use user token for regular routes
    const userToken = localStorage.getItem('token');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
  }
  
  return config;
};

// Regular API interceptor
API.interceptors.request.use(
  (config) => {
    return addCorrectAuthToken(config);
  },
  (error) => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  }
);

// Multipart API interceptor
API_MULTIPART.interceptors.request.use(
  (config) => {
    return addCorrectAuthToken(config);
  },
  (error) => {
    console.error('Multipart request error:', error);
    return Promise.reject(error);
  }
);

// ======================
// 3. Response Interceptors
// ======================

const handleResponseError = (error) => {
  console.error('API Error:', {
    url: error.config?.url,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
  
  // Handle 401 Unauthorized
  if (error.response?.status === 401) {
    const isAdminRoute = error.config?.url?.includes('/admin/');
    
    if (isAdminRoute) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }
  
  return Promise.reject(error);
};

API.interceptors.response.use(
  (response) => response,
  handleResponseError
);

API_MULTIPART.interceptors.response.use(
  (response) => response,
  handleResponseError
);

// ======================
// 4. Helper Functions
// ======================

export const createItemFormData = (itemData, imageFile) => {
  const formData = new FormData();
  
  formData.append('title', itemData.title?.trim() || '');
  formData.append('description', itemData.description?.trim() || '');
  formData.append('price', parseFloat(itemData.price) || 0);
  formData.append('category', itemData.category || 'books');
  formData.append('condition', itemData.condition || 'good');
  
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  return formData;
};

export const validateImageFile = (file) => {
  const errors = [];
  
  if (!file) {
    return { valid: false, errors: ['No file selected'] };
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    errors.push('Invalid file type. Use JPG, PNG, GIF, or WEBP');
  }
  
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File too large (max 5MB)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ======================
// 5. COMPLETE ADMIN API METHODS
// ======================
const adminAPI = {
  // ✅ Admin Auth
  checkAdminLimit: () => API.get('/admin/check-limit'),
  loginAdmin: (email, password) => API.post('/admin/login', { email, password }),
  registerAdmin: (data) => API.post('/admin/register', data),
  verifyAdmin: () => API.get('/admin/verify'),
  getAdminProfile: () => API.get('/admin/profile'),
  
  // ✅ Dashboard & Stats
  getDashboardStats: () => API.get('/admin/stats'),
  
  // ✅ User Management
  getAllUsers: (params) => API.get('/admin/users', { params }),
  blockUser: (userId, reason) => API.patch(`/admin/users/${userId}/block`, { reason }),
  unblockUser: (userId) => API.patch(`/admin/users/${userId}/unblock`),
  
  // ✅ Item Management
  getAllItems: (params) => API.get('/admin/items', { params }),
  approveItem: (itemId) => API.patch(`/admin/items/${itemId}/approve`),
  rejectItem: (itemId, reason) => API.patch(`/admin/items/${itemId}/reject`, { reason }),
  deleteItem: (itemId, reason) => API.delete(`/admin/items/${itemId}`, { data: { reason } }),
  
  // ✅ Notification Management
  sendNotification: (notificationData) => API.post('/admin/notifications/send', notificationData),
  
  // ✅ Admin Notifications (Clickable notifications)
  getAdminNotifications: (params) => API.get('/admin/notifications', { params }),
  getAdminUnreadCount: () => API.get('/admin/notifications/unread/count'),
  markAdminNotificationAsRead: (notificationId) => API.put(`/admin/notifications/${notificationId}/read`),
  markAllAdminNotificationsAsRead: () => API.put('/admin/notifications/read/all'),
  deleteAdminNotification: (notificationId) => API.delete(`/admin/notifications/${notificationId}`),
  clearAllAdminNotifications: () => API.delete('/admin/notifications'),
  sendAdminNotification: (data) => API.post('/admin/notifications/send-to-admin', data),
  getNotificationTypes: () => API.get('/admin/notifications/types'),
  
  // ✅ Order Management (Admin)
  getAllOrders: (params = {}) => API.get('/admin/orders', { params }),
};

// ======================
// 6. USER API Methods
// ======================
const userAPI = {
  // Auth
  login: (email, password) => API.post('/users/login', { email, password }),
  register: (data) => API.post('/users/register', data),
  
  // Profile
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
};

// ======================
// 7. ITEM API Methods
// ======================
const itemAPI = {
  getAll: (params = {}) => API.get('/items', { params }),
  getById: (id) => API.get(`/items/${id}`),
  search: (query, params = {}) => API.get('/items/search', { params: { q: query, ...params } }),
  getByCategory: (category, params = {}) => API.get(`/items/category/${category}`, { params }),
  
  // User-specific
  getMyItems: (params = {}) => API.get('/items/my', { params }),
  create: async (itemData, imageFile) => {
    const formData = createItemFormData(itemData, imageFile);
    return API_MULTIPART.post('/items', formData);
  },
  update: async (id, itemData, imageFile = null) => {
    const formData = createItemFormData(itemData, imageFile);
    return API_MULTIPART.put(`/items/${id}`, formData);
  },
  delete: (id) => API.delete(`/items/${id}`),
};

// ======================
// 8. ORDER API Methods
// ======================
const orderAPI = {
  create: (orderData) => API.post('/orders', orderData),
  getMyOrders: (params = {}) => API.get('/orders/my', { params }),
  getOrderById: (id) => API.get(`/orders/${id}`),
  cancelOrder: (id) => API.put(`/orders/${id}/cancel`),
  
  // Admin endpoints (also available through adminAPI)
  getAll: (params = {}) => API.get('/orders', { params }),
  updateStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),
};

// ======================
// 9. NOTIFICATION API Methods (User)
// ======================
const notificationAPI = {
  getAll: (params = {}) => API.get('/notifications', { params }),
  getUnreadCount: () => API.get('/notifications/unread/count'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put('/notifications/read/all'),
  delete: (id) => API.delete(`/notifications/${id}`),
  deleteAll: () => API.delete('/notifications'),
};

// ======================
// 10. REVIEW API Methods
// ======================
const reviewAPI = {
  create: (itemId, rating, comment) => API.post(`/items/${itemId}/reviews`, { rating, comment }),
  getItemReviews: (itemId, params = {}) => API.get(`/items/${itemId}/reviews`, { params }),
  getMyReviews: (params = {}) => API.get('/reviews/my', { params }),
  updateReview: (reviewId, rating, comment) => API.put(`/reviews/${reviewId}`, { rating, comment }),
  deleteReview: (reviewId) => API.delete(`/reviews/${reviewId}`),
};

// ======================
// 11. BARTER API Methods
// ======================
const barterAPI = {
  create: (data) => API.post('/barter', data),
  getMyBarters: (params = {}) => API.get('/barter/my', { params }),
  getBarterById: (id) => API.get(`/barter/${id}`),
  acceptBarter: (id) => API.put(`/barter/${id}/accept`),
  rejectBarter: (id, reason = '') => API.put(`/barter/${id}/reject`, { reason }),
};

// ======================
// 12. CHAT API Methods
// ======================
const chatAPI = {
  getConversations: () => API.get('/chat/conversations'),
  getConversation: (userId) => API.get(`/chat/conversations/${userId}`),
  getMessages: (conversationId, params = {}) => API.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, message) => API.post(`/chat/conversations/${conversationId}/messages`, { message }),
};

// ======================
// 13. UPLOAD API Methods
// ======================
const uploadAPI = {
  image: (file, fieldName = 'image') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return API_MULTIPART.post('/upload', formData);
  },
  
  validateFile: (file, maxSize = 5242880, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) => {
    const errors = [];
    
    if (!file) {
      return { valid: false, errors: ['No file selected'] };
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    if (file.size > maxSize) {
      errors.push(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
};

// ======================
// 14. MAIN API SERVICE OBJECT
// ======================
const apiService = {
  // Direct HTTP methods
  get: (url, config) => API.get(url, config),
  post: (url, data, config) => API.post(url, data, config),
  put: (url, data, config) => API.put(url, data, config),
  patch: (url, data, config) => API.patch(url, data, config),
  delete: (url, config) => API.delete(url, config),
  
  // Admin API (Matches your adminService.js exactly)
  admin: adminAPI,
  
  // User API
  users: userAPI,
  
  // Items API
  items: itemAPI,
  
  // Orders API
  orders: orderAPI,
  
  // Notifications API
  notifications: notificationAPI,
  
  // Reviews API
  reviews: reviewAPI,
  
  // Barter API
  barter: barterAPI,
  
  // Chat API
  chat: chatAPI,
  
  // Upload API
  upload: uploadAPI,
  
  // Direct axios instances
  axios: API,
  axiosMultipart: API_MULTIPART,
  
  // Helper functions
  helpers: {
    createItemFormData,
    validateImageFile,
    
    formatPrice: (price) => {
      if (!price && price !== 0) return '₹0';
      return `₹${parseFloat(price).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })}`;
    },
    
    formatDate: (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    truncateText: (text, maxLength = 100) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    
    getStatusColor: (status) => {
      const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
        'active': 'bg-green-100 text-green-800',
        'blocked': 'bg-red-100 text-red-800',
        'completed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'processing': 'bg-blue-100 text-blue-800',
        'delivered': 'bg-green-100 text-green-800',
        'flagged': 'bg-red-100 text-red-800'
      };
      
      return statusColors[status] || 'bg-gray-100 text-gray-800';
    },
    
    getNotificationIcon: (type) => {
      switch (type) {
        case 'item_approved':
        case 'item_approved':
          return '✅';
        case 'item_rejected':
          return '❌';
        case 'user_blocked':
          return '🚫';
        case 'new_user':
          return '👤';
        case 'new_item':
          return '📦';
        case 'item_flag':
          return '🚩';
        case 'system':
        case 'admin_alert':
          return '📢';
        case 'barter':
          return '🔄';
        case 'trade':
          return '🤝';
        case 'new_order':
          return '🛒';
        default:
          return '🔔';
      }
    },
    
    getNotificationColor: (type) => {
      switch (type) {
        case 'item_approved':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'item_rejected':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'user_blocked':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'new_user':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'new_item':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'item_flag':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'system':
        case 'admin_alert':
          return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    },
    
    getCategoryIcon: (category) => {
      const icons = {
        'books': '📚',
        'notes': '📝',
        'lab equipment': '🧪',
        'electronics': '💻',
        'stationery': '✏️',
        'furniture': '🪑',
        'clothing': '👕',
        'other': '📦'
      };
      return icons[category?.toLowerCase()] || '📦';
    }
  },
  
  // Configuration
  config: {
    baseURL: API_BASE_URL,
    setBaseURL: (url) => {
      API.defaults.baseURL = url;
      API_MULTIPART.defaults.baseURL = url;
    },
    
    setToken: (token, isAdmin = false) => {
      if (isAdmin) {
        localStorage.setItem('adminToken', token);
      } else {
        localStorage.setItem('token', token);
      }
    },
    
    clearTokens: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      localStorage.removeItem('adminData');
    },
    
    getToken: (isAdmin = false) => {
      return isAdmin ? localStorage.getItem('adminToken') : localStorage.getItem('token');
    },
    
    isAuthenticated: (isAdmin = false) => {
      return !!apiService.config.getToken(isAdmin);
    },
    
    getUser: () => {
      const userStr = localStorage.getItem('user');
      try {
        return userStr ? JSON.parse(userStr) : null;
      } catch {
        return null;
      }
    },
    
    getAdminUser: () => {
      const adminUserStr = localStorage.getItem('adminData');
      try {
        return adminUserStr ? JSON.parse(adminUserStr) : null;
      } catch {
        return null;
      }
    }
  }
};

// Export everything
export default apiService;
export { 
  API, 
  API_MULTIPART,
  adminAPI,
  userAPI,
  itemAPI,
  orderAPI,
  notificationAPI,
  reviewAPI,
  barterAPI,
  chatAPI,
  uploadAPI
};