import { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

// Create the context
const AdminAuthContext = createContext();

// Custom hook
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

// Provider component
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
        }
      } catch (err) {
        console.error('Error parsing admin data:', err);
      }
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      setError(null);
      console.log('🚀 [AdminAuthContext] Attempting admin login:', { email });
      
      // ✅ FIX: Use apiService.admin.loginAdmin
      const res = await apiService.admin.loginAdmin(email, password);
      
      console.log('✅ [AdminAuthContext] Login response:', res);
      
      if (res.success && res.token && res.admin) {
        localStorage.setItem('adminToken', res.token);
        localStorage.setItem('adminUser', JSON.stringify(res.admin));
        setAdmin(res.admin);
        return { success: true };
      } else {
        const message = res.message || 'Admin login failed';
        setError(message);
        console.error('❌ [AdminAuthContext] Login failed:', message);
        return { success: false, message };
      }
    } catch (err) {
      console.error('🔥 [AdminAuthContext] Login catch error:', err);
      console.error('📡 Error response:', err.response?.data);
      
      const message = err.response?.data?.message || 
                     err.message || 
                     'Admin login failed';
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
      console.log('🚀 [AdminAuthContext] Attempting admin registration:', { name, email });
      
      // ✅ FIX: Use apiService.admin.registerAdmin
      const res = await apiService.admin.registerAdmin({ name, email, password });
      
      console.log('✅ [AdminAuthContext] Registration response:', res);
      
      if (res.success && res.token && res.admin) {
        localStorage.setItem('adminToken', res.token);
        localStorage.setItem('adminUser', JSON.stringify(res.admin));
        setAdmin(res.admin);
        return { success: true };
      } else {
        const message = res.message || 'Admin registration failed';
        setError(message);
        console.error('❌ [AdminAuthContext] Registration failed:', message);
        return { success: false, message };
      }
    } catch (err) {
      console.error('🔥 [AdminAuthContext] Registration catch error:', err);
      console.error('📡 Error response:', err.response?.data);
      
      const message = err.response?.data?.message || 
                     err.message || 
                     'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const checkAdminLimit = async () => {
    try {
      const res = await apiService.admin.checkAdminLimit();
      return res;
    } catch (err) {
      console.error('Error checking admin limit:', err);
      return { 
        allowed: false, 
        currentCount: 0, 
        maxAllowed: 2,
        message: "Error checking admin limit"
      };
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

// Export both as default and named for flexibility
export default AdminAuthProvider;