import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user ID consistently
  const getUserId = (userObj) => {
    if (!userObj) return null;
    return userObj.id || userObj._id || userObj.userId;
  };

  // Check localStorage on initial load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          console.log('Auth initialized from localStorage:', {
            userId: getUserId(parsedUser),
            email: parsedUser.email
          });
        } else {
          console.log('No stored auth data found');
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (authData) => {
    try {
      console.log('Login called with:', authData);
      
      if (!authData.token || !authData.user) {
        throw new Error('Invalid login data');
      }
      
      const userId = getUserId(authData.user);
      console.log('Extracted user ID:', userId);
      
      // Save to localStorage
      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));
      
      // Update state
      setUser(authData.user);
      setToken(authData.token);
      
      console.log('Login successful:', {
        userId: userId,
        email: authData.user.email,
        role: authData.user.role
      });
      
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    console.log('Logout called');
    
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Clear state
    setUser(null);
    setToken(null);
    
    console.log('Logout complete');
  };

  const refreshUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('User refreshed:', getUserId(parsedUser));
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const value = {
    user,
    token, // ✅ FIXED: Added token to context
    login,
    logout,
    loading,
    refreshUser,
    getUserId: () => getUserId(user),
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};