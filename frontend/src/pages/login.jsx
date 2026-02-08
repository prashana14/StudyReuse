import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Function to validate SDC email domain
  const validateSDCDomain = (email) => {
    // Check if email ends with @sdc.edu.np or .sdc.edu.np
    const domainRegex = /(^[a-zA-Z0-9._-]+\.sdc\.edu\.np$)|(^[a-zA-Z0-9._-]+@sdc\.edu\.np$)/;
    return domainRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Client-side validation
    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }
    
    // ✅ Validate email format
    if (!/\S+@\S+\.\S+/.test(email) && !email.includes(".sdc.edu.np")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    
    // ✅ Validate SDC domain
    if (!validateSDCDomain(email)) {
      setError("Only SDC email addresses are allowed");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    console.log("Login attempt with:", { email: email.substring(0, 3) + '...' });

    try {
      console.log("Calling API endpoint: /users/login");
      
      const res = await API.post("/users/login", { email, password });
      console.log("Full login response:", res);
      
      // ✅ Check if response exists
      if (!res) {
        throw new Error("No response received from server");
      }
      
      // ✅ Handle different response structures
      let token, user;
      
      // Check various possible response structures
      if (res.data && res.data.token && res.data.user) {
        // Structure 1: { data: { token, user } }
        token = res.data.token;
        user = res.data.user;
      } else if (res.data && res.data.data && res.data.data.token) {
        // Structure 2: { data: { data: { token, user } } }
        token = res.data.data.token;
        user = res.data.data.user;
      } else if (res.data && res.data.accessToken) {
        // Structure 3: { data: { accessToken, user } }
        token = res.data.accessToken;
        user = res.data.user;
      } else if (res.token) {
        // Structure 4: Direct { token, user } (rare)
        token = res.token;
        user = res.user;
      } else {
        // Check for error messages in response
        const errorMsg = res.data?.message || res.data?.error || "Invalid response format";
        throw new Error(errorMsg);
      }
      
      // ✅ Validate token and user
      if (!token) {
        throw new Error("Authentication token not received");
      }
      
      if (!user) {
        console.warn("User data not received, using minimal user object");
        user = { email: email };
      }
      
      console.log("Login successful. Token received:", token ? "Yes" : "No");
      console.log("User data:", user);
      
      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      console.log("Saved to localStorage:", {
        token: token.substring(0, 10) + '...',
        userEmail: user.email
      });
      
      // Update AuthContext
      login({ token, user });
      
      console.log("Login successful, redirecting to dashboard");
      navigate("/dashboard");
      
    } catch (err) {
      console.error("Login error details:", {
        name: err.name,
        message: err.message,
        response: err.response,
        request: err.request
      });
      
      // Handle different error types
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const serverError = err.response.data?.message || 
                          err.response.data?.error || 
                          err.response.data?.details ||
                          "Login failed";
        
        switch(status) {
          case 400:
            setError(serverError.includes("Invalid") ? 
              "Invalid email or password" : 
              serverError);
            break;
          case 401:
            setError("Unauthorized. Please check your credentials.");
            break;
          case 404:
            setError("User not found. Please register first.");
            break;
          case 422:
            setError("Validation error: " + serverError);
            break;
          case 429:
            setError("Too many attempts. Please try again later.");
            break;
          case 500:
            setError("Server error. Please try again later.");
            break;
          default:
            setError(serverError);
        }
      } else if (err.request) {
        // Request was made but no response
        console.error("No response received. Request:", err.request);
        setError("Cannot connect to server. Please check if backend is running on port 4000.");
        
        // Add helpful debugging info
        if (process.env.NODE_ENV === 'development') {
          console.info("Backend should be running on: http://localhost:4000");
          console.info("Check: 1) Is backend running? 2) CORS configured?");
        }
      } else if (err.message.includes("Network Error")) {
        setError("Network error. Please check your internet connection.");
      } else if (err.message.includes("timeout")) {
        setError("Request timeout. Server is taking too long to respond.");
      } else {
        // Other errors
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Safely get base URL for debug info
  const getBaseURL = () => {
    try {
      return API.defaults?.baseURL || "Not configured";
    } catch (err) {
      return "Error retrieving base URL";
    }
  };

  return (
    <div style={{
      minHeight: "90vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backgroundColor: "#f5f7fa"
    }}>
      <div style={{
        maxWidth: "400px",
        width: "100%",
        margin: "0 auto",
        padding: "25px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
        position: "relative"
      }}>
        {/* CLOSE BUTTON FOR MOBILE */}
        <button
          onClick={() => navigate("/")}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "#999",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f5f5f5";
            e.target.style.color = "#333";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#999";
          }}
          title="Close"
        >
          ×
        </button>

        <h2 style={{ 
          textAlign: "center", 
          marginBottom: "10px",
          color: "#2c3e50",
          fontSize: "20px",
          fontWeight: "600",
          marginTop: "5px"
        }}>Login to StudyReuse</h2>
        
        <p style={{
          textAlign: "center",
          color: "#7f8c8d",
          marginBottom: "20px",
          fontSize: "13px",
          lineHeight: "1.4"
        }}>
          Access your SDC Study Materials
        </p>
        
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <img 
            src="/logo.png" 
            alt="StudyReuse Logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/80/3498db/ffffff?text=SR";
            }}
            style={{ 
              height: "60px",
              width: "60px",
              marginBottom: "5px",
              borderRadius: "50%",
              boxShadow: "0 4px 10px rgba(52, 152, 219, 0.25)",
              objectFit: "cover",
              border: "3px solid #3498db"
            }}
          />
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <div style={{
            marginBottom: "15px",
            padding: "10px 12px",
            backgroundColor: "#ffeaea",
            border: "1px solid #ffcccc",
            borderRadius: "8px",
            color: "#e74c3c",
            fontSize: "12px",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            animation: "fadeIn 0.3s ease"
          }}>
            <span style={{ 
              fontSize: "14px",
              flexShrink: 0,
              marginTop: "1px"
            }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", marginBottom: "2px", fontSize: "12px" }}>Login Error</strong>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                color: "#e74c3c",
                cursor: "pointer",
                padding: "0",
                fontSize: "14px",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "all 0.2s",
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#ffcccc"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "5px", 
              fontWeight: "500",
              color: "#2c3e50",
              fontSize: "13px"
            }}>
              Email Address
              <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
            </label>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 14px",
                border: error.includes("email") ? "1px solid #e74c3c" : "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                transition: "all 0.3s",
                backgroundColor: loading ? "#f9f9f9" : "white"
              }}
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = "#3498db";
                  e.target.style.boxShadow = "0 0 0 3px rgba(52, 152, 219, 0.15)";
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error.includes("email") ? "#e74c3c" : "#ddd";
                e.target.style.boxShadow = "none";
              }}
            />
            <div style={{ 
              fontSize: "11px", 
              color: "#7f8c8d", 
              marginTop: "5px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
            </div>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <label style={{ 
                display: "block", 
                fontWeight: "500",
                color: "#2c3e50",
                fontSize: "13px"
              }}>
                Password
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3498db",
                  cursor: "pointer",
                  padding: "0",
                  fontSize: "11px",
                  fontWeight: "500",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                disabled={loading}
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 14px",
                  border: error.includes("password") ? "1px solid #e74c3c" : "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  transition: "all 0.3s",
                  backgroundColor: loading ? "#f9f9f9" : "white"
                }}
                onFocus={(e) => {
                  if (!loading) {
                    e.target.style.borderColor = "#3498db";
                    e.target.style.boxShadow = "0 0 0 3px rgba(52, 152, 219, 0.15)";
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error.includes("password") ? "#e74c3c" : "#ddd";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#7f8c8d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  transition: "all 0.3s",
                  opacity: loading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                disabled={loading}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
            <div style={{ 
              fontSize: "11px", 
              color: "#7f8c8d", 
              marginTop: "5px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#a0d1f9" : "#3498db",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: loading ? "none" : "0 4px 12px rgba(52, 152, 219, 0.25)"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#2980b9";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(52, 152, 219, 0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#3498db";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(52, 152, 219, 0.25)";
              }
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid white",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></span>
                Authenticating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Login
              </>
            )}
          </button>
          
          <div style={{ textAlign: "center", marginTop: "15px", paddingBottom: "10px" }}>
            <p style={{ color: "#7f8c8d", fontSize: "13px" }}>
              Don't have an account?{" "}
              <a 
                href="/register" 
                style={{ 
                  color: "#3498db", 
                  textDecoration: "none", 
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.textDecoration = "underline";
                  e.target.style.color = "#2980b9";
                }}
                onMouseLeave={(e) => {
                  e.target.style.textDecoration = "none";
                  e.target.style.color = "#3498db";
                }}
              >
                Create Account
              </a>
            </p>
          </div>
          
          {/* FORGOT PASSWORD SECTION */}
          {/* <div style={{ 
            textAlign: "center", 
            marginTop: "12px",
            padding: "12px 0",
            borderTop: "1px solid #eee"
          }}>
            <a 
              href="/forgot-password" 
              style={{ 
                color: "#7f8c8d", 
                textDecoration: "none", 
                fontSize: "12px",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#3498db";
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#7f8c8d";
                e.target.style.textDecoration = "none";
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Forgot Password?
            </a>
          </div> */}
          
          {/* ADMIN ACCESS SECTION - Made much more compact */}
          <div style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #eee",
            textAlign: "center"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "5px",
              marginBottom: "6px"
            }}>
              <span style={{ 
                backgroundColor: "#e74c3c", 
                color: "white",
                padding: "1px 6px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: "600"
              }}>ADMIN</span>
              <span style={{ 
                color: "#7f8c8d", 
                fontSize: "12px",
                fontWeight: "500"
              }}>
                Administrator Access
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.location.href = "/admin/login"}
              style={{
                padding: "6px 16px",
                backgroundColor: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 2px 6px rgba(231, 76, 60, 0.2)"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#c0392b";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 10px rgba(231, 76, 60, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#e74c3c";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 6px rgba(231, 76, 60, 0.2)";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              Admin Portal
            </button>
            <p style={{ 
              marginTop: "6px", 
              color: "#95a5a6", 
              fontSize: "10px",
              fontStyle: "italic"
            }}>
              Restricted access for authorized personnel only
            </p>
          </div>
        </form>

        {/* FOOTER - Placed outside the main container so it's only visible when scrolling */}
        <div style={{
          marginTop: "15px",
          paddingTop: "10px",
          borderTop: "1px solid #eee",
          textAlign: "center"
        }}>
          <p style={{ 
            color: "#95a5a6", 
            fontSize: "11px",
            marginBottom: "4px"
          }}>
            © {new Date().getFullYear()} StudyReuse - SDC Materials
          </p>
          {/* <p style={{ 
            color: "#bdc3c7", 
            fontSize: "10px",
            marginBottom: "0"
          }}>
            v1.0.0 • For SDC students and faculty only
          </p> */}
        </div>

        {/* DEBUG INFO - Made very compact or removable */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: "15px",
            padding: "8px 10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            fontSize: "10px",
            color: "#7f8c8d",
            border: "1px dashed #ddd"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px" }}>🔧</span>
              <strong style={{ fontSize: "10px" }}>Dev Info</strong>
            </div>
            <div style={{ fontSize: "9px" }}>Backend: {getBaseURL()}</div>
          </div>
        )} */}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          /* Better focus styles for accessibility */
          *:focus {
            outline: 2px solid #3498db;
            outline-offset: 2px;
          }
          
          /* Smooth transitions */
          input, button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Disabled state */
          input:disabled, button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;