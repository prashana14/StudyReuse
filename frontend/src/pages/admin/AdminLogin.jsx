import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  // Function to validate SDC email domain
  const validateSDCDomain = (email) => {
    // Check if email ends with @sdc.edu.np or .sdc.edu.np
    const domainRegex = /(^[a-zA-Z0-9._-]+\.sdc\.edu\.np$)|(^[a-zA-Z0-9._-]+@sdc\.edu\.np$)/;
    return domainRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }
    
    // ✅ Validate SDC domain before submission
    if (!validateSDCDomain(email)) {
      setError("Only SDC admin emails are allowed (@sdc.edu.np)");
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    console.log("Admin login attempt with:", { email });

    try {
      const result = await loginAdmin(email, password);
      console.log("Login result:", result);
      
      if (result.success) {
        console.log("Admin login successful");
        navigate('/admin/dashboard');
      } else {
        console.log("Login failed with message:", result.message);
        setError(result.message || "Admin login failed");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      console.error("Error details:", err.response);
      if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("Admin login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time validation feedback
  const isEmailValid = email ? validateSDCDomain(email) : null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
      padding: "15px" // Reduced
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px", // Reduced from 450px
        backgroundColor: "white",
        borderRadius: "12px", // Reduced from 16px
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)", // Reduced
        overflow: "hidden"
      }}>
        {/* Header with gradient - Made more compact */}
        <div style={{
          background: "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
          padding: "20px 15px", // Reduced
          textAlign: "center",
          color: "white"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "12px" // Reduced
          }}>
            <img 
              src="/logo.png" 
              alt="StudyReuse Logo"
              style={{ 
                height: "40px", // Reduced from 50px
                borderRadius: "6px", // Reduced
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "4px" // Reduced
              }}
            />
            <h1 style={{ 
              margin: 0, 
              fontSize: "26px", // Reduced from 32px
              fontWeight: "700", // Reduced from 800
              letterSpacing: "0.5px", // Reduced
              color: "white",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)" // Reduced
            }}>
              StudyReuse
            </h1>
          </div>
          <p style={{ 
            margin: "8px 0 0 0", // Reduced
            opacity: 0.9,
            fontSize: "16px", // Reduced from 18px
            fontWeight: "500"
          }}>
            Admin Portal
          </p>
        </div>

        <div style={{ padding: "25px 20px" }}> {/* Reduced padding */}
          <h2 style={{ 
            textAlign: "center", 
            marginBottom: "20px", // Reduced from 30px
            color: "#1a237e",
            fontSize: "22px", // Reduced from 24px
            fontWeight: "600"
          }}>
            Administrator Login
          </h2>
          
          {error && (
            <div style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "10px 14px", // Reduced
              borderRadius: "8px",
              marginBottom: "20px", // Reduced
              border: "1px solid #ffcdd2",
              fontSize: "13px", // Reduced
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}> {/* Reduced gap */}
                <span style={{ fontSize: "14px" }}>⚠️</span> {/* Reduced */}
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#d32f2f",
                  cursor: "pointer",
                  padding: "0",
                  fontSize: "16px" // Reduced
                }}
              >
                ✕
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}> {/* Reduced */}
              <label style={{ 
                display: "block", 
                marginBottom: "8px", // Reduced
                fontWeight: "500",
                color: "#555",
                fontSize: "13px" // Reduced
              }}>
                Admin Email Address
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
              </label>
              <input
                type="email"
                placeholder="admin@sdc.edu.np"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px", // Reduced
                  border: isEmailValid === false ? "1px solid #e74c3c" : 
                         isEmailValid === true ? "1px solid #2ecc71" : "1px solid #e0e0e0",
                  borderRadius: "8px", // Reduced
                  fontSize: "14px", // Reduced
                  boxSizing: "border-box",
                  transition: "all 0.3s",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                onBlur={(e) => {
                  if (!email) {
                    e.target.style.borderColor = "#e0e0e0";
                  } else if (validateSDCDomain(email)) {
                    e.target.style.borderColor = "#2ecc71";
                  } else {
                    e.target.style.borderColor = "#e74c3c";
                  }
                }}
              />
              <div style={{ 
                fontSize: "11px", // Reduced
                color: isEmailValid === false ? "#e74c3c" : 
                      isEmailValid === true ? "#2ecc71" : "#666", 
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {email ? (
                  isEmailValid ? (
                    <>
                      <span>✓</span>
                      <span>Valid SDC admin email</span>
                    </>
                  ) : (
                    <>
                      <span>⚠</span>
                      <span>Must be @sdc.edu.np domain</span>
                    </>
                  )
                ) : (
                  <>
                    <span>📧</span>
                    <span>Use SDC admin email (@sdc.edu.np)</span>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: "25px" }}> {/* Reduced */}
              <label style={{ 
                display: "block", 
                marginBottom: "8px", // Reduced
                fontWeight: "500",
                color: "#555",
                fontSize: "13px" // Reduced
              }}>
                Admin Password
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 45px 12px 14px", // Reduced
                    border: password.length > 0 && password.length < 6 ? 
                           "1px solid #e74c3c" : 
                           password.length >= 6 ? "1px solid #2ecc71" : "1px solid #e0e0e0",
                    borderRadius: "8px", // Reduced
                    fontSize: "14px", // Reduced
                    boxSizing: "border-box",
                    transition: "all 0.3s",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                  onBlur={(e) => {
                    if (!password) {
                      e.target.style.borderColor = "#e0e0e0";
                    } else if (password.length >= 6) {
                      e.target.style.borderColor = "#2ecc71";
                    } else {
                      e.target.style.borderColor = "#e74c3c";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px", // Adjusted
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                  <svg 
                    width="18" // Reduced
                    height="18" // Reduced
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>
              </div>
              <div style={{ 
                fontSize: "11px", // Reduced
                color: password.length > 0 && password.length < 6 ? "#e74c3c" : 
                      password.length >= 6 ? "#2ecc71" : "#888",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {password.length > 0 ? (
                  password.length >= 6 ? (
                    <>
                      <span>✓</span>
                      <span>Strong password</span>
                    </>
                  ) : (
                    <>
                      <span>⚠</span>
                      <span>Password must be at least 6 characters</span>
                    </>
                  )
                ) : (
                  <>
                    <span>🔒</span>
                    <span>Use secure admin password</span>
                  </>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !isEmailValid || password.length < 6}
              style={{
                width: "100%",
                padding: "14px", // Reduced
                background: isLoading || !isEmailValid || password.length < 6
                  ? "#ccc" 
                  : "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px", // Reduced
                fontSize: "15px", // Reduced
                fontWeight: "600",
                cursor: isLoading || !isEmailValid || password.length < 6 ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                letterSpacing: "0.5px",
                marginBottom: "20px", // Reduced
                boxShadow: isLoading || !isEmailValid || password.length < 6 
                  ? "none" 
                  : "0 4px 12px rgba(48, 63, 159, 0.3)", // Reduced
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!isLoading && isEmailValid && password.length >= 6) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(48, 63, 159, 0.4)"; // Reduced
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && isEmailValid && password.length >= 6) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(48, 63, 159, 0.3)"; // Reduced
                }
              }}
            >
              {isLoading ? (
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}> {/* Reduced */}
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  Login as Administrator
                </>
              )}
            </button>
            
            <div style={{ 
              textAlign: "center", 
              paddingTop: "15px", // Reduced
              borderTop: "1px solid #eee",
              marginBottom: "20px" // Reduced
            }}>
              <p style={{ color: "#666", marginBottom: "8px", fontSize: "14px" }}> {/* Reduced */}
                Don't have admin access?
              </p>
              <Link 
                to="/admin/register" 
                style={{ 
                  color: "#303f9f", 
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "14px", // Reduced
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#1a237e";
                  e.target.style.gap = "8px";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#303f9f";
                  e.target.style.gap = "6px";
                }}
              >
                Register as Administrator
                <span style={{ fontSize: "16px" }}>→</span> {/* Reduced */}
              </Link>
            </div>
            
            {/* User Login Link - Made more compact */}
            <div style={{
              marginTop: "20px", // Reduced
              paddingTop: "15px", // Reduced
              borderTop: "1px solid #eee",
              textAlign: "center"
            }}>
              <p style={{ 
                color: "#666", 
                marginBottom: "8px", // Reduced
                fontSize: "13px", // Reduced
                fontWeight: "500"
              }}>
                User Login
              </p>
              <p style={{ 
                color: "#888", 
                marginBottom: "12px", // Reduced
                fontSize: "12px", // Reduced
                lineHeight: "1.5"
              }}>
                Regular user? Login to access student features.
              </p>
              <button
                type="button"
                onClick={() => window.location.href = "/login"}
                style={{
                  padding: "8px 20px", // Reduced
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px", // Reduced
                  fontSize: "13px", // Reduced
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px", // Reduced
                  boxShadow: "0 4px 10px rgba(76, 175, 80, 0.3)" // Reduced
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#388E3C";
                  e.target.style.transform = "translateY(-1px)"; // Reduced
                  e.target.style.boxShadow = "0 6px 14px rgba(76, 175, 80, 0.4)"; // Reduced
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#4CAF50";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 10px rgba(76, 175, 80, 0.3)"; // Reduced
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"> {/* Reduced */}
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Login as User
              </button>
            </div>
          </form>
        </div>

        {/* Footer - Made more compact */}
        <div style={{
          padding: "15px", // Reduced
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #eee"
        }}>
          <Link 
            to="/" 
            style={{ 
              color: "#666", 
              textDecoration: "none",
              fontSize: "13px", // Reduced
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#303f9f";
              e.target.style.gap = "8px";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#666";
              e.target.style.gap = "6px";
            }}
          >
            <span style={{ fontSize: "16px" }}>←</span> {/* Reduced */}
            Back to StudyReuse Home
          </Link>
          <p style={{ 
            margin: "8px 0 0 0", // Reduced
            color: "#888", 
            fontSize: "10px", // Reduced
            fontStyle: "italic"
          }}>
            Admin access restricted to authorized personnel
          </p>
        </div>
      </div>
      
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
  );
}

export default AdminLogin;