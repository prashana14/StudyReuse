// src/context/AdminAuthContext.jsx
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import API from '../services/api';

// Create context - DO NOT EXPORT THIS
const AdminAuthContext = createContext();

// Keep the hook as a const (this is fine for HMR)
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

// Keep provider as a const (this is fine for HMR)
export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAdminAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      const res = await API.get('/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.admin) {
        setAdmin(res.data.admin);
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch (err) {
      console.error('Admin auth check failed:', err);
      localStorage.removeItem('adminToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const loginAdmin = async (email, password) => {
    try {
      setError(null);
      const res = await API.post('/admin/login', { email, password });
      
      console.log('Admin login response:', res.data); // Debug log
      
      if (res.data.token && res.data.admin) {
        // Save ADMIN token
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('admin', JSON.stringify(res.data.admin));
        
        // Clear any user tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setAdmin(res.data.admin);
        
        // Debug: Check what's in localStorage
        console.log('After admin login - localStorage:', {
          adminToken: localStorage.getItem('adminToken'),
          userToken: localStorage.getItem('token'),
          adminData: localStorage.getItem('admin')
        });
        
        return { success: true };
      } else {
        setError('Login failed: No token or admin data received');
        return { success: false, message: 'Login failed' };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Admin login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
    setError(null);
  };

  const registerAdmin = async (name, email, password) => {
    try {
      setError(null);
      const res = await API.post('/admin/register', { name, email, password });
      
      if (res.data.token && res.data.admin) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('admin', JSON.stringify(res.data.admin));
        setAdmin(res.data.admin);
        return { success: true };
      } else {
        setError('Registration failed');
        return { success: false, message: 'Registration failed' };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const checkAdminLimit = async () => {
    try {
      const res = await API.get('/admin/limit');
      return res.data;
    } catch (err) {
      console.error('Error checking admin limit:', err);
      return { allowed: false, currentCount: 0, maxAllowed: 2 };
    }
  };

  const value = {
    admin,
    loading,
    error,
    loginAdmin,
    logoutAdmin,
    registerAdmin,
    checkAdminLimit,
    setError
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// DO NOT export AdminAuthContext - this causes HMR issues