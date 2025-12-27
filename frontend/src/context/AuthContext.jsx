import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

// ✅ ADD THIS CUSTOM HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // ✅ Add token to state
  const [loading, setLoading] = useState(true);

  // Check localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    console.log("AuthProvider initializing...");
    console.log("Stored user:", storedUser);
    console.log("Stored token:", storedToken ? "Yes" : "No");
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken); // ✅ Store token in state
        console.log("User loaded from localStorage:", parsedUser);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    console.log("AuthContext login called with:", data);
    
    // Save to localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    // Update state
    setUser(data.user);
    setToken(data.token); // ✅ Store token in state
    
    console.log("User logged in and saved:", data.user);
  };

  const logout = () => {
    console.log("AuthContext logout called");
    
    // Remove from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Update state
    setUser(null);
    setToken(null); // ✅ Clear token from state
    
    console.log("User logged out");
  };

  const value = {
    user,
    token, // ✅ Make token available
    login,
    logout,
    loading,
    isAuthenticated: !!token // ✅ Add helper property
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};