import { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import AdminAuthContext from './AdminAuthContext';

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  return context;
};

const AdminAuthProvider = ({ children }) => {
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
      const res = await API.post('/admin/login', { email, password });
      
      if (res.data.success && res.data.token && res.data.admin) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
        setAdmin(res.data.admin);
        return { success: true };
      } else {
        setError(res.data.message || 'Admin login failed');
        return { success: false, message: res.data.message || 'Login failed' };
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

  const value = {
    admin,
    loading,
    error,
    loginAdmin,
    logoutAdmin,
    setError
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;