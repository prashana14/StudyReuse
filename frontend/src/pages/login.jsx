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

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  // ✅ ADD CLIENT-SIDE VALIDATION
  if (!email || !password) {
    setError("Email and password are required");
    setLoading(false);
    return;
  }
  
  if (!/\S+@\S+\.\S+/.test(email)) {
    setError("Please enter a valid email address");
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
      // IMPORTANT: Make sure this is the correct endpoint
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
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Login</h2>
      
      {error && (
        <div style={{
          color: "#d32f2f",
          backgroundColor: "#ffebee",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "1px solid #ffcdd2"
        }}>
          {error}
        </div>
      )}
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
              boxSizing: "border-box"
            }}
          />
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
                boxSizing: "border-box"
              }}
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
            {/* Eye icon from your photo - simplified design */}
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
                /* When password is visible - show eye closed or crossed */
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </>
              ) : (
                /* When password is hidden - show simple eye */
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
            backgroundColor: loading ? "#ccc" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.3s"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ color: "#666" }}>
            Don't have an account?{" "}
            <a 
              href="/register" 
              style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}
            >
              Register here
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;