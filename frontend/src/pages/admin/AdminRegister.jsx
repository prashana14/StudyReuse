import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [limitInfo, setLimitInfo] = useState(null);
  const { registerAdmin, checkAdminLimit } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLimit = async () => {
      const info = await checkAdminLimit();
      setLimitInfo(info);
      setRegistrationOpen(info.allowed);
    };
    
    checkLimit();
  }, [checkAdminLimit]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateRIADomain = (email) => {
    const domainRegex = /(^[a-zA-Z0-9._-]+\.ria\.edu\.np$)|(^[a-zA-Z0-9._-]+@ria\.edu\.np$)/;
    return domainRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    if (!validateRIADomain(formData.email)) {
      setError("Only RIA email addresses are allowed for admin registration");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await registerAdmin(
        formData.name,
        formData.email,
        formData.password
      );
      
      if (result.success) {
        console.log("Admin registration successful");
        navigate('/admin/dashboard');
      } else {
        setError(result.message || "Admin registration failed");
      }
    } catch (err) {
      console.error("Admin registration error:", err);
      if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        setError("Admin registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!registrationOpen && limitInfo) {
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
          <div style={{
            background: "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
            padding: "30px 20px",
            textAlign: "center",
            color: "white"
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: "28px", 
              fontWeight: "700",
              letterSpacing: "1px"
            }}>
              Admin Registration Closed
            </h1>
          </div>

          <div style={{ padding: "40px 30px" }}>
            <div style={{
              padding: "25px",
              backgroundColor: "#fff8e1",
              border: "2px solid #ffd54f",
              borderRadius: "12px",
              textAlign: "center",
              marginBottom: "30px"
            }}>
              <div style={{ 
                fontSize: "48px",
                marginBottom: "15px",
                color: "#ff9800"
              }}>
                ⚠️
              </div>
              <h3 style={{
                color: "#f57c00",
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "10px"
              }}>
                Maximum Admin Limit Reached
              </h3>
              <p style={{ 
                color: "#5d4037",
                marginBottom: "15px",
                lineHeight: "1.5"
              }}>
                Current Admins: <span style={{ fontWeight: "700" }}>{limitInfo.currentCount}/{limitInfo.maxAllowed}</span>
              </p>
              <p style={{ 
                color: "#795548",
                fontSize: "13px",
                fontStyle: "italic",
                marginBottom: "0"
              }}>
                Only 2 administrators are allowed for security reasons
              </p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <button
                onClick={() => window.location.href = "/admin/login"}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "#303f9f",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  marginBottom: "15px",
                  boxShadow: "0 4px 15px rgba(48, 63, 159, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#1a237e";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#303f9f";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Go to Admin Login
              </button>
              
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
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Admin Portal - Registration
          </p>
          {limitInfo && (
            <div style={{
              display: "inline-block",
              marginTop: "15px",
              padding: "8px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "white",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500",
              backdropFilter: "blur(10px)"
            }}>
              Admin slots available: {limitInfo.maxAllowed - limitInfo.currentCount}/{limitInfo.maxAllowed}
            </div>
          )}
        </div>

        <div style={{ padding: "40px 30px" }}>
          <h2 style={{ 
            textAlign: "center", 
            marginBottom: "30px", 
            color: "#1a237e",
            fontSize: "24px",
            fontWeight: "600"
          }}>
            Administrator Registration
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
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
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
            </div>
            
            <div style={{ marginBottom: "22px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "10px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "14px"
              }}>
                RIA Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="admin@ria.edu.np"
                value={formData.email}
                onChange={handleChange}
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
                alignItems: "center"
              }}>
                <span>Only @ria.edu.np emails allowed for admin access</span>
              </div>
            </div>
            
            <div style={{ marginBottom: "22px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "10px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "14px"
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
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
                Use at least 6 characters with strong security
              </p>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "10px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "14px"
              }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? (
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
            </div>

            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "30px",
              border: "1px solid #e0e0e0"
            }}>
              <label style={{ 
                display: "flex", 
                alignItems: "flex-start", 
                gap: "12px",
                cursor: "pointer"
              }}>
                <input 
                  type="checkbox" 
                  required 
                  style={{
                    marginTop: "4px",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer"
                  }}
                />
                <span style={{ 
                  color: "#333", 
                  fontSize: "13px",
                  lineHeight: "1.5"
                }}>
                  I understand that as an administrator, I will have access to all user data, 
                  system controls, and administrative privileges. I agree to use these powers 
                  responsibly and only for StudyReuse management purposes.
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !registrationOpen}
              style={{
                width: "100%",
                padding: "16px",
                background: isLoading || !registrationOpen
                  ? "#ccc" 
                  : "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading || !registrationOpen ? "not-allowed" : "pointer",
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
                if (!isLoading && registrationOpen) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(48, 63, 159, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && registrationOpen) {
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
                  Creating Admin Account...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-4v3l-5-5 5-5v3h4v4z"/>
                  </svg>
                  Register as Administrator
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
                Already have admin access?
              </p>
              <Link 
                to="/admin/login" 
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
                Login to Admin Panel
                <span style={{ fontSize: "18px" }}>→</span>
              </Link>
            </div>
            
            {/* User Registration Link */}
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
                User Registration
              </p>
              <p style={{ 
                color: "#888", 
                marginBottom: "15px", 
                fontSize: "13px",
                lineHeight: "1.5"
              }}>
                Are you a student? Register for regular user access.
              </p>
              <button
                type="button"
                onClick={() => window.location.href = "/register"}
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
                Register as User
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
            Administrator registration requires special authorization
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

export default AdminRegister;