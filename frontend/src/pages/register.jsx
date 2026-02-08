import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to validate SDC email domain
  const validateSDCDomain = (email) => {
    // Check if email ends with @sdc.edu.np or .sdc.edu.np
    const domainRegex = /(^[a-zA-Z0-9._-]+\.sdc\.edu\.np$)|(^[a-zA-Z0-9._-]+@sdc\.edu\.np$)/;
    return domainRegex.test(email);
  };

  // Function to validate name
  const validateName = (name) => {
    // Check if name has at least 3 characters and contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    return nameRegex.test(name.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Validate name before submission
    if (!validateName(formData.name)) {
      setError("Please enter a valid name (2-50 characters, letters only)");
      setLoading(false);
      return;
    }

    // ✅ Validate SDC domain before submission
    if (!validateSDCDomain(formData.email)) {
      setError("Only SDC students are allowed (use @sdc.edu.np email)");
      setLoading(false);
      return;
    }

    // ✅ Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    console.log("Registration attempt with:", formData);

    try {
      console.log("Calling API endpoint: /users/register");
      
      const response = await api.post("/users/register", formData);
      console.log("Registration response:", response);
      
      if (response && response.token && response.user) {
        // Save to localStorage
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Call login from context if it exists
        if (login) {
          login(response);
        }
        
        alert("Registration successful!");
        navigate("/dashboard");
      } else {
        console.error("Invalid response structure:", response);
        setError("Registration response missing data. Please contact support.");
      }
    } catch (err) {
      console.error("Full registration error:", err);
      console.error("Error message:", err.message);
      console.error("Error response data:", err.response?.data);
      console.error("Error response status:", err.response?.status);
      
      if (err.response?.status === 400) {
        if (err.response?.data?.message === "User already exists") {
          setError("An account with this email already exists. Please login instead.");
        } else {
          setError(err.response?.data?.message || "Registration failed");
        }
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running on port 4000.");
        console.log("Make sure your backend server is running: 'npm start' in backend folder");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation feedback
  const isNameValid = formData.name ? validateName(formData.name) : null;
  const isEmailValid = formData.email ? validateSDCDomain(formData.email) : null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        overflow: "hidden"
      }}>
       {/* Header with gradient */}
      <div style={{
        background: "linear-gradient(135deg, #d2baebc3 0%, #87a8e1c8 100%)",
        padding: "20px 15px",
        textAlign: "center",
        color: "black"
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
            backgroundColor: "rgba(248, 208, 208, 0.2)",
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
        fontSize: "16px"
      }}>
        Join SDC student community
      </p>
      </div>

        <div style={{ padding: "25px 20px" }}>
          <h2 style={{ 
            textAlign: "center", 
            marginBottom: "20px",
            color: "#215eecff",
            fontSize: "22px",
            fontWeight: "600"
          }}>
            Create Account
          </h2>
          
          {error && (
            <div style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #ffcdd2",
              fontSize: "13px"
            }}>
              {error}
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
                name="name"
                type="text"
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
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
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
                      <span>Use 3-50 letters and spaces only</span>
                    </>
                  )
                ) : (
                  <>
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
              Email Address
              <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="username@sdc.edu.np"
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
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
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
                      <span>Must end with @sdc.edu.np</span>
                    </>
                  )
                ) : (
                  <>
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
                Password
                <span style={{ color: "#e74c3c", marginLeft: "4px" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 45px 12px 14px",
                    border: formData.password.length > 0 && formData.password.length < 6 ? 
                           "1px solid #e74c3c" : 
                           formData.password.length >= 6 ? "1px solid #2ecc71" : "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    transition: "all 0.3s",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => {
                    if (!formData.password) {
                      e.target.style.borderColor = "#e0e0e0";
                    } else if (formData.password.length >= 6) {
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
                color: formData.password.length > 0 && formData.password.length < 6 ? "#e74c3c" : 
                      formData.password.length >= 6 ? "#2ecc71" : "#888",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {formData.password.length > 0 ? (
                  formData.password.length >= 6 ? (
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
                  </>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !isNameValid || !isEmailValid || formData.password.length < 6}
              style={{
                width: "100%",
                padding: "14px",
                background: loading || !isNameValid || !isEmailValid || formData.password.length < 6
                  ? "#ccc" 
                  : "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading || !isNameValid || !isEmailValid || formData.password.length < 6 ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                letterSpacing: "0.5px",
                marginBottom: "20px",
                boxShadow: loading || !isNameValid || !isEmailValid || formData.password.length < 6 
                  ? "none" 
                  : "0 4px 12px rgba(106, 17, 203, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!loading && isNameValid && isEmailValid && formData.password.length >= 6) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(106, 17, 203, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && isNameValid && isEmailValid && formData.password.length >= 6) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(106, 17, 203, 0.3)";
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
                  Creating Account...
                </>
              ) : (
                <>
                Create Account
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
                Already have a SDC account?
              </p>
              <Link 
                to="/login" 
                style={{ 
                  color: "#6a11cb", 
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#2575fc";
                  e.target.style.gap = "8px";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#6a11cb";
                  e.target.style.gap = "6px";
                }}
              >
                Sign in to your account
                <span style={{ fontSize: "16px" }}>→</span>
              </Link>
            </div>
            
            <div style={{
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
                Admin Registration
              </p>
              <p style={{ 
                color: "#888", 
                marginBottom: "12px",
                fontSize: "12px",
                lineHeight: "1.5"
              }}>
                Need administrator account? Use admin portal.
              </p>
              <button
                type="button"
                onClick={() => window.location.href = "/admin/register"}
                style={{
                  padding: "10px 22px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 10px rgba(40, 167, 69, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#218838";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 6px 14px rgba(40, 167, 69, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#28a745";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 10px rgba(40, 167, 69, 0.3)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Register as Admin
              </button>
            </div>
          </form>
        </div>

        <div style={{
          padding: "15px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #eee"
        }}>
          <p style={{ 
            margin: 0, 
            color: "#888", 
            fontSize: "12px",
            lineHeight: "1.5"
          }}>
            By registering, you agree to our{" "}
            <a href="#" style={{ color: "#6a11cb", textDecoration: "none" }}>
              Terms
            </a>{" "}
            and{" "}
            <a href="#" style={{ color: "#6a11cb", textDecoration: "none" }}>
              Privacy Policy
            </a>
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

export default Register;