import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useNotification } from "../context/NotificationContext"; // ADD THIS IMPORT
import { AuthContext } from "../context/AuthContext"; // Add if needed

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // USE THE NOTIFICATION CONTEXT
  const { handleNotificationClick, getActionLabel } = useNotification();
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📨 Fetching notifications...");
      const res = await API.get("/notifications");
      console.log("✅ API Response:", res.data);
      
      // ✅ Handle all possible response formats
      let notificationsArray = [];
      
      if (Array.isArray(res.data)) {
        notificationsArray = res.data;
      } else if (res.data && Array.isArray(res.data.notifications)) {
        notificationsArray = res.data.notifications;
      } else if (res.data && res.data.data && Array.isArray(res.data.data.notifications)) {
        notificationsArray = res.data.data.notifications;
      } else if (res.data && Array.isArray(res.data.data)) {
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

  // ======================
  // CLICKABLE NOTIFICATION HANDLING - USE CONTEXT
  // ======================
  const handleClick = async (notification) => {
    try {
      console.log("🖱️ Notification clicked:", {
        id: notification._id,
        type: notification.type,
        action: notification.action,
        relatedItem: notification.relatedItem,
        relatedOrder: notification.relatedOrder,
        link: notification.link,
        title: notification.title
      });
      
      // Use the context handler which has the proper navigation logic
      handleNotificationClick(notification);
      
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  const markRead = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    
    try {
      console.log(`📝 Marking notification ${id} as read`);
      
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
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Debug: Log notification data when it changes
  useEffect(() => {
    if (notifications.length > 0) {
      console.log("📊 All notifications data:", notifications.map(n => ({
        id: n._id,
        type: n.type,
        action: n.action,
        relatedItem: n.relatedItem,
        link: n.link,
        title: n.title,
        message: n.message
      })));
    }
  }, [notifications]);

  // ======================
  // HELPER FUNCTIONS
  // ======================
  const getIcon = (type) => {
    switch(type) {
      case 'barter': return '🔄';
      case 'message': return '💬';
      case 'item_approved': return '✅';
      case 'item_rejected': return '❌';
      case 'new_order': return '🛒';
      case 'system': return '⚙️';
      case 'user_blocked': return '🚫';
      case 'user_verified': return '✅';
      case 'trade': return '🤝';
      case 'new_user': return '👤';
      case 'new_item': return '📦';
      case 'item_flag': return '🚩';
      case 'admin_alert': return '📢';
      case 'order_updated': return '🔄';
      case 'order_cancelled': return '❌';
      default: return '🔔';
    }
  };

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
          const actionLabel = getActionLabel(notification); // Use context function
          const icon = getIcon(type);
          
          return (
            <div 
              key={id}
              onClick={() => handleClick(notification)} // Use the wrapper function
              style={{
                padding: "20px",
                borderBottom: index < notifications.length - 1 ? "1px solid #e9ecef" : "none",
                background: isRead ? "white" : "#f0f9ff",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = isRead ? "#f8f9fa" : "#e3f2fd"}
              onMouseLeave={(e) => e.currentTarget.style.background = isRead ? "white" : "#f0f9ff"}
            >
              {/* Unread indicator */}
              {!isRead && (
                <div style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#4361ee",
                  borderRadius: "50%"
                }}></div>
              )}
              
              {/* Debug info (visible in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  fontSize: "10px",
                  color: "#666",
                  background: "#f0f0f0",
                  padding: "2px 5px",
                  borderRadius: "3px",
                  display: "flex",
                  gap: "3px"
                }}>
                  {notification.relatedItem && <span title="Has Item">📦</span>}
                  {notification.link && <span title={`Link: ${notification.link}`}>🔗</span>}
                  <span title={`Type: ${type}`}>📝</span>
                </div>
              )}
              
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: isRead ? "#e9ecef" : "#4361ee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isRead ? "#6c757d" : "white",
                fontSize: "18px",
                marginLeft: isRead ? "0" : "10px"
              }}>
                {icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h4 style={{ margin: "0 0 5px 0", color: "#212529", fontSize: "16px" }}>
                    {title}
                  </h4>
                  <span style={{
                    fontSize: "12px",
                    color: "#6c757d",
                    whiteSpace: "nowrap"
                  }}>
                    {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ margin: "0 0 8px 0", color: "#495057", fontSize: "14px" }}>
                  {message}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <small style={{ 
                    color: "#6c757d",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}>
                    {type.replace('_', ' ').toUpperCase()}
                    {notification.relatedItem && (
                      <span style={{
                        background: "#e9ecef",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10px"
                      }}>
                        ITEM
                      </span>
                    )}
                    {notification.relatedOrder && (
                      <span style={{
                        background: "#e9ecef",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10px"
                      }}>
                        ORDER
                      </span>
                    )}
                  </small>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick(notification);
                    }}
                    style={{
                      padding: "4px 12px",
                      background: "transparent",
                      border: "1px solid #4361ee",
                      color: "#4361ee",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {actionLabel}
                    <span>→</span>
                  </button>
                </div>
              </div>
              
              {!isRead && (
                <button
                  onClick={(e) => markRead(id, e)}
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