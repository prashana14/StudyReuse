import { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminUser');
    
    if (token && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        if (parsedAdmin && parsedAdmin.role === 'admin') {
          setAdmin(parsedAdmin);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch (err) {
        console.error('Error parsing admin data:', err);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
    
    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      setError(null);
      const res = await API.post('/admin/login', { email, password });
      
      if (res.data.success && res.data.token && res.data.admin) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAdmin(res.data.admin);
        return { success: true };
      } else {
        const message = res.data.message || 'Admin login failed';
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Admin login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
    setError(null);
  };

  const registerAdmin = async (name, email, password) => {
    try {
      setError(null);
      const res = await API.post('/admin/register', { name, email, password });
      
      if (res.data.success && res.data.token && res.data.admin) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
        setAdmin(res.data.admin);
        return { success: true };
      } else {
        const message = res.data.message || 'Admin registration failed';
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const checkAdminLimit = async () => {
    try {
      const res = await API.get('/admin/check-limit');
      return res.data;
    } catch (err) {
      console.error('Error checking admin limit:', err);
      return { allowed: false, currentCount: 0, maxAllowed: 2 };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    admin,
    loading,
    error,
    loginAdmin,
    logoutAdmin,
    registerAdmin,
    checkAdminLimit,
    clearError
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};