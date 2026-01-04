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
  (response) => response.data, // Extract data from response
  handleResponseError
);

API_MULTIPART.interceptors.response.use(
  (response) => response.data, // Extract data from response
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
  getAnalytics: (params = {}) => API.get('/admin/analytics', { params }),
  
  // ✅ User Management
  getAllUsers: (params) => API.get('/admin/users', { params }),
  getUser: (id) => API.get(`/admin/users/${id}`),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  blockUser: (userId, reason) => API.patch(`/admin/users/${userId}/block`, { reason }),
  unblockUser: (userId) => API.patch(`/admin/users/${userId}/unblock`),
  
  // ✅ Item Management - ADDING THE MISSING FUNCTION
  getItems: (params) => API.get('/admin/items', { params }), // ADD THIS LINE
  getAllItems: (params) => API.get('/admin/items', { params }), // Alias for backward compatibility
  getItem: (itemId) => API.get(`/admin/items/${itemId}`),
  updateItem: (itemId, data) => API.put(`/admin/items/${itemId}`, data),
  updateItemStatus: (itemId, data) => API.patch(`/admin/items/${itemId}/status`, data),
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
  getOrder: (id) => API.get(`/admin/orders/${id}`),
  updateOrder: (id, data) => API.put(`/admin/orders/${id}`, data),
  
  // ✅ Analytics & Reports
  getReports: (params = {}) => API.get('/admin/reports', { params }),
};

// ======================
// 6. USER API Methods
// ======================
const userAPI = {
  // Auth
  login: (email, password) => API.post('/users/login', { email, password }),
  register: (data) => API.post('/users/register', data),
  logout: () => API.post('/users/logout'),
  refreshToken: () => API.post('/users/refresh-token'),
  forgotPassword: (email) => API.post('/users/forgot-password', { email }),
  resetPassword: (token, newPassword) => API.post('/users/reset-password', { token, newPassword }),
  
  // Profile
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  changePassword: (data) => API.put('/users/change-password', data),
  uploadAvatar: (formData) => API_MULTIPART.post('/users/avatar', formData),
  
  // User Activities
  getActivity: (params = {}) => API.get('/users/activity', { params }),
  getFavorites: () => API.get('/users/favorites'),
  addFavorite: (itemId) => API.post('/users/favorites', { itemId }),
  removeFavorite: (itemId) => API.delete(`/users/favorites/${itemId}`),
  
  // User Items
  getUserItems: (params = {}) => API.get('/users/items', { params }),
};

// ======================
// 7. ITEM API Methods
// ======================
const itemAPI = {
  getAll: (params = {}) => API.get('/items', { params }),
  getById: (id) => API.get(`/items/${id}`),
  search: (query, params = {}) => API.get('/items/search', { params: { q: query, ...params } }),
  getByCategory: (category, params = {}) => API.get(`/items/category/${category}`, { params }),
  getSimilar: (itemId, params = {}) => API.get(`/items/${itemId}/similar`, { params }),
  getTrending: (params = {}) => API.get('/items/trending', { params }),
  getRecommended: () => API.get('/items/recommended'),
  
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
  
  // Item Actions
  flagItem: (itemId, reason) => API.post(`/items/${itemId}/flag`, { reason }),
  contactSeller: (itemId, message) => API.post(`/items/${itemId}/contact`, { message }),
  
  // Analytics
  getItemViews: (itemId) => API.get(`/items/${itemId}/views`),
  incrementViews: (itemId) => API.post(`/items/${itemId}/views`),
};

// ======================
// 8. ORDER API Methods
// ======================
const orderAPI = {
  create: (orderData) => API.post('/orders', orderData),
  getMyOrders: (params = {}) => API.get('/orders/my', { params }),
  getOrderById: (id) => API.get(`/orders/${id}`),
  cancelOrder: (id) => API.put(`/orders/${id}/cancel`),
  updateOrder: (id, data) => API.put(`/orders/${id}`, data),
  
  // Order Status
  updateStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),
  confirmDelivery: (id) => API.put(`/orders/${id}/deliver`),
  
  // Admin endpoints (also available through adminAPI)
  getAll: (params = {}) => API.get('/orders', { params }),
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
  getSettings: () => API.get('/notifications/settings'),
  updateSettings: (settings) => API.put('/notifications/settings', settings),
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
  getUserReviews: (userId) => API.get(`/users/${userId}/reviews`),
  getAverageRating: (itemId) => API.get(`/items/${itemId}/rating`),
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
  cancelBarter: (id) => API.put(`/barter/${id}/cancel`),
  getBarterHistory: (userId) => API.get(`/barter/history/${userId}`),
};

// ======================
// 12. CHAT API Methods
// ======================
const chatAPI = {
  getConversations: () => API.get('/chat/conversations'),
  getConversation: (userId) => API.get(`/chat/conversations/${userId}`),
  getMessages: (conversationId, params = {}) => API.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, message) => API.post(`/chat/conversations/${conversationId}/messages`, { message }),
  markAsRead: (conversationId) => API.put(`/chat/conversations/${conversationId}/read`),
  deleteConversation: (conversationId) => API.delete(`/chat/conversations/${conversationId}`),
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
  
  multipleImages: (files, fieldName = 'images') => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(fieldName, file);
    });
    return API_MULTIPART.post('/upload/multiple', formData);
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
// 14. CATEGORY API Methods
// ======================
const categoryAPI = {
  getAll: () => API.get('/categories'),
  getPopular: () => API.get('/categories/popular'),
  getWithCounts: () => API.get('/categories/with-counts'),
};

// ======================
// 15. MAIN API SERVICE OBJECT
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
  
  // Category API
  categories: categoryAPI,
  
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
    
    timeAgo: (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 7) {
        return date.toLocaleDateString();
      } else if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
      } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
      } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
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
        'flagged': 'bg-red-100 text-red-800',
        'Available': 'bg-green-100 text-green-800',
        'Sold': 'bg-red-100 text-red-800',
        'Reserved': 'bg-yellow-100 text-yellow-800'
      };
      
      return statusColors[status] || 'bg-gray-100 text-gray-800';
    },
    
    getStatusEmoji: (status) => {
      const statusEmojis = {
        'pending': '⏳',
        'approved': '✅',
        'rejected': '❌',
        'active': '✅',
        'blocked': '🚫',
        'completed': '✅',
        'cancelled': '❌',
        'processing': '🔄',
        'delivered': '📦',
        'flagged': '🚩',
        'Available': '✅',
        'Sold': '💰',
        'Reserved': '⏳'
      };
      
      return statusEmojis[status] || '📄';
    },
    
    getNotificationIcon: (type) => {
      const icons = {
        'item_approved': '✅',
        'item_rejected': '❌',
        'user_blocked': '🚫',
        'new_user': '👤',
        'new_item': '📦',
        'item_flag': '🚩',
        'system': '⚙️',
        'admin_alert': '📢',
        'barter': '🔄',
        'trade': '🤝',
        'new_order': '🛒',
        'new_message': '💬',
        'review_added': '⭐',
        'item_sold': '💰',
        'order_shipped': '🚚',
        'payment_received': '💳',
        'warning': '⚠️',
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌'
      };
      
      return icons[type] || '🔔';
    },
    
    getNotificationColor: (type) => {
      const colors = {
        'item_approved': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
        'item_rejected': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
        'user_blocked': { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
        'new_user': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
        'new_item': { bg: '#f3e8ff', text: '#7c3aed', border: '#e9d5ff' },
        'item_flag': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
        'system': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
        'admin_alert': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
        'default': { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
      };
      
      return colors[type] || colors.default;
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
        'textbooks': '📖',
        'study guides': '📘',
        'other': '📦',
        'Books': '📚',
        'Electronics': '💻',
        'Stationery': '✏️',
        'Textbooks': '📖',
        'Lab Equipment': '🧪',
        'Study Guides': '📘'
      };
      return icons[category] || '📦';
    },
    
    getCategoryColor: (category) => {
      const colors = {
        'books': { bg: '#dbeafe', text: '#1e40af' },
        'electronics': { bg: '#f3e8ff', text: '#7c3aed' },
        'stationery': { bg: '#fef3c7', text: '#92400e' },
        'textbooks': { bg: '#d1fae5', text: '#065f46' },
        'lab equipment': { bg: '#fce7f3', text: '#be185d' },
        'study guides': { bg: '#fef3c7', text: '#92400e' },
        'default': { bg: '#f3f4f6', text: '#374151' }
      };
      return colors[category] || colors.default;
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
        localStorage.setItem('adminData', JSON.stringify({ token }));
      } else {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ token }));
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
    },
    
    // Debug helper
    debug: () => {
      console.log('API Service Debug Info:');
      console.log('Base URL:', API_BASE_URL);
      console.log('User Token exists:', !!localStorage.getItem('token'));
      console.log('Admin Token exists:', !!localStorage.getItem('adminToken'));
      console.log('User Data:', localStorage.getItem('user'));
      console.log('Admin Data:', localStorage.getItem('adminData'));
    }
  }
};

// Make sure the API service is globally available for debugging
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}

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
  uploadAPI,
  categoryAPI
};