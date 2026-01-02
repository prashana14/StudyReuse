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
  timeout: 30000, // Longer timeout for uploads
});

// ======================
// 2. Request Interceptors
// ======================

// Helper to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Regular API interceptor
API.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return addAuthToken(config);
  },
  (error) => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  }
);

// Multipart API interceptor
API_MULTIPART.interceptors.request.use(
  (config) => {
    console.log('Multipart API Request:', config.method?.toUpperCase(), config.url);
    return addAuthToken(config);
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
  
  // Handle upload errors
  if (error.response?.data?.code === 'FILE_TOO_LARGE') {
    error.message = 'Image too large (max 5MB)';
  } else if (error.response?.data?.code === 'INVALID_FILE_TYPE') {
    error.message = 'Invalid image format. Use JPG, PNG, GIF, or WEBP';
  }
  
  return Promise.reject(error);
};

API.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  handleResponseError
);

API_MULTIPART.interceptors.response.use(
  (response) => {
    console.log('Multipart API Response:', response.status, response.config.url);
    return response;
  },
  handleResponseError
);

// ======================
// 4. Helper Functions
// ======================

/**
 * Create FormData for item uploads
 * @param {Object} itemData - Item details
 * @param {File} imageFile - Image file
 * @returns {FormData}
 */
export const createItemFormData = (itemData, imageFile) => {
  const formData = new FormData();
  
  // Append text fields (MUST match backend field names)
  formData.append('title', itemData.title.trim());
  formData.append('description', itemData.description.trim());
  formData.append('price', parseFloat(itemData.price));
  formData.append('category', itemData.category);
  formData.append('condition', itemData.condition || 'good');
  
  // Append image file (MUST be named 'image' for multer.single('image'))
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  return formData;
};

/**
 * Validate image file before upload
 * @param {File} file - Image file
 * @returns {Object} Validation result
 */
export const validateImageFile = (file) => {
  const errors = [];
  
  if (!file) {
    return { valid: false, errors: ['No file selected'] };
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    errors.push('Invalid file type. Use JPG, PNG, GIF, or WEBP');
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('File too large (max 5MB)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ======================
// 5. ADMIN API Methods
// ======================
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

// ======================
// 6. ORDER API Methods
// ======================
const orderAPI = {
  // Create order from cart
  create: (orderData) => API.post('/orders', orderData),
  
  // Get user's orders
  getUserOrders: (params) => API.get('/orders/my', { params }),
  
  // Get order by ID
  getById: (id) => API.get(`/orders/${id}`),
  
  // Update order status (admin only)
  updateStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),
  
  // Cancel order
  cancel: (id) => API.put(`/orders/${id}/cancel`),
  
  // Get all orders (admin only)
  getAll: (params) => API.get('/orders', { params }),
};

// ======================
// 7. CART API Methods (Optional - for saving cart to DB)
// ======================
const cartAPI = {
  // Save cart to database
  save: (cartData) => API.post('/cart', cartData),
  
  // Get saved cart
  getSaved: () => API.get('/cart'),
  
  // Clear saved cart
  clear: () => API.delete('/cart'),
  
  // Update cart item
  updateItem: (itemId, quantity) => API.put(`/cart/items/${itemId}`, { quantity }),
  
  // Remove item from cart
  removeItem: (itemId) => API.delete(`/cart/items/${itemId}`),
};

// ======================
// 8. API Services Object
// ======================
const apiService = {
  // Regular HTTP methods
  get: (url, config) => API.get(url, config),
  post: (url, data, config) => API.post(url, data, config),
  put: (url, data, config) => API.put(url, data, config),
  patch: (url, data, config) => API.patch(url, data, config),
  delete: (url, config) => API.delete(url, config),
  
  // ITEMS API
  items: {
    // Get all items (public)
    getAll: (params) => API.get('/items', { params }),
    
    // Get item by ID
    getById: (id) => API.get(`/items/${id}`),
    
    // Get current user's items
    getMyItems: (params) => API.get('/items/my', { params }),
    
    // Search items
    search: (query, params) => API.get('/items/search', { params: { q: query, ...params } }),
    
    // Create item WITH IMAGE UPLOAD (CLOUDINARY)
    create: async (itemData, imageFile) => {
      const formData = createItemFormData(itemData, imageFile);
      return API_MULTIPART.post('/items', formData);
    },
    
    // Update item WITH OPTIONAL IMAGE
    update: async (id, itemData, imageFile = null) => {
      const formData = createItemFormData(itemData, imageFile);
      return API_MULTIPART.put(`/items/${id}`, formData);
    },
    
    // Update item status (no image)
    updateStatus: (id, status) => API.put(`/items/${id}/status`, { status }),
    
    // Delete item
    delete: (id) => API.delete(`/items/${id}`),
  },
  
  // USERS API
  users: {
    login: (data) => API.post('/users/login', data),
    register: (data) => API.post('/users/register', data),
    profile: () => API.get('/users/profile'),
    updateProfile: (data) => API.put('/users/profile', data),
    
    // Optional: Profile picture upload
    uploadProfilePicture: (imageFile) => {
      const formData = new FormData();
      formData.append('profilePicture', imageFile);
      return API_MULTIPART.put('/users/profile/picture', formData);
    },
  },
  
  // ADMIN API
  admin: adminAPI,
  
  // ORDER API - ADDED
  orders: orderAPI,
  
  // CART API - ADDED (Optional)
  cart: cartAPI,
  
  // NOTIFICATIONS API
  notifications: {
    getAll: (params) => API.get('/notifications', { params }),
    markAsRead: (id) => API.put(`/notifications/${id}/read`),
    markAllAsRead: () => API.put('/notifications/read/all'),
    delete: (id) => API.delete(`/notifications/${id}`),
    getUnreadCount: () => API.get('/notifications/unread/count'),
  },
  
  // BARTER API
  barter: {
    create: (data) => API.post('/barter', data),
    getMy: () => API.get('/barter/my'),
    update: (id, data) => API.put(`/barter/${id}`, data),
  },
  
  // UPLOAD UTILITIES
  upload: {
    // Generic image upload
    image: (file, fieldName = 'image') => {
      const formData = new FormData();
      formData.append(fieldName, file);
      return API_MULTIPART.post('/upload', formData);
    },
    
    // Multiple files upload
    multiple: (files, fieldName = 'files') => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append(fieldName, file);
      });
      return API_MULTIPART.post('/upload/multiple', formData);
    },
  },
  
  // DIRECT AXIOS INSTANCES
  axios: API,
  axiosMultipart: API_MULTIPART,
  
  // HELPER FUNCTIONS
  helpers: {
    createItemFormData,
    validateImageFile,
  },
};

// Export both default and named exports
export default apiService;
export { 
  API, 
  API_MULTIPART, 
  adminAPI, 
  orderAPI, 
  cartAPI 
};