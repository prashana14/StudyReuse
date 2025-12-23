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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("Registration attempt with:", formData);

    try {
      console.log("Calling API endpoint: /users/register");
      
      const res = await api.post("/users/register", formData);
      console.log("Registration response:", res.data);
      
      if (res.data.token && res.data.user) {
        // Save to localStorage and context
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        if (login) {
          login(res.data);
        }
        
        alert("Registration successful!");
        navigate("/dashboard");
      } else {
        setError("Registration response missing data");
      }
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response data:", err.response?.data);
      
      if (err.response?.status === 400) {
        if (err.response?.data?.message === "User already exists") {
          setError("An account with this email already exists. Please login instead.");
        } else {
          setError(err.response?.data?.message || "Registration failed");
        }
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running on port 4000.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: "450px",
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden"
      }}>
        {/* Header with gradient */}
        <div style={{
          background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
          padding: "30px 20px",
          textAlign: "center",
          color: "white"
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: "28px", 
            fontWeight: "700",
            letterSpacing: "0.5px"
          }}>
            StudyReuse
          </h1>
          <p style={{ 
            margin: "10px 0 0 0", 
            opacity: 0.9,
            fontSize: "15px"
          }}>
            Join our community of students
          </p>
        </div>

        <div style={{ padding: "40px 30px" }}>
          <h2 style={{ 
            textAlign: "center", 
            marginBottom: "30px", 
            color: "#333",
            fontSize: "24px",
            fontWeight: "600"
          }}>
            Create Account
          </h2>
          
          {error && (
            <div style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "25px",
              border: "1px solid #ffcdd2",
              fontSize: "14px"
            }}>
              {error}
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
                name="name"
                type="text"
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
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
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
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
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
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
            </div>
            
            <div style={{ marginBottom: "30px" }}>
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
                  placeholder="Create a password"
                  value={formData.password}
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
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
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
                    fontSize: "20px",
                    padding: "0",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <p style={{ 
                marginTop: "8px", 
                fontSize: "12px", 
                color: "#888",
                marginBottom: "0"
              }}>
                Use at least 6 characters
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                background: loading 
                  ? "#ccc" 
                  : "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                letterSpacing: "0.5px",
                marginBottom: "25px",
                boxShadow: "0 4px 15px rgba(106, 17, 203, 0.3)"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(106, 17, 203, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(106, 17, 203, 0.3)";
                }
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            
            <div style={{ 
              textAlign: "center", 
              paddingTop: "20px",
              borderTop: "1px solid #eee"
            }}>
              <p style={{ color: "#666", marginBottom: "8px" }}>
                Already have an account?
              </p>
              <Link 
                to="/login" 
                style={{ 
                  color: "#6a11cb", 
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "15px",
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
                <span style={{ fontSize: "18px" }}>→</span>
              </Link>
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
          <p style={{ 
            margin: 0, 
            color: "#888", 
            fontSize: "13px",
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
    </div>
  );
};

export default Register;