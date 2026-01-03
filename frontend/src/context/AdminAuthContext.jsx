import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('admin');
      
      if (token && adminData) {
        try {
          setAdmin(JSON.parse(adminData));
        } catch (err) {
          logoutAdmin();
        }
      }
      setLoading(false);
    };
    
    checkAdminAuth();
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      setError(null);
      const response = await apiService.admin.loginAdmin({ email, password });
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('admin', JSON.stringify(response.data.user));
        setAdmin(response.data.user);
        return { success: true, data: response.data };
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    }
  };

  const registerAdmin = async (name, email, password) => {
    try {
      setError(null);
      const response = await apiService.admin.registerAdmin({ name, email, password });
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('admin', JSON.stringify(response.data.user));
        setAdmin(response.data.user);
        return { success: true, data: response.data };
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
    setError(null);
  };

  const checkAdminLimit = async () => {
    try {
      const response = await apiService.admin.checkAdminLimit();
      return response.data;
    } catch (err) {
      return { allowed: false, currentCount: 0, maxAllowed: 2 };
    }
  };

  const value = {
    admin,
    loading,
    error,
    loginAdmin,
    registerAdmin,
    logoutAdmin,
    checkAdminLimit,
    isAdmin: !!admin
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};