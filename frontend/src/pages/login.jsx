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

    console.log("Login attempt with:", { email, password });

    try {
      // IMPORTANT: Check what endpoint we're calling
      console.log("Calling API endpoint: /users/login");
      
      const res = await API.post("/users/login", { email, password });
      console.log("Login response:", res.data);
      
      if (res.data.token && res.data.user) {
        login(res.data);
        console.log("Login successful, redirecting to dashboard");
        navigate("/dashboard");
      } else {
        setError("Login response missing token or user data");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
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
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
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
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                padding: "0",
                color: "#666"
              }}
            >
              {showPassword ? "🙈" : "👁️"}
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