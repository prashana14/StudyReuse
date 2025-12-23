import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const res = await API.get("/notifications");
      // Ensure we have an array and count only unread notifications
      if (res.data && Array.isArray(res.data)) {
        const unread = res.data.filter(n => n.isRead === false).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span style={{ fontSize: "28px", marginRight: "10px" }}>📚</span>
          <span style={{ 
            background: "linear-gradient(135deg, #4361ee, #7209b7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            StudyReuse
          </span>
        </Link>

        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Home
              </Link>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/add-item" className={`nav-link ${isActive('/add-item')}`}>
                Add Item
              </Link>
              <Link to="/barter" className={`nav-link ${isActive('/barter')}`}>
                Barter
              </Link>
              
              {/* Notifications with badge */}
              <div style={{ position: "relative" }}>
                <Link 
                  to="/notifications" 
                  className={`nav-link ${isActive('/notifications')}`}
                  style={{ display: "flex", alignItems: "center", padding: "8px 12px" }}
                >
                  <span style={{ fontSize: "20px", position: "relative" }}>
                    🔔
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-12px",
                        background: "linear-gradient(135deg, #ff6b6b, #e63946)",
                        color: "white",
                        borderRadius: "50%",
                        padding: "3px 8px",
                        fontSize: "11px",
                        minWidth: "18px",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                      }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              </div>

              {/* User dropdown */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ 
                    background: "none",
                    border: "2px solid #e0e0e0",
                    borderRadius: "50px",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = "#4361ee"}
                  onMouseLeave={(e) => e.target.style.borderColor = "#e0e0e0"}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4361ee, #7209b7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold"
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span style={{ color: "#212529" }}>
                    {user.name ? user.name.split(" ")[0] : "User"}
                  </span>
                  <span style={{ color: "#6c757d" }}>▼</span>
                </button>
                
                {dropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: "0",
                    background: "white",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                    borderRadius: "12px",
                    padding: "10px 0",
                    minWidth: "180px",
                    marginTop: "10px",
                    zIndex: 1000,
                    border: "1px solid #e0e0e0"
                  }}>
                    <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0" }}>
                      <p style={{ fontWeight: "600", marginBottom: "4px", color: "#212529" }}>
                        {user.name}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6c757d" }}>
                        {user.email}
                      </p>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      style={{ 
                        display: "block", 
                        padding: "12px 20px", 
                        textDecoration: "none", 
                        color: "#212529",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#f8f9fa"}
                      onClick={() => setDropdownOpen(false)}
                    >
                      👤 My Profile
                    </Link>
                    
                    <Link 
                      to="/my-items" 
                      style={{ 
                        display: "block", 
                        padding: "12px 20px", 
                        textDecoration: "none", 
                        color: "#212529",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#f8f9fa"}
                      onClick={() => setDropdownOpen(false)}
                    >
                      📦 My Items
                    </Link>
                    
                    <div style={{ padding: "8px 20px", borderTop: "1px solid #f0f0f0", marginTop: "8px" }}>
                      <button 
                        onClick={handleLogout}
                        style={{ 
                          width: "100%", 
                          textAlign: "left", 
                          padding: "10px",
                          background: "none", 
                          border: "none", 
                          cursor: "pointer",
                          color: "#e63946",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.3s",
                          borderRadius: "6px"
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#ffebee"}
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Home
              </Link>
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "10px 24px" }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;