import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const res = await API.get("/notifications");
      if (res.data && Array.isArray(res.data)) {
        const unread = res.data.filter(n => !n.isRead).length;
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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 2px 20px rgba(0, 0, 0, 0.08)",
    padding: "12px 0",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)"
  };

  const containerStyle = {
    maxWidth: "1300px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px"
  };

  const brandStyle = {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    transition: "transform 0.3s ease"
  };

  const logoStyle = {
    height: "70px",
    marginRight: "12px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(67, 97, 238, 0.15)"
  };

  const brandTextStyle = {
    background: "linear-gradient(135deg, #4361ee, #7209b7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontSize: "1.8rem",
    fontWeight: "800",
    letterSpacing: "-0.5px"
  };

  const navLinksStyle = {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  };

  const navLinkBaseStyle = {
    textDecoration: "none",
    color: "#495057",
    fontWeight: "500",
    padding: "10px 0",
    position: "relative",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "15px"
  };

  const activeNavLinkStyle = {
    color: "#4361ee",
    fontWeight: "600"
  };

  const navLinkHoverStyle = {
    color: "#4361ee"
  };

  const activeIndicatorStyle = {
    position: "absolute",
    bottom: "0",
    left: "0",
    width: "100%",
    height: "3px",
    background: "linear-gradient(90deg, #4361ee, #7209b7)",
    borderRadius: "3px 3px 0 0"
  };

  const registerButtonStyle = {
    textDecoration: "none",
    padding: "10px 24px",
    background: "linear-gradient(135deg, #4361ee, #7209b7)",
    color: "white",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "15px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(67, 97, 238, 0.2)"
  };

  const userButtonStyle = {
    background: "none",
    border: "2px solid #e0e0e0",
    borderRadius: "50px",
    padding: "8px 20px 8px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "white"
  };

  const userAvatarStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4361ee, #7209b7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
    boxShadow: "0 4px 8px rgba(67, 97, 238, 0.2)"
  };

  const dropdownStyle = {
    position: "absolute",
    top: "100%",
    right: "0",
    background: "white",
    boxShadow: "0 15px 50px rgba(0, 0, 0, 0.15)",
    borderRadius: "16px",
    padding: "12px 0",
    minWidth: "220px",
    marginTop: "15px",
    zIndex: 1001,
    border: "1px solid rgba(0, 0, 0, 0.05)",
    animation: "slideDown 0.2s ease-out"
  };

  const dropdownHeaderStyle = {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)"
  };

  const dropdownItemStyle = {
    padding: "14px 20px",
    textDecoration: "none",
    color: "#212529",
    transition: "all 0.2s ease",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  };

  const dropdownItemHoverStyle = {
    backgroundColor: "#f8f9fa"
  };

  const notificationBadgeStyle = {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "linear-gradient(135deg, #ff6b6b, #e63946)",
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
    boxShadow: "0 3px 8px rgba(230, 57, 70, 0.3)",
    border: "2px solid white"
  };

  return (
    <>
      <nav style={navStyle}>
        <div style={containerStyle}>
          {/* Logo/Brand */}
          <Link 
            to="/" 
            style={brandStyle}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <img 
              src="/logo.png"
              alt="StudyReuse Logo"
              style={logoStyle}
              onError={(e) => {
                e.target.style.display = 'none';
                const existingEmoji = e.target.parentNode.querySelector('.logo-fallback');
                if (!existingEmoji) {
                  e.target.parentNode.insertAdjacentHTML('beforeend', 
                    '<span class="logo-fallback" style="font-size: 32px; margin-right: 12px">📚</span>');
                }
              }}
            />
            <span style={brandTextStyle}>
              StudyReuse
            </span>
          </Link>

          {/* Navigation Links */}
          <div style={navLinksStyle}>
            {user ? (
              <>
                {/* Home Link */}
                <Link 
                  to="/" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = navLinkHoverStyle.color}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/') ? activeNavLinkStyle.color : navLinkBaseStyle.color}
                >
                  🏠 Home
                  {isActive('/') && <span style={activeIndicatorStyle} />}
                </Link>

                {/* Dashboard Link */}
                <Link 
                  to="/dashboard" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/dashboard') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = navLinkHoverStyle.color}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/dashboard') ? activeNavLinkStyle.color : navLinkBaseStyle.color}
                >
                  📊 Dashboard
                  {isActive('/dashboard') && <span style={activeIndicatorStyle} />}
                </Link>

                {/* Add Item Link */}
                <Link 
                  to="/add-item" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/add-item') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = navLinkHoverStyle.color}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/add-item') ? activeNavLinkStyle.color : navLinkBaseStyle.color}
                >
                  ➕ Add Item
                  {isActive('/add-item') && <span style={activeIndicatorStyle} />}
                </Link>

                {/* Barter Link */}
                <Link 
                  to="/barter" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/barter') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = navLinkHoverStyle.color}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/barter') ? activeNavLinkStyle.color : navLinkBaseStyle.color}
                >
                  🔄 Barter
                  {isActive('/barter') && <span style={activeIndicatorStyle} />}
                </Link>

                {/* Notifications */}
                <div style={{ position: "relative" }}>
                  <Link 
                    to="/notifications" 
                    style={{
                      ...navLinkBaseStyle,
                      ...(isActive('/notifications') ? activeNavLinkStyle : {})
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = navLinkHoverStyle.color}
                    onMouseLeave={(e) => e.currentTarget.style.color = isActive('/notifications') ? activeNavLinkStyle.color : navLinkBaseStyle.color}
                  >
                    🔔 Notifications
                    {isActive('/notifications') && <span style={activeIndicatorStyle} />}
                  </Link>
                  {unreadCount > 0 && (
                    <span style={notificationBadgeStyle}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                {/* User Dropdown */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={userButtonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#4361ee";
                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(67, 97, 238, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e0e0e0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={userAvatarStyle}>
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span style={{ color: "#212529" }}>
                      {user.name ? user.name.split(" ")[0] : "User"}
                    </span>
                    <span style={{ 
                      color: "#6c757d", 
                      fontSize: "10px",
                      transition: "transform 0.3s ease",
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                    }}>
                      ▼
                    </span>
                  </button>
                  
                  {dropdownOpen && (
                    <div style={dropdownStyle}>
                      <div style={dropdownHeaderStyle}>
                        <p style={{ 
                          fontWeight: "700", 
                          marginBottom: "4px", 
                          color: "#212529",
                          fontSize: "15px"
                        }}>
                          {user.name}
                        </p>
                        <p style={{ 
                          fontSize: "12px", 
                          color: "#6c757d",
                          opacity: 0.8
                        }}>
                          {user.email}
                        </p>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span style={{ fontSize: "16px" }}>👤</span> My Profile
                      </Link>
                      
                      <Link 
                        to="/my-items" 
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span style={{ fontSize: "16px" }}>📦</span> My Items
                      </Link>
                      
                      {user.role === "admin" && (
                        <Link 
                          to="/admin"
                          style={dropdownItemStyle}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <span style={{ fontSize: "16px" }}>👑</span> Admin Panel
                        </Link>
                      )}
                      
                      <div style={{ 
                        padding: "12px 20px 8px", 
                        borderTop: "1px solid rgba(0, 0, 0, 0.05)",
                        marginTop: "8px"
                      }}>
                        <button 
                          onClick={handleLogout}
                          style={{ 
                            width: "100%", 
                            padding: "12px",
                            background: "linear-gradient(135deg, #ffeaea, #fff0f0)", 
                            border: "1px solid #ffcdd2", 
                            cursor: "pointer",
                            color: "#e63946",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            transition: "all 0.3s ease",
                            borderRadius: "8px",
                            fontSize: "14px"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e63946";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(230, 57, 70, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "linear-gradient(135deg, #ffeaea, #fff0f0)";
                            e.currentTarget.style.color = "#e63946";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>🚪</span> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Guest Navigation */}
                <Link 
                  to="/" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = navLinkHoverStyle.color}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/') ? activeNavLinkStyle.color : navLinkBaseStyle.color}
                >
                  🏠 Home
                  {isActive('/') && <span style={activeIndicatorStyle} />}
                </Link>

                <Link 
                  to="/login" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/login') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = navLinkHoverStyle.color}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/login') ? activeNavLinkStyle.color : navLinkBaseStyle.color}
                >
                  🔑 Login
                  {isActive('/login') && <span style={activeIndicatorStyle} />}
                </Link>

                <Link 
                  to="/register"
                  style={registerButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(67, 97, 238, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(67, 97, 238, 0.2)";
                  }}
                >
                  📝 Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Add CSS animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 1024px) {
          .navbar-links {
            gap: 15px;
          }
          
          .nav-link {
            font-size: 14px;
          }
        }
        
        @media (max-width: 768px) {
          .navbar-container {
            flex-direction: column;
            gap: 20px;
          }
          
          .navbar-links {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;