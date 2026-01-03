// src/services/adminService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/admin';

// Create axios instance with default config
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error.response?.data || { message: 'Network error' });
  }
);

// Admin Authentication
export const adminLogin = (email, password) => {
  return adminApi.post('/login', { email, password });
};

export const adminRegister = (adminData) => {
  return adminApi.post('/register', adminData);
};

export const verifyAdmin = () => {
  return adminApi.get('/verify');
};

export const getAdminProfile = () => {
  return adminApi.get('/profile');
};

// Dashboard
export const getDashboardStats = () => {
  return adminApi.get('/stats');
};

// User Management
export const getAllUsers = (params) => {
  return adminApi.get('/users', { params });
};

export const blockUser = (userId, reason) => {
  return adminApi.patch(`/users/${userId}/block`, { reason });
};

export const unblockUser = (userId) => {
  return adminApi.patch(`/users/${userId}/unblock`);
};

// Item Management
export const getAllItems = (params) => {
  return adminApi.get('/items', { params });
};

export const approveItem = (itemId) => {
  return adminApi.patch(`/items/${itemId}/approve`);
};

export const rejectItem = (itemId, reason) => {
  return adminApi.patch(`/items/${itemId}/reject`, { reason });
};

export const deleteItem = (itemId, reason) => {
  return adminApi.delete(`/items/${itemId}`, { data: { reason } });
};

// Notification Management
export const sendNotification = (notificationData) => {
  return adminApi.post('/notifications/send', notificationData);
};

// Check admin limit
export const checkAdminLimit = () => {
  return adminApi.get('/check-limit');
};

export default adminApi;