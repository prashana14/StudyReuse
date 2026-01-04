// src/components/admin/AdminNotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiService from '../../services/api';

const AdminNotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { handleNotificationClick, getActionLabel } = useNotification();

  useEffect(() => {
    fetchUnreadCount();
    
    const pollInterval = setInterval(fetchUnreadCount, 30000);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiService.admin.getAdminNotifications({ 
        limit: 10, 
        isRead: false,
        sort: 'desc' 
      });
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiService.admin.getAdminUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await apiService.admin.markAdminNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.admin.markAllAdminNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await apiService.admin.deleteAdminNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      if (notifications.find(n => n._id === notificationId && !n.isRead)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClickLocal = async (notification) => {
    setIsOpen(false);
    await handleNotificationClick(notification);
  };

  const getNotificationIcon = (type) => {
    const emojis = {
      'item_approved': '✅',
      'item_rejected': '❌',
      'user_blocked': '🚫',
      'user_verified': '👤',
      'new_user': '👤',
      'new_item': '📦',
      'item_flag': '🚩',
      'system': '⚙️',
      'admin_alert': '📢',
      'barter': '🔄',
      'trade': '🤝',
      'new_order': '🛒',
      'default': '🔔'
    };
    return emojis[type] || emojis.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'item_approved': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
      'item_rejected': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
      'user_blocked': { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
      'new_user': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
      'new_item': { bg: '#f3e8ff', text: '#7c3aed', border: '#e9d5ff' },
      'item_flag': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
      'system': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
      'admin_alert': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
      'default': { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
    };
    return colors[type] || colors.default;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '0.5rem',
          color: '#6b7280',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          borderRadius: '9999px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#1f2937';
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#6b7280';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <span style={{ fontSize: '1.5rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            height: '1.25rem',
            width: '1.25rem',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '0.75rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            animation: 'pulse 1.5s infinite',
            border: '2px solid #ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: '0.5rem',
          width: '24rem',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{
                  fontWeight: 600,
                  color: '#1f2937',
                  margin: 0,
                  fontSize: '1rem'
                }}>
                  <span style={{ marginRight: '0.5rem' }}>📢</span>
                  Notifications
                </h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0'
                }}>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{
                      fontSize: '0.75rem',
                      color: '#2563eb',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1e40af';
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#2563eb';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ marginRight: '0.25rem' }}>✅</span>
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: '#9ca3af',
                    padding: '0.375rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Close notifications"
                >
                  <span style={{ fontSize: '1.25rem' }}>✖️</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem'
              }}>
                <div style={{
                  animation: 'spin 1s linear infinite',
                  borderRadius: '9999px',
                  height: '2rem',
                  width: '2rem',
                  borderBottom: '2px solid #2563eb',
                  borderLeft: '2px solid transparent',
                  borderRight: '2px solid transparent',
                  borderTop: '2px solid transparent'
                }}></div>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <span style={{ 
                  fontSize: '3rem', 
                  opacity: 0.3,
                  display: 'block',
                  marginBottom: '0.75rem'
                }}>🔔</span>
                <p style={{ 
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '0.875rem'
                }}>No notifications</p>
                <p style={{ 
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  margin: '0.25rem 0 0 0'
                }}>All caught up! 🎉</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => {
                  const colors = getNotificationColor(notification.type);
                  return (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClickLocal(notification)}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: !notification.isRead ? '#eff6ff' : '#ffffff',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = !notification.isRead ? '#e0f2fe' : '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = !notification.isRead ? '#eff6ff' : '#ffffff';
                      }}
                    >
                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div style={{
                          position: 'absolute',
                          left: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '0.5rem',
                          height: '0.5rem',
                          backgroundColor: '#2563eb',
                          borderRadius: '9999px'
                        }}></div>
                      )}

                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.75rem'
                      }}>
                        {/* Notification Icon */}
                        <div style={{
                          flexShrink: 0,
                          width: '2.5rem',
                          height: '2.5rem',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderRadius: '0.5rem',
                          border: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem'
                        }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Notification Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <p style={{ 
                                fontWeight: 500, 
                                color: '#1f2937', 
                                fontSize: '0.875rem',
                                margin: 0,
                                lineHeight: 1.4
                              }}>
                                {notification.title || 'Notification'}
                              </p>
                              <p style={{ 
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                margin: '0.25rem 0 0 0',
                                lineHeight: 1.4
                              }}>
                                {notification.message || 'No message provided'}
                              </p>
                            </div>
                            
                            {/* Action Label */}
                            <span style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                              flexShrink: 0
                            }}>
                              {getActionLabel(notification)}
                              <span style={{ marginLeft: '0.125rem' }}>➡️</span>
                            </span>
                          </div>
                          
                          {/* Metadata and Actions */}
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.5rem'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              flexWrap: 'wrap'
                            }}>
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                fontSize: '0.625rem',
                                fontWeight: 500,
                                borderRadius: '9999px',
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`
                              }}>
                                {notification.type ? notification.type.replace(/_/g, ' ') : 'Notification'}
                              </span>
                              <span style={{
                                fontSize: '0.625rem',
                                color: '#9ca3af'
                              }}>
                                {notification.createdAt ? formatTimeAgo(notification.createdAt) : 'Recently'}
                              </span>
                            </div>
                            
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              opacity: 0,
                              transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0';
                            }}
                            >
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification._id, e)}
                                  style={{
                                    padding: '0.25rem',
                                    color: '#2563eb',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dbeafe';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Mark as read"
                                  aria-label="Mark as read"
                                >
                                  <span>✅</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(notification._id, e)}
                                style={{
                                  padding: '0.25rem',
                                  color: '#dc2626',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  borderRadius: '0.25rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fee2e2';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Delete notification"
                                aria-label="Delete notification"
                              >
                                <span>🗑️</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <a
                href="/admin/notifications"
                style={{
                  fontSize: '0.75rem',
                  color: '#2563eb',
                  textDecoration: 'none',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1e40af';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                <span style={{ marginRight: '0.25rem' }}>👁️</span>
                View all notifications
              </a>
              <span style={{
                fontSize: '0.625rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Click notifications to take action
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .group:hover .group-hover\\:opacity-100 {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminNotificationBell;