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

  // Function to validate RIA email domain
  const validateRIADomain = (email) => {
    // Check if email ends with @ria.edu.np or .ria.edu.np
    // Examples allowed:
    // - prashanashrestha12.ria.edu.np
    // - john.doe@ria.edu.np
    // - student.ria.edu.np
    const domainRegex = /(^[a-zA-Z0-9._-]+\.ria\.edu\.np$)|(^[a-zA-Z0-9._-]+@ria\.edu\.np$)/;
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
    if (!/\S+@\S+\.\S+/.test(email) && !email.includes(".ria.edu.np")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    
    // ✅ Validate RIA domain - THIS IS THE NEW VALIDATION
    if (!validateRIADomain(email)) {
      setError("Only @ria.edu.np or .ria.edu.np email addresses are allowed");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    console.log("Login attempt with:", { email, password });

    try {
      console.log("Calling API endpoint: /users/login");
      
      const res = await API.post("/users/login", { email, password });
      console.log("Login response:", res.data);
      
      if (res.data.token && res.data.user) {
        // Save to localStorage FIRST
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        console.log("Saved to localStorage:", {
          token: res.data.token,
          user: res.data.user
        });
        
        // Then update AuthContext
        login(res.data);
        
        console.log("Login successful, redirecting to dashboard");
        navigate("/dashboard");
      } else {
        setError("Login response missing token or user data");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response data:", err.response?.data);
      
      if (err.response?.status === 400) {
        if (err.response?.data?.message === "Invalid credentials") {
          setError("Invalid email or password. Please check your credentials.");
        } else if (err.response?.data?.message === "User not found") {
          setError("No account found with this email. Please register first.");
        } else {
          setError(err.response?.data?.message || "Invalid credentials");
        }
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server. Please check if backend is running on port 4000.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "400px",
      margin: "50px auto",
      padding: "30px",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(26, 26, 27, 0)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Login to StudyReuse</h2>
      
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img 
          src="/logo.png" 
          alt="StudyReuse Logo"
          style={{ 
            height: "150px",
            marginBottom: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}
        />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "16px",
              boxSizing: "border-box",
              transition: "all 0.3s"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#1890ff";
              e.target.style.boxShadow = "0 0 0 2px rgba(24, 144, 255, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ccc";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={{ 
            fontSize: "12px", 
            color: "#666", 
            marginTop: "4px",
            display: "flex",
            alignItems: "center"
          }}>
          </div>
        </div>
        
        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 45px 12px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
                transition: "all 0.3s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1890ff";
                e.target.style.boxShadow = "0 0 0 2px rgba(24, 144, 255, 0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#ccc";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
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
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: loading ? "#ccc" : "#1890ff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = "#096dd9";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = "#1890ff";
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
              Logging in...
            </>
          ) : (
            <>
            Login
            </>
          )}
        </button>
        
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ color: "#666" }}>
            Don't have an account?{" "}
            <a 
              href="/register" 
              style={{ color: "#1890ff", textDecoration: "none", fontWeight: "500" }}
              onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.target.style.textDecoration = "none"}
            >
              Register here
            </a>
          </p>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;