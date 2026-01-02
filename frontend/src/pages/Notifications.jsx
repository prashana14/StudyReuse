import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await API.get("/notifications");
      
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
      
      setNotifications(notificationsArray);
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification || !notification._id) return;
    
    const { _id, type, relatedItem, relatedUser, isRead, data, link } = notification;
    
    console.log("📢 Full notification details:", {
      type,
      relatedItem,
      relatedUser,
      data,
      link,
      notification
    });
    
    // Mark as read if unread
    if (!isRead) {
      await markRead(_id);
    }
    
    switch(type) {
      case 'item_approved':
      case 'item_rejected':
        if (relatedItem && relatedItem._id) {
          navigate(`/item/${relatedItem._id}`);
        } else if (relatedItem) {
          navigate(`/item/${relatedItem}`);
        } else {
          navigate('/my-items');
        }
        break;
        
      case 'message':
        console.log("🔍 Searching for itemId in notification:", {
          relatedItem,
          data,
          link
        });
        
        // Try multiple ways to find itemId
        let itemIdForChat = null;
        
        // 1. Check relatedItem field
        if (relatedItem && typeof relatedItem === 'object' && relatedItem._id) {
          itemIdForChat = relatedItem._id;
          console.log("✅ Found itemId in relatedItem:", itemIdForChat);
        } else if (relatedItem && typeof relatedItem === 'string') {
          itemIdForChat = relatedItem;
          console.log("✅ Found itemId as string in relatedItem:", itemIdForChat);
        }
        
        // 2. Check data field
        if (!itemIdForChat && data && data.itemId) {
          itemIdForChat = data.itemId;
          console.log("✅ Found itemId in data field:", itemIdForChat);
        }
        
        // 3. Check if link contains itemId
        if (!itemIdForChat && link && link.includes('/chat/item/')) {
          const match = link.match(/\/chat\/item\/([a-fA-F0-9]{24})/);
          if (match && match[1]) {
            itemIdForChat = match[1];
            console.log("✅ Extracted itemId from link:", itemIdForChat);
          }
        }
        
        // 4. If no itemId found, try to find from chats
        if (!itemIdForChat && relatedUser) {
          try {
            const response = await API.get('/chat/user/chats');
            if (response.data?.success && response.data.data) {
              const chats = response.data.data;
              const chatWithSender = chats.find(chat => 
                chat.otherParticipant?._id === (relatedUser._id || relatedUser) ||
                chat.otherParticipant === (relatedUser._id || relatedUser)
              );
              if (chatWithSender?.item?._id) {
                itemIdForChat = chatWithSender.item._id;
                console.log("✅ Found itemId from user chats:", itemIdForChat);
              }
            }
          } catch (chatErr) {
            console.log("Could not fetch chats:", chatErr.message);
          }
        }
        
        if (itemIdForChat) {
          console.log(`🎯 Navigating to chat with itemId: ${itemIdForChat}`);
          navigate(`/chat/item/${itemIdForChat}`);
        } else {
          console.log("📱 No itemId found, going to chat list");
          // Pass state to ChatList to help user find the chat
          navigate('/chats', { 
            state: { 
              fromNotification: true,
              notificationId: _id,
              senderId: relatedUser?._id || relatedUser,
              senderName: notification.title?.replace('New Message from ', '')?.replace(' ✉️', ''),
              messagePreview: notification.message,
              timestamp: new Date().toISOString(),
              // If we have partial info, pass it
              ...(relatedUser && { relatedUser }),
              ...(data && { notificationData: data })
            }
          });
        }
        break;
        
      case 'barter':
      case 'trade':
        if (relatedItem && relatedItem._id) {
          navigate(`/barter/${relatedItem._id}`);
        } else {
          navigate('/barter');
        }
        break;
        
      case 'user_blocked':
      case 'user_verified':
        if (relatedUser && relatedUser._id) {
          navigate(`/profile/${relatedUser._id}`);
        } else {
          navigate('/profile');
        }
        break;
        
      default:
        if (link && link.startsWith('/')) {
          navigate(link);
        }
        break;
    }
  };

  const markRead = async (id) => {
    if (!id) return;
    
    try {
      await API.put(`/notifications/${id}/read`);
      
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read/all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation(); // Prevent triggering the click handler
    
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const deleteAllNotifications = async () => {
    if (window.confirm("Are you sure you want to delete all notifications?")) {
      try {
        await Promise.all(
          notifications.map(notification => 
            API.delete(`/notifications/${notification._id}`)
          )
        );
        setNotifications([]);
      } catch (err) {
        console.error("Error deleting all notifications:", err);
        alert("Failed to delete all notifications");
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getNotificationBadge = (type) => {
    switch(type) {
      case 'barter':
      case 'trade':
        return 'BARTER';
      case 'message':
        return 'MESSAGE';
      case 'item_approved':
        return 'APPROVED';
      case 'item_rejected':
        return 'REJECTED';
      case 'user_blocked':
        return 'ACCOUNT';
      case 'user_verified':
        return 'ACCOUNT';
      case 'system':
        return 'SYSTEM';
      default:
        return 'NOTIFICATION';
    }
  };

  const getBadgeColor = (type, isRead) => {
    const baseColor = isRead ? '#6c757d' : '#4361ee';
    
    switch(type) {
      case 'item_approved':
        return isRead ? '#6c757d' : '#28a745';
      case 'item_rejected':
        return isRead ? '#6c757d' : '#dc3545';
      case 'message':
        return isRead ? '#6c757d' : '#007bff';
      case 'barter':
      case 'trade':
        return isRead ? '#6c757d' : '#fd7e14';
      case 'system':
        return isRead ? '#6c757d' : '#6f42c1';
      default:
        return baseColor;
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'item_approved':
        return '✅';
      case 'item_rejected':
        return '❌';
      case 'message':
        return '💬';
      case 'barter':
      case 'trade':
        return '🔄';
      case 'system':
        return '📢';
      default:
        return '📌';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ 
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

  if (error) {
    return (
      <div style={{ 
        maxWidth: "800px", 
        margin: "60px auto",
        padding: "40px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "64px", marginBottom: "20px", color: "#dc3545" }}>⚠️</div>
        <h2 style={{ color: "#212529", marginBottom: "20px" }}>Error Loading Notifications</h2>
        <p style={{ color: "#6c757d", marginBottom: "30px" }}>{error}</p>
        <button
          onClick={fetchNotifications}
          style={{
            padding: "12px 24px",
            background: "#4361ee",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div style={{ 
        maxWidth: "800px", 
        margin: "60px auto",
        padding: "40px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>📭</div>
        <h1 style={{ marginBottom: "16px", color: "#212529" }}>No notifications yet</h1>
        <p style={{ 
          color: "#6c757d", 
          fontSize: "16px",
          lineHeight: 1.6,
          maxWidth: "500px",
          margin: "0 auto 40px"
        }}>
          When you receive messages, barter requests, or other updates, 
          they'll appear here.
        </p>
        
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/add-item" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "12px 24px",
                background: "#4361ee",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              List an Item
            </button>
          </Link>
          
          <Link to="/" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: "2px solid #4361ee",
                color: "#4361ee",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#4361ee";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#4361ee";
              }}
            >
              Browse Items
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#212529" }}>
            Notifications
          </h1>
          <p style={{ margin: "8px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
            {notifications.filter(n => !n.isRead).length} unread • {notifications.length} total
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={fetchNotifications}
            style={{
              padding: "8px 16px",
              background: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Refresh notifications"
          >
            <span>🔄</span> Refresh
          </button>
          
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: "8px 16px",
                background: "#4361ee",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Mark all as read"
            >
              <span>✓</span> Mark All Read
            </button>
          )}
          
          <button
            onClick={deleteAllNotifications}
            style={{
              padding: "8px 16px",
              background: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#dc3545"
            }}
            title="Delete all notifications"
          >
            <span>🗑️</span> Clear All
          </button>
        </div>
      </div>
      
      <div style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        border: "1px solid #e9ecef"
      }}>
        {notifications.map((notification, index) => {
          const id = notification?._id || `notification-${index}`;
          const message = notification?.message || "Notification";
          const title = notification?.title || "Notification";
          const type = notification?.type || "system";
          const isRead = notification?.isRead || false;
          const createdAt = notification?.createdAt || new Date().toISOString();
          const badgeText = getNotificationBadge(type);
          const badgeColor = getBadgeColor(type, isRead);
          const icon = getNotificationIcon(type);
          
          return (
            <div 
              key={id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: "20px",
                borderBottom: index < notifications.length - 1 ? "1px solid #f1f3f4" : "none",
                background: isRead ? "white" : "#f8fbff",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                borderLeft: isRead ? "none" : `4px solid ${badgeColor}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isRead ? "#fafafa" : "#f0f7ff";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isRead ? "white" : "#f8fbff";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              {/* Delete button */}
              <button
                onClick={(e) => deleteNotification(id, e)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  color: "#adb5bd",
                  cursor: "pointer",
                  padding: "5px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  zIndex: 2
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#dc3545";
                  e.target.style.background = "#ffeaea";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#adb5bd";
                  e.target.style.background = "transparent";
                }}
                title="Delete notification"
              >
                ✕
              </button>
              
              <div style={{ display: "flex", alignItems: "flex-start", gap: "15px" }}>
                {/* Icon */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: `${badgeColor}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                  color: badgeColor
                }}>
                  {icon}
                </div>
                
                <div style={{ flex: 1, marginRight: "30px" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    marginBottom: "8px",
                    gap: "10px"
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: "16px", 
                      fontWeight: "600",
                      color: isRead ? "#6c757d" : "#212529"
                    }}>
                      {title}
                    </h3>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        padding: "4px 10px",
                        background: `${badgeColor}20`,
                        color: badgeColor,
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        letterSpacing: "0.5px"
                      }}>
                        {badgeText}
                      </span>
                      
                      {!isRead && (
                        <span style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: badgeColor,
                          flexShrink: 0
                        }} />
                      )}
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: "0 0 12px 0", 
                    fontSize: "14px",
                    color: "#495057",
                    lineHeight: 1.5
                  }}>
                    {message}
                  </p>
                  
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "#868e96"
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span title={new Date(createdAt).toLocaleString()}>
                        {formatTimeAgo(createdAt)}
                      </span>
                    </span>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {type === 'message' && (
                        <span style={{
                          padding: "2px 8px",
                          background: "#e7f1ff",
                          color: "#007bff",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          Click to reply
                        </span>
                      )}
                      
                      {!isRead && (
                        <span style={{
                          padding: "2px 8px",
                          background: "#e7f1ff",
                          color: badgeColor,
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action hint based on type */}
              {(type === 'item_approved' || type === 'item_rejected' || type === 'message') && (
                <div style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#495057",
                  borderLeft: `3px solid ${badgeColor}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>👉</span>
                  <span>
                    {type === 'item_approved' && 'Click to view your approved item'}
                    {type === 'item_rejected' && 'Click to edit your item'}
                    {type === 'message' && 'Click to open conversation'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {notifications.length > 0 && (
        <div style={{ 
          marginTop: "20px", 
          textAlign: "center",
          padding: "15px",
          background: "#f8f9fa",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#6c757d",
          border: "1px solid #e9ecef"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
            <span>💡</span>
            <strong>Tip:</strong>
          </div>
          <p style={{ margin: 0 }}>
            Click on any notification to view details. Messages will take you to the chat.
          </p>
        </div>
      )}
      
      <div style={{ 
        marginTop: "30px", 
        padding: "20px",
        background: "#eef2ff",
        borderRadius: "12px",
        textAlign: "center"
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#4361ee" }}>Need help?</h3>
        <p style={{ margin: "0 0 15px 0", color: "#495057", fontSize: "14px" }}>
          If you're having issues with notifications, try refreshing or contact support.
        </p>
        <button
          onClick={fetchNotifications}
          style={{
            padding: "10px 20px",
            background: "#4361ee",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          Refresh Now
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notification-enter {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Notifications;