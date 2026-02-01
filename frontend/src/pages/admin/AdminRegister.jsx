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

  // Function to validate SDC email domain
  const validateSDCDomain = (email) => {
    const domainRegex = /(^[a-zA-Z0-9._-]+\.sdc\.edu\.np$)|(^[a-zA-Z0-9._-]+@sdc\.edu\.np$)/;
    return domainRegex.test(email);
  };

  // Function to validate name
  const validateName = (name) => {
    // Check if name has at least 2 characters and contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  // Function to validate password strength
  const validatePasswordStrength = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    // ✅ Validate name before submission
    if (!validateName(formData.name)) {
      setError("Please enter a valid name (2-50 characters, letters only)");
      return;
    }
    
    // ✅ Validate SDC domain before submission
    if (!validateSDCDomain(formData.email)) {
      setError("Only SDC email addresses are allowed for admin registration");
      return;
    }
    
    if (!validatePasswordStrength(formData.password)) {
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

  // Real-time validation feedback
  const isNameValid = formData.name ? validateName(formData.name) : null;
  const isEmailValid = formData.email ? validateSDCDomain(formData.email) : null;
  const isPasswordValid = formData.password ? validatePasswordStrength(formData.password) : null;
  const passwordsMatch = formData.confirmPassword ? formData.password === formData.confirmPassword : null;
  const isFormValid = isNameValid && isEmailValid && isPasswordValid && passwordsMatch;

  if (!registrationOpen && limitInfo) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
        padding: "15px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          overflow: "hidden"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
            padding: "20px 15px",
            textAlign: "center",
            color: "white"
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: "24px",
              fontWeight: "700",
              letterSpacing: "0.5px"
            }}>
              Admin Registration Closed
            </h1>
          </div>

          <div style={{ padding: "25px 20px" }}>
            <div style={{
              padding: "20px",
              backgroundColor: "#fff8e1",
              border: "2px solid #ffd54f",
              borderRadius: "10px",
              textAlign: "center",
              marginBottom: "25px"
            }}>
              <div style={{ 
                fontSize: "40px",
                marginBottom: "12px",
                color: "#ff9800"
              }}>
                ⚠️
              </div>
              <h3 style={{
                color: "#f57c00",
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "8px"
              }}>
                Maximum Admin Limit Reached
              </h3>
              <p style={{ 
                color: "#5d4037",
                marginBottom: "12px",
                lineHeight: "1.5",
                fontSize: "14px"
              }}>
                Current Admins: <span style={{ fontWeight: "700" }}>{limitInfo.currentCount}/{limitInfo.maxAllowed}</span>
              </p>
              <p style={{ 
                color: "#795548",
                fontSize: "12px",
                fontStyle: "italic",
                marginBottom: "0"
              }}>
                Only 2 administrators are allowed for security reasons
              </p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button
                onClick={() => window.location.href = "/admin/login"}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#303f9f",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  marginBottom: "12px",
                  boxShadow: "0 4px 12px rgba(48, 63, 159, 0.3)"
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
                  fontSize: "13px",
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
                <span style={{ fontSize: "16px" }}>←</span>
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
      padding: "15px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        overflow: "hidden"
      }}>
        {/* Header with gradient - Made more compact */}
        <div style={{
          background: "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
          padding: "20px 15px",
          textAlign: "center",
          color: "white"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "12px"
          }}>
            <img 
              src="/logo.png" 
              alt="StudyReuse Logo"
              style={{ 
                height: "40px",
                borderRadius: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "4px"
              }}
            />
            <h1 style={{ 
              margin: 0, 
              fontSize: "26px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              color: "white",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
            }}>
              StudyReuse
            </h1>
          </div>
          <p style={{ 
            margin: "8px 0 0 0",
            opacity: 0.9,
            fontSize: "16px",
            fontWeight: "500"
          }}>
            Admin Portal - Registration
          </p>
          {limitInfo && (
            <div style={{
              display: "inline-block",
              marginTop: "12px",
              padding: "6px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "white",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "500",
              backdropFilter: "blur(10px)"
            }}>
              Admin slots available: {limitInfo.maxAllowed - limitInfo.currentCount}/{limitInfo.maxAllowed}
            </div>
          )}
        </div>

        <div style={{ padding: "25px 20px" }}>
          <h2 style={{ 
            textAlign: "center", 
            marginBottom: "20px",
            color: "#1a237e",
            fontSize: "22px",
            fontWeight: "600"
          }}>
            Administrator Registration
          </h2>
          
          {error && (
            <div style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #ffcdd2",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px" }}>⚠️</span>
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
                  fontSize: "16px"
                }}
              >
                ✕
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "13px"
              }}>
                Full Name
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
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
                  padding: "12px 14px",
                  border: isNameValid === false ? "1px solid #e74c3c" : 
                         isNameValid === true ? "1px solid #2ecc71" : "1px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  transition: "all 0.3s",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                onBlur={(e) => {
                  if (!formData.name) {
                    e.target.style.borderColor = "#e0e0e0";
                  } else if (validateName(formData.name)) {
                    e.target.style.borderColor = "#2ecc71";
                  } else {
                    e.target.style.borderColor = "#e74c3c";
                  }
                }}
              />
              <div style={{ 
                fontSize: "11px",
                color: isNameValid === false ? "#e74c3c" : 
                      isNameValid === true ? "#2ecc71" : "#666",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {formData.name ? (
                  isNameValid ? (
                    <>
                      <span>✓</span>
                      <span>Valid name format</span>
                    </>
                  ) : (
                    <>
                      <span>⚠</span>
                      <span>2-50 letters and spaces only</span>
                    </>
                  )
                ) : (
                  <>
                    <span>👤</span>
                    <span>Enter your full name</span>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: "18px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "13px"
              }}>
                SDC Email Address
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="admin@sdc.edu.np"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: isEmailValid === false ? "1px solid #e74c3c" : 
                         isEmailValid === true ? "1px solid #2ecc71" : "1px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  transition: "all 0.3s",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                onBlur={(e) => {
                  if (!formData.email) {
                    e.target.style.borderColor = "#e0e0e0";
                  } else if (validateSDCDomain(formData.email)) {
                    e.target.style.borderColor = "#2ecc71";
                  } else {
                    e.target.style.borderColor = "#e74c3c";
                  }
                }}
              />
              <div style={{ 
                fontSize: "11px",
                color: isEmailValid === false ? "#e74c3c" : 
                      isEmailValid === true ? "#2ecc71" : "#666",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {formData.email ? (
                  isEmailValid ? (
                    <>
                      <span>✓</span>
                      <span>Valid SDC email</span>
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
                    <span>Only @sdc.edu.np emails allowed</span>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: "18px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "13px"
              }}>
                Password
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
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
                    padding: "12px 45px 12px 14px",
                    border: isPasswordValid === false ? "1px solid #e74c3c" : 
                           isPasswordValid === true ? "1px solid #2ecc71" : "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    transition: "all 0.3s",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                  onBlur={(e) => {
                    if (!formData.password) {
                      e.target.style.borderColor = "#e0e0e0";
                    } else if (validatePasswordStrength(formData.password)) {
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
                    right: "14px",
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
                    width="18"
                    height="18"
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
                fontSize: "11px",
                color: isPasswordValid === false ? "#e74c3c" : 
                      isPasswordValid === true ? "#2ecc71" : "#888",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {formData.password ? (
                  isPasswordValid ? (
                    <>
                      <span>✓</span>
                      <span>Strong password</span>
                    </>
                  ) : (
                    <>
                      <span>⚠</span>
                      <span>At least 6 characters required</span>
                    </>
                  )
                ) : (
                  <>
                    <span>🔒</span>
                    <span>Use at least 6 characters</span>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "500",
                color: "#555",
                fontSize: "13px"
              }}>
                Confirm Password
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
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
                    padding: "12px 45px 12px 14px",
                    border: passwordsMatch === false ? "1px solid #e74c3c" : 
                           passwordsMatch === true ? "1px solid #2ecc71" : "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    transition: "all 0.3s",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#303f9f"}
                  onBlur={(e) => {
                    if (!formData.confirmPassword) {
                      e.target.style.borderColor = "#e0e0e0";
                    } else if (formData.password === formData.confirmPassword) {
                      e.target.style.borderColor = "#2ecc71";
                    } else {
                      e.target.style.borderColor = "#e74c3c";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
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
                    width="18"
                    height="18"
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
              <div style={{ 
                fontSize: "11px",
                color: passwordsMatch === false ? "#e74c3c" : 
                      passwordsMatch === true ? "#2ecc71" : "#888",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {formData.confirmPassword ? (
                  passwordsMatch ? (
                    <>
                      <span>✓</span>
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <span>⚠</span>
                      <span>Passwords do not match</span>
                    </>
                  )
                ) : (
                  <>
                    <span>🔒</span>
                    <span>Confirm your password</span>
                  </>
                )}
              </div>
            </div>

            {/* Terms checkbox - Made more compact */}
            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "25px",
              border: "1px solid #e0e0e0"
            }}>
              <label style={{ 
                display: "flex", 
                alignItems: "flex-start", 
                gap: "10px",
                cursor: "pointer"
              }}>
                <input 
                  type="checkbox" 
                  required 
                  style={{
                    marginTop: "3px",
                    width: "16px",
                    height: "16px",
                    cursor: "pointer"
                  }}
                />
                <span style={{ 
                  color: "#333", 
                  fontSize: "12px",
                  lineHeight: "1.5"
                }}>
                  I understand that as an administrator, I will have access to all user data, 
                  system controls, and administrative privileges.
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !registrationOpen || !isFormValid}
              style={{
                width: "100%",
                padding: "14px",
                background: isLoading || !registrationOpen || !isFormValid
                  ? "#ccc" 
                  : "linear-gradient(135deg, #303f9f 0%, #1a237e 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: isLoading || !registrationOpen || !isFormValid ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                letterSpacing: "0.5px",
                marginBottom: "20px",
                boxShadow: isLoading || !registrationOpen || !isFormValid 
                  ? "none" 
                  : "0 4px 12px rgba(48, 63, 159, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!isLoading && registrationOpen && isFormValid) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(48, 63, 159, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && registrationOpen && isFormValid) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(48, 63, 159, 0.3)";
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-4v3l-5-5 5-5v3h4v4z"/>
                  </svg>
                  Register as Administrator
                </>
              )}
            </button>
            
            <div style={{ 
              textAlign: "center", 
              paddingTop: "15px",
              borderTop: "1px solid #eee",
              marginBottom: "20px"
            }}>
              <p style={{ color: "#666", marginBottom: "8px", fontSize: "14px" }}>
                Already have admin access?
              </p>
              <Link 
                to="/admin/login" 
                style={{ 
                  color: "#303f9f", 
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "14px",
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
                <span style={{ fontSize: "16px" }}>→</span>
              </Link>
            </div>
            
            {/* User Registration Link - Made more compact */}
            <div style={{
              marginTop: "20px",
              paddingTop: "15px",
              borderTop: "1px solid #eee",
              textAlign: "center"
            }}>
              <p style={{ 
                color: "#666", 
                marginBottom: "8px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                User Registration
              </p>
              <p style={{ 
                color: "#888", 
                marginBottom: "12px",
                fontSize: "12px",
                lineHeight: "1.5"
              }}>
                Student? Register for regular access.
              </p>
              <button
                type="button"
                onClick={() => window.location.href = "/register"}
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 10px rgba(76, 175, 80, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#388E3C";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 6px 14px rgba(76, 175, 80, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#4CAF50";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 10px rgba(76, 175, 80, 0.3)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Register as User
              </button>
            </div>
          </form>
        </div>

        {/* Footer - Made more compact */}
        <div style={{
          padding: "15px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #eee"
        }}>
          <Link 
            to="/" 
            style={{ 
              color: "#666", 
              textDecoration: "none",
              fontSize: "13px",
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
            <span style={{ fontSize: "16px" }}>←</span>
            Back to StudyReuse Home
          </Link>
          <p style={{ 
            margin: "8px 0 0 0",
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
};

export default AdminRegister;