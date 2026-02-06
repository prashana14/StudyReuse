// frontend/src/context/AdminAuthContext.jsx
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

  // Auto-login on mount
  useEffect(() => {
    const autoLoginAdmin = async () => {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // ✅ NEW: Verify admin token with backend
        const response = await apiService.admin.verifyAdmin(token);
        
        if (response.success && response.admin) {
          setAdmin(response.admin);
          localStorage.setItem('adminUser', JSON.stringify(response.admin));
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch (err) {
        console.error('Admin token verification failed:', err);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      } finally {
        setLoading(false);
      }
    };

    autoLoginAdmin();
  }, []);

  // Admin Login
  const loginAdmin = async (email, password) => {
    try {
      setError(null);
      console.log('🚀 Attempting admin login:', email);
      
      // ✅ Use separate admin login endpoint
      const response = await apiService.admin.loginAdmin({ email, password });
      
      console.log('✅ Admin login response:', response);
      
      if (response.success && response.token && response.admin) {
        // Store admin data separately from user data
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminUser', JSON.stringify(response.admin));
        
        // Don't touch regular user storage
        setAdmin(response.admin);
        
        return { 
          success: true, 
          data: response 
        };
      } else {
        const message = response.message || 'Admin login failed';
        setError(message);
        return { 
          success: false, 
          message 
        };
      }
    } catch (err) {
      console.error('🔥 Admin login error:', err);
      
      const message = err.response?.data?.message || 
                     'Admin login failed. Please check your credentials.';
      
      setError(message);
      return { 
        success: false, 
        message 
      };
    }
  };

  // Admin Logout
  const logoutAdmin = () => {
    console.log('👋 Admin logging out');
    
    // Only remove admin storage, keep regular user storage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    setAdmin(null);
    setError(null);
    
    // Optionally redirect to admin login page
    window.location.href = '/admin/login';
  };

  // Admin Registration
  const registerAdmin = async (name, email, password) => {
    try {
      setError(null);
      console.log('🚀 Registering new admin:', email);
      
      const response = await apiService.admin.registerAdmin({ 
        name, 
        email, 
        password 
      });
      
      console.log('✅ Admin registration response:', response);
      
      if (response.success && response.token && response.admin) {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminUser', JSON.stringify(response.admin));
        setAdmin(response.admin);
        
        return { 
          success: true, 
          data: response 
        };
      } else {
        const message = response.message || 'Admin registration failed';
        setError(message);
        return { 
          success: false, 
          message 
        };
      }
    } catch (err) {
      console.error('🔥 Admin registration error:', err);
      
      const message = err.response?.data?.message || 
                     'Admin registration failed. Please try again.';
      
      setError(message);
      return { 
        success: false, 
        message 
      };
    }
  };

  // Check Admin Limit
  const checkAdminLimit = async () => {
    try {
      const response = await apiService.admin.checkAdminLimit();
      return response;
    } catch (err) {
      console.error('Error checking admin limit:', err);
      return { 
        success: false,
        allowed: false, 
        currentCount: 0, 
        maxAllowed: 2,
        message: "Error checking admin limit"
      };
    }
  };

  // Verify Admin Token
  const verifyAdminToken = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return { success: false };
      
      const response = await apiService.admin.verifyAdmin();
      return response;
    } catch (err) {
      console.error('Token verification error:', err);
      return { success: false };
    }
  };

  // Get Admin Profile
  const getAdminProfile = async () => {
    try {
      const response = await apiService.admin.getAdminProfile();
      
      if (response.success && response.admin) {
        setAdmin(response.admin);
        localStorage.setItem('adminUser', JSON.stringify(response.admin));
      }
      
      return response;
    } catch (err) {
      console.error('Get admin profile error:', err);
      return { success: false };
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Check if user is admin (for conditional rendering)
  const isAdmin = () => {
    return !!admin;
  };

  const value = {
    admin,
    loading,
    error,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    registerAdmin,
    checkAdminLimit,
    verifyAdminToken,
    getAdminProfile,
    clearError
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
};

// Export both as default and named for flexibility
export default AdminAuthProvider;