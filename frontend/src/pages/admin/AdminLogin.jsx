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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email || !password) {
      setError("Email and password are required");
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
      
      if (result.success) {
        console.log("Admin login successful");
        navigate('/admin/dashboard');
      } else {
        setError(result.message || "Admin login failed");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("Admin login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "450px",
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden"
      }}>
        {/* Header with gradient */}
        <div style={{
          background: "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
          padding: "30px 20px",
          textAlign: "center",
          color: "white"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "15px"
          }}>
            <img 
              src="/logo.png" 
              alt="StudyReuse Logo"
              style={{ 
                height: "50px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "5px"
              }}
            />
            <h1 style={{ 
              margin: 0, 
              fontSize: "32px", 
              fontWeight: "800",
              letterSpacing: "1px",
              color: "white",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)"
            }}>
              StudyReuse
            </h1>
          </div>
          <p style={{ 
            margin: "10px 0 0 0", 
            opacity: 0.9,
            fontSize: "18px",
            fontWeight: "500"
          }}>
            Admin Portal
          </p>
        </div>

        <div style={{ padding: "40px 30px" }}>
          <h2 style={{ 
            textAlign: "center", 
            marginBottom: "30px", 
            color: "#1a237e",
            fontSize: "24px",
            fontWeight: "600"
          }}>
            Administrator Login
          </h2>
          
          {error && (
            <div style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "25px",
              border: "1px solid #ffcdd2",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>⚠️</span>
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
                  fontSize: "18px"
                }}
              >
                ✕
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "22px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "10px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "14px"
              }}>
                Admin Email Address
              </label>
              <input
                type="email"
                placeholder="admin@ria.edu.np"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  transition: "all 0.3s",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
              <div style={{ 
                fontSize: "12px", 
                color: "#666", 
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>Use admin email credentials</span>
              </div>
            </div>
            
            <div style={{ marginBottom: "30px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "10px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "14px"
              }}>
                Admin Password
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
                    padding: "14px 50px 14px 16px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    transition: "all 0.3s",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
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
                    width="20" 
                    height="20" 
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
              <p style={{ 
                marginTop: "8px", 
                fontSize: "12px", 
                color: "#888",
                marginBottom: "0"
              }}>
                Use secure admin password
              </p>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "16px",
                background: isLoading 
                  ? "#ccc" 
                  : "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                letterSpacing: "0.5px",
                marginBottom: "25px",
                boxShadow: "0 4px 15px rgba(48, 63, 159, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(48, 63, 159, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(48, 63, 159, 0.3)";
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  Login as Administrator
                </>
              )}
            </button>
            
            <div style={{ 
              textAlign: "center", 
              paddingTop: "20px",
              borderTop: "1px solid #eee",
              marginBottom: "25px"
            }}>
              <p style={{ color: "#666", marginBottom: "8px" }}>
                Don't have admin access?
              </p>
              <Link 
                to="/admin/register" 
                style={{ 
                  color: "#303f9f", 
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "15px",
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
                <span style={{ fontSize: "18px" }}>→</span>
              </Link>
            </div>
            
            {/* User Login Link */}
            <div style={{
              marginTop: "30px",
              paddingTop: "25px",
              borderTop: "1px solid #eee",
              textAlign: "center"
            }}>
              <p style={{ 
                color: "#666", 
                marginBottom: "12px", 
                fontSize: "14px",
                fontWeight: "500"
              }}>
                User Login
              </p>
              <p style={{ 
                color: "#888", 
                marginBottom: "15px", 
                fontSize: "13px",
                lineHeight: "1.5"
              }}>
                Are you a regular user? Login to access student features.
              </p>
              <button
                type="button"
                onClick={() => window.location.href = "/login"}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#388E3C";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 18px rgba(76, 175, 80, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#4CAF50";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.3)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Login as User
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #eee"
        }}>
          <Link 
            to="/" 
            style={{ 
              color: "#666", 
              textDecoration: "none",
              fontSize: "14px",
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
            <span style={{ fontSize: "18px" }}>←</span>
            Back to StudyReuse Home
          </Link>
          <p style={{ 
            margin: "10px 0 0 0", 
            color: "#888", 
            fontSize: "11px",
            fontStyle: "italic"
          }}>
            Admin access is restricted to authorized personnel only
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;