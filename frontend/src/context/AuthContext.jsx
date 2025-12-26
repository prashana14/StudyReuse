import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    console.log("AuthProvider initializing...");
    console.log("Stored user:", storedUser);
    console.log("Stored token:", token ? "Yes" : "No");
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
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
    
    console.log("User logged in and saved:", data.user);
  };

  const logout = () => {
    console.log("AuthContext logout called");
    
    // Remove from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Update state
    setUser(null);
    
    console.log("User logged out");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};