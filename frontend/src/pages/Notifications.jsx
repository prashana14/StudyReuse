import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📨 Fetching notifications...");
      const res = await API.get("/notifications");
      console.log("✅ API Response:", res.data);
      
      // ✅ FIXED: Handle all possible response formats
      let notificationsArray = [];
      
      if (Array.isArray(res.data)) {
        // Format 1: Direct array (after fixing notificationController.js)
        notificationsArray = res.data;
      } else if (res.data && Array.isArray(res.data.notifications)) {
        // Format 2: Nested notifications array
        notificationsArray = res.data.notifications;
      } else if (res.data && res.data.data && Array.isArray(res.data.data.notifications)) {
        // Format 3: Deep nested
        notificationsArray = res.data.data.notifications;
      } else if (res.data && Array.isArray(res.data.data)) {
        // Format 4: Array in data field
        notificationsArray = res.data.data;
      }
      
      console.log(`📊 Setting ${notificationsArray.length} notifications`);
      setNotifications(notificationsArray);
      
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    if (!id) return;
    
    try {
      console.log(`📝 Marking notification ${id} as read`);
      
      // Try different endpoint formats
      try {
        await API.put(`/notifications/${id}/read`);
      } catch {
        try {
          await API.put(`/notifications/${id}`);
        } catch {
          await API.patch(`/notifications/${id}`);
        }
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log("📝 Marking ALL notifications as read");
      await API.put("/notifications/read/all");
      
      // Update all notifications to read
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  useEffect(() => {
    console.log("🔧 Notifications component mounted");
    fetchNotifications();
    
    // Auto-refresh every 30 seconds (optional polling)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ======================
  // RENDER FUNCTIONS
  // ======================

  // 1. Loading State
  if (loading) {
    return (
      <div className="container" style={{ 
        maxWidth: "800px", 
        margin: "60px auto", 
        textAlign: "center",
        padding: "40px"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4361ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }}></div>
        <p style={{ marginTop: "20px", color: "#6c757d" }}>
          Loading notifications...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="container" style={{ 
        maxWidth: "800px", 
        margin: "60px auto",
        padding: "40px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
        <h2>Error Loading Notifications</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px" }}>{error}</p>
        <button
          onClick={fetchNotifications}
          style={{
            padding: "10px 20px",
            background: "#4361ee",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (!notifications || notifications.length === 0) {
    return (
      <div className="container" style={{ 
        maxWidth: "800px", 
        margin: "60px auto",
        padding: "40px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>🔔</div>
        <h1 style={{ marginBottom: "16px", color: "#212529" }}>No notifications yet</h1>
        <p style={{ 
          color: "#6c757d", 
          fontSize: "18px",
          lineHeight: 1.6,
          maxWidth: "500px",
          margin: "0 auto 40px"
        }}>
          When you receive messages, barter requests, or other updates, 
          they'll appear here.
        </p>
        
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/add-item">
            <button
              style={{
                padding: "12px 24px",
                background: "#4361ee",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              ➕ List an Item
            </button>
          </Link>
          
          <Link to="/dashboard">
            <button
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: "2px solid #4361ee",
                color: "#4361ee",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              📊 Browse Items
            </button>
          </Link>
          
          <button
            onClick={fetchNotifications}
            style={{
              padding: "12px 24px",
              background: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>
    );
  }

  // 4. Has Notifications State
  return (
    <div className="container" style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ margin: 0 }}>
          Notifications 
          <span style={{
            marginLeft: "10px",
            background: "#4361ee",
            color: "white",
            borderRadius: "50%",
            padding: "2px 8px",
            fontSize: "14px"
          }}>
            {notifications.filter(n => !n.isRead).length}
          </span>
        </h2>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchNotifications}
            style={{
              padding: "8px 16px",
              background: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            ↻ Refresh
          </button>
          
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: "8px 16px",
                background: "#4361ee",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>
      
      <div style={{
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {notifications.map((notification, index) => {
          const id = notification?._id || `notification-${index}`;
          const message = notification?.message || "Notification";
          const isRead = notification?.isRead || false;
          const type = notification?.type || "system";
          const title = notification?.title || "Notification";
          const createdAt = notification?.createdAt || new Date().toISOString();
          
          // Get icon based on type
          const getIcon = () => {
            switch(type) {
              case 'barter': return '';
              case 'message': return '';
              case 'item_approved': return '';
              case 'item_rejected': return '';
              case 'system': return '';
              default: return '';
            }
          };
          
          return (
            <div 
              key={id}
              style={{
                padding: "20px",
                borderBottom: index < notifications.length - 1 ? "1px solid #e9ecef" : "none",
                background: isRead ? "white" : "#f0f9ff",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = isRead ? "#f8f9fa" : "#e3f2fd"}
              onMouseLeave={(e) => e.currentTarget.style.background = isRead ? "white" : "#f0f9ff"}
              onClick={() => !isRead && markRead(id)}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: isRead ? "#e9ecef" : "#4361ee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isRead ? "#6c757d" : "white",
                fontSize: "18px"
              }}>
                {getIcon()}
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 5px 0", color: "#212529" }}>
                  {title}
                  {!isRead && <span style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    background: "#4361ee",
                    borderRadius: "50%",
                    marginLeft: "8px"
                  }}></span>}
                </h4>
                <p style={{ margin: "0 0 8px 0", color: "#495057" }}>
                  {message}
                </p>
                <small style={{ color: "#6c757d" }}>
                  {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
              
              {!isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead(id);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid #4361ee",
                    color: "#4361ee",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  Mark as read
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;