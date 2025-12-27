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
      
      console.log("📨 Fetching notifications from API...");
      const res = await API.get("/notifications");
      console.log("✅ API Response received:", res);
      
      // SAFELY handle response - backend returns empty array []
      const data = res.data || [];
      
      // Make sure it's an array
      if (Array.isArray(data)) {
        console.log(`📊 Setting ${data.length} notifications`);
        setNotifications(data);
      } else {
        console.warn("⚠️ Unexpected response format, using empty array");
        setNotifications([]);
      }
      
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications");
      setNotifications([]); // Set empty array on error
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
        await API.put(`/notifications/${id}`);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  useEffect(() => {
    console.log("🔧 Notifications component mounted");
    fetchNotifications();
  }, []);

  // ======================
  // RENDER LOGIC
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
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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

  // 3. Empty State (Most important - this is what's happening)
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
          When you receive messages, item approvals, or other updates, 
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
        </div>
      </div>
    );
  }

  // 4. Has Notifications State
  return (
    <div className="container" style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
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
      </div>
      
      <div style={{
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {notifications.map((notification, index) => {
          // SAFELY access all properties with fallbacks
          const id = notification?._id || `notification-${index}`;
          const message = notification?.message || "Notification";
          const isRead = notification?.isRead || false;
          const type = notification?.type || "system";
          const createdAt = notification?.createdAt || new Date().toISOString();
          
          return (
            <div 
              key={id}
              style={{
                padding: "20px",
                borderBottom: index < notifications.length - 1 ? "1px solid #e9ecef" : "none",
                background: isRead ? "white" : "#f0f9ff",
                display: "flex",
                alignItems: "center",
                gap: "15px"
              }}
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
                {type === 'message' && '✉️'}
                {type === 'system' && '📢'}
                {type === 'item_approved' && '✅'}
                {!['message', 'system', 'item_approved'].includes(type) && '🔔'}
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 8px 0", color: "#495057" }}>
                  {message}
                </p>
                <small style={{ color: "#6c757d" }}>
                  {new Date(createdAt).toLocaleString()}
                </small>
              </div>
              
              {!isRead && (
                <button
                  onClick={() => markRead(id)}
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