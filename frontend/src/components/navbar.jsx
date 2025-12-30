import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);

  // Fetch notifications for badge
  const fetchNotifications = async () => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    
    try {
      const res = await API.get("/notifications");
      let notificationsArray = [];
      
      if (Array.isArray(res.data)) {
        notificationsArray = res.data;
      } else if (res.data && Array.isArray(res.data.notifications)) {
        notificationsArray = res.data.notifications;
      } else if (res.data && res.data.data && Array.isArray(res.data.data.notifications)) {
        notificationsArray = res.data.data.notifications;
      }
      
      const unread = notificationsArray.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      setNotifications(notificationsArray.slice(0, 5));
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setUnreadCount(0);
      setNotifications([]);
    }
  };

  // Search items function
  const searchItems = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await API.get(`/items/search?q=${encodeURIComponent(query)}`);
      
      if (res.data && Array.isArray(res.data)) {
        setSearchResults(res.data.slice(0, 6));
        setShowSearchResults(true);
      } else if (res.data && Array.isArray(res.data.items)) {
        setSearchResults(res.data.items.slice(0, 6));
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching items:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchItems(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  const handleSearchItemClick = (itemId) => {
    navigate(`/item/${itemId}`);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'barter': return '🔄';
      case 'message': return '✉️';
      case 'item_approved': return '✅';
      case 'item_rejected': return '❌';
      case 'system': return '📢';
      default: return '🔔';
    }
  };

  const markAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read/all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setNotificationsOpen(false);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Don't show navbar on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  // STYLES
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
    padding: "0 20px",
    gap: "20px"
  };

  const brandStyle = {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    transition: "transform 0.3s ease",
    flexShrink: 0
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
    gap: "20px",
    flex: 1,
    justifyContent: "flex-end"
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
    fontSize: "15px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  };

  const activeNavLinkStyle = {
    color: "#4361ee",
    fontWeight: "600"
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

  // Search Bar Styles
  const searchContainerStyle = {
    position: "relative",
    flex: 1,
    maxWidth: "500px",
    margin: "0 20px"
  };

  const searchFormStyle = {
    position: "relative",
    width: "100%"
  };

  const searchInputStyle = {
    width: "100%",
    padding: "12px 48px 12px 20px",
    borderRadius: "25px",
    border: "2px solid #e0e0e0",
    fontSize: "15px",
    background: "#f8f9fa",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box"
  };

  const searchButtonStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#4361ee",
    cursor: "pointer",
    fontSize: "18px",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const searchResultsStyle = {
    position: "absolute",
    top: "100%",
    left: "0",
    right: "0",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 15px 50px rgba(0, 0, 0, 0.15)",
    marginTop: "8px",
    maxHeight: "400px",
    overflowY: "auto",
    zIndex: 1001,
    border: "1px solid rgba(0, 0, 0, 0.05)"
  };

  const searchResultItemStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  };

  const noResultsStyle = {
    padding: "20px",
    textAlign: "center",
    color: "#6c757d"
  };

  const searchLoadingStyle = {
    padding: "20px",
    textAlign: "center"
  };

  const itemImageStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    objectFit: "cover",
    background: "#f8f9fa"
  };

  const itemInfoStyle = {
    flex: 1
  };

  const itemTitleStyle = {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: "500",
    color: "#212529"
  };

  const itemPriceStyle = {
    margin: "0",
    fontSize: "13px",
    color: "#4361ee",
    fontWeight: "600"
  };

  const viewAllResultsStyle = {
    padding: "12px 16px",
    textAlign: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    background: "#f8f9fa"
  };

  const viewAllLinkStyle = {
    color: "#4361ee",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500"
  };

  // Notifications Dropdown Styles
  const notificationsDropdownStyle = {
    position: "absolute",
    top: "100%",
    right: "0",
    background: "white",
    boxShadow: "0 15px 50px rgba(0, 0, 0, 0.15)",
    borderRadius: "16px",
    width: "380px",
    marginTop: "15px",
    zIndex: 1001,
    border: "1px solid rgba(0, 0, 0, 0.05)",
    animation: "slideDown 0.2s ease-out",
    overflow: "hidden"
  };

  const notificationsHeaderStyle = {
    padding: "20px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const notificationsTitleStyle = {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#212529"
  };

  const markAllButtonStyle = {
    background: "transparent",
    border: "none",
    color: "#4361ee",
    fontSize: "13px",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "500",
    transition: "all 0.2s ease"
  };

  const notificationsListStyle = {
    maxHeight: "320px",
    overflowY: "auto"
  };

  const notificationItemStyle = {
    padding: "16px 20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    cursor: "pointer",
    borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
    transition: "all 0.2s ease"
  };

  const notificationIconStyle = {
    fontSize: "20px",
    minWidth: "24px",
    marginTop: "2px"
  };

  const notificationContentStyle = {
    flex: 1
  };

  const notificationMessageStyle = {
    margin: "0 0 6px 0",
    fontSize: "14px",
    color: "#333",
    lineHeight: 1.4
  };

  const notificationTimeStyle = {
    color: "#888",
    fontSize: "12px"
  };

  const markReadButtonStyle = {
    background: "transparent",
    border: "none",
    color: "#4361ee",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    opacity: 0.7,
    transition: "all 0.2s ease"
  };

  const noNotificationsStyle = {
    padding: "40px 20px",
    textAlign: "center"
  };

  const notificationsFooterStyle = {
    padding: "16px 20px",
    borderTop: "1px solid rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    background: "#f8f9fa"
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

  // Existing styles
  const registerButtonStyle = {
    textDecoration: "none",
    padding: "10px 24px",
    background: "linear-gradient(135deg, #4361ee, #7209b7)",
    color: "white",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "15px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(67, 97, 238, 0.2)",
    whiteSpace: "nowrap"
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
    backgroundColor: "white",
    whiteSpace: "nowrap"
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

          {/* Search Bar - Center Position */}
          <div style={searchContainerStyle} ref={searchRef}>
            <form onSubmit={handleSearchSubmit} style={searchFormStyle}>
              <input
                type="text"
                placeholder="Search books, electronics, furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                style={searchInputStyle}
                onMouseEnter={(e) => e.target.style.borderColor = "#4361ee"}
                onMouseLeave={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
              <button type="submit" style={searchButtonStyle}>
                🔍
              </button>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery.trim() && (
              <div style={searchResultsStyle}>
                {isSearching ? (
                  <div style={searchLoadingStyle}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      border: "3px solid #f3f3f3",
                      borderTop: "3px solid #4361ee",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto"
                    }}></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((item) => (
                      <div
                        key={item._id}
                        style={searchResultItemStyle}
                        onClick={() => handleSearchItemClick(item._id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                      >
                        <img 
                          src={item.imageURL || "/placeholder-item.jpg"} 
                          alt={item.title}
                          style={itemImageStyle}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder-item.jpg";
                          }}
                        />
                        <div style={itemInfoStyle}>
                          <h4 style={itemTitleStyle}>{item.title}</h4>
                          <p style={itemPriceStyle}>₹{item.price || "Free"}</p>
                        </div>
                      </div>
                    ))}
                    <div style={viewAllResultsStyle}>
                      <Link 
                        to={`/search?q=${encodeURIComponent(searchQuery)}`}
                        style={viewAllLinkStyle}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery("");
                        }}
                      >
                        View all results →
                      </Link>
                    </div>
                  </>
                ) : (
                  <div style={noResultsStyle}>
                    <p>No items found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div style={navLinksStyle}>
            {user ? (
              <>
                {/* Dashboard Link */}
                <Link 
                  to="/dashboard" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/dashboard') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#4361ee"}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/dashboard') ? "#4361ee" : "#495057"}
                >
                  Dashboard
                  {isActive('/dashboard') && <span style={activeIndicatorStyle} />}
                </Link>

                {/* Add Item Link */}
                <Link 
                  to="/add-item" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/add-item') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#4361ee"}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/add-item') ? "#4361ee" : "#495057"}
                >
                  Add Item
                  {isActive('/add-item') && <span style={activeIndicatorStyle} />}
                </Link>

                {/* Barter Link */}
                <Link 
                  to="/barter" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/barter') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#4361ee"}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/barter') ? "#4361ee" : "#495057"}
                >
                  Barter
                  {isActive('/barter') && <span style={activeIndicatorStyle} />}
                </Link>

                {/* Notifications Dropdown */}
                <div ref={notificationsRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    style={{
                      ...navLinkBaseStyle,
                      ...(isActive('/notifications') ? activeNavLinkStyle : {}),
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 0"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#4361ee"}
                    onMouseLeave={(e) => e.currentTarget.style.color = isActive('/notifications') ? "#4361ee" : "#495057"}
                  >
                    🔔 Notifications
                    {isActive('/notifications') && <span style={activeIndicatorStyle} />}
                  </button>
                  
                  {unreadCount > 0 && (
                    <span style={notificationBadgeStyle}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  
                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div style={notificationsDropdownStyle}>
                      <div style={notificationsHeaderStyle}>
                        <h4 style={notificationsTitleStyle}>Notifications</h4>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            style={markAllButtonStyle}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f0f5ff"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      
                      <div style={notificationsListStyle}>
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              style={{
                                ...notificationItemStyle,
                                background: notification.isRead ? '#fff' : '#f8fbff'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#f0f5ff"}
                              onMouseLeave={(e) => e.currentTarget.style.background = notification.isRead ? '#fff' : '#f8fbff'}
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate('/notifications');
                              }}
                            >
                              <div style={notificationIconStyle}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div style={notificationContentStyle}>
                                <p style={notificationMessageStyle}>
                                  {notification.message || "New notification"}
                                </p>
                                <small style={notificationTimeStyle}>
                                  {new Date(notification.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </small>
                              </div>
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => markAsRead(notification._id, e)}
                                  style={markReadButtonStyle}
                                  title="Mark as read"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#f0f5ff";
                                    e.currentTarget.style.opacity = "1";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.opacity = "0.7";
                                  }}
                                >
                                  •
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div style={noNotificationsStyle}>
                            <p style={{ color: "#888", margin: 0 }}>No notifications yet</p>
                          </div>
                        )}
                      </div>
                      
                      <div style={notificationsFooterStyle}>
                        <Link 
                          to="/notifications" 
                          style={viewAllLinkStyle}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
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
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span style={{ fontSize: "16px" }}>👤</span> My Profile
                      </Link>
                      
                      <Link 
                        to="/my-items" 
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span style={{ fontSize: "16px" }}>📦</span> My Items
                      </Link>
                      
                      {user.role === "admin" && (
                        <Link 
                          to="/admin"
                          style={dropdownItemStyle}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <span style={{ fontSize: "16px" }}>⚙️</span> Admin Panel
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
                  onMouseEnter={(e) => e.currentTarget.style.color = "#4361ee"}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/') ? "#4361ee" : "#495057"}
                >
                  Home
                  {isActive('/') && <span style={activeIndicatorStyle} />}
                </Link>

                <Link 
                  to="/login" 
                  style={{
                    ...navLinkBaseStyle,
                    ...(isActive('/login') ? activeNavLinkStyle : {})
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#4361ee"}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive('/login') ? "#4361ee" : "#495057"}
                >
                  Login
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
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Add CSS animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
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
          .container {
            flex-wrap: wrap;
            gap: 15px;
          }
          
          .search-container {
            order: 3;
            max-width: 100%;
            margin: 10px 0 0 0;
          }
          
          .nav-links {
            order: 2;
          }
          
          .brand {
            order: 1;
          }
        }
        
        @media (max-width: 768px) {
          .nav-links {
            gap: 12px;
          }
          
          .nav-link {
            font-size: 14px;
          }
          
          .search-input {
            font-size: 14px;
            padding: 10px 40px 10px 15px;
          }
          
          .notifications-dropdown {
            width: 320px;
            right: -50%;
          }
        }
        
        @media (max-width: 480px) {
          .notifications-dropdown {
            width: 280px;
            right: -100%;
          }
          
          .search-results {
            position: fixed;
            top: 70px;
            left: 10px;
            right: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;