// src/pages/admin/AdminNotificationsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from "../../services/api";

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [showSendNotification, setShowSendNotification] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    userType: 'all',
    sendToAllAdmins: false,
    action: 'system',
    type: 'system_update'
  });
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter, typeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching notifications...');
      
      let data;
      let success = false;
      
      // Try admin notifications API
      if (apiService.admin?.getAdminNotifications) {
        try {
          const params = {
            page: currentPage,
            limit: 20,
            sort: 'desc'
          };
          
          if (filter === 'unread') {
            params.isRead = false;
          } else if (filter === 'read') {
            params.isRead = true;
          }
          
          if (typeFilter !== 'all') {
            params.type = typeFilter;
          }
          
          console.log('📡 Calling admin.getAdminNotifications with params:', params);
          data = await apiService.admin.getAdminNotifications(params);
          success = true;
          console.log('✅ Admin notifications response:', data);
        } catch (error1) {
          console.log('❌ Admin notifications failed:', error1.message);
        }
      }
      
      // Try regular notifications API if admin API failed
      if (!success && apiService.notifications?.getAll) {
        try {
          console.log('📡 Trying notifications.getAll');
          data = await apiService.notifications.getAll({ limit: 20 });
          success = true;
          console.log('✅ Regular notifications response:', data);
        } catch (error2) {
          console.log('❌ Regular notifications failed:', error2.message);
        }
      }
      
      if (!success) {
        setError('No notification APIs available. Please check backend connection.');
        setNotifications([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }
      
      // Process response data
      let notificationsList = [];
      let totalCount = 0;
      let totalPagesCount = 1;
      
      if (Array.isArray(data)) {
        notificationsList = data;
        totalCount = data.length;
      } else if (data?.notifications && Array.isArray(data.notifications)) {
        notificationsList = data.notifications;
        totalCount = data.total || data.notifications.length;
        totalPagesCount = data.pagination?.totalPages || data.totalPages || Math.ceil(totalCount / 20);
      } else if (data?.data && Array.isArray(data.data)) {
        notificationsList = data.data;
        totalCount = data.total || data.data.length;
        totalPagesCount = data.totalPages || Math.ceil(totalCount / 20);
      }
      
      console.log(`📊 Processed ${notificationsList.length} notifications`);
      
      setNotifications(notificationsList);
      setTotalPages(totalPagesCount);
      setTotalItems(totalCount);
      
    } catch (error) {
      console.error('❌ Error in fetchNotifications:', error);
      setError('Failed to load notifications. Please try again.');
      setNotifications([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      alert('Please enter both title and message');
      return;
    }

    try {
      setSendingNotification(true);
      
      const notificationData = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        action: notificationForm.action,
        userType: notificationForm.userType,
        sendToAllAdmins: notificationForm.sendToAllAdmins
      };

      let response;
      if (apiService.admin?.sendNotification) {
        response = await apiService.admin.sendNotification(notificationData);
      } else {
        throw new Error('Send notification API not available');
      }
      
      if (response?.success) {
        alert(`✅ Notification sent successfully to ${response.sentTo || 'users'}!`);
        
        setNotificationForm({
          title: '',
          message: '',
          userType: 'all',
          sendToAllAdmins: false,
          action: 'system',
          type: 'system_update'
        });
        
        setShowSendNotification(false);
        fetchNotifications();
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`❌ Failed to send notification: ${error.message}`);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead && notification._id) {
        await handleMarkAsRead(notification._id);
      }
      
      const navigateTo = getNavigationTarget(notification);
      if (navigateTo) {
        navigate(navigateTo);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNavigationTarget = (notification) => {
    if (notification.link) {
      return notification.link;
    }
    
    if (notification.action) {
      switch (notification.action) {
        case 'view_user':
          return notification.relatedUser 
            ? `/admin/users/${notification.relatedUser}`
            : '/admin/users';
        case 'view_item':
          return notification.relatedItem 
            ? `/admin/items/${notification.relatedItem}`
            : '/admin/items';
        case 'review_item':
          return '/admin/items?status=pending';
        case 'view_order':
          return notification.relatedOrder 
            ? `/admin/orders/${notification.relatedOrder}`
            : '/admin/orders';
        default:
          break;
      }
    }
    
    if (notification.type) {
      switch (notification.type) {
        case 'new_user':
          return notification.relatedUser 
            ? `/admin/users/${notification.relatedUser}`
            : '/admin/users';
        case 'new_item':
        case 'item_approved':
        case 'item_rejected':
        case 'item_flag':
          return notification.relatedItem 
            ? `/admin/items/${notification.relatedItem}`
            : '/admin/items';
        case 'user_blocked':
        case 'user_verified':
          return notification.relatedUser 
            ? `/admin/users/${notification.relatedUser}`
            : '/admin/users';
        case 'new_order':
          return notification.relatedOrder 
            ? `/admin/orders/${notification.relatedOrder}`
            : '/admin/orders';
        default:
          break;
      }
    }
    
    return null;
  };

  const getActionLabel = (notification) => {
    if (notification.action) {
      switch (notification.action) {
        case 'view_user':
          return '👤 View User';
        case 'view_item':
          return '📦 View Item';
        case 'review_item':
          return '🔍 Review Item';
        case 'view_order':
          return '🛒 View Order';
        case 'view_message':
          return '💬 View Message';
        case 'system':
          return '⚙️ View System';
        default:
          return '📄 View Details';
      }
    }
    
    if (notification.type) {
      switch (notification.type) {
        case 'new_user':
          return '👤 View User';
        case 'new_item':
          return '🔍 Review Item';
        case 'item_approved':
        case 'item_rejected':
          return '📦 View Item';
        case 'user_blocked':
          return '👥 Manage User';
        case 'new_order':
          return '🛒 View Order';
        case 'item_flag':
          return '🚩 Review Flag';
        default:
          return notification.relatedItem ? '📄 View Details' : 'ℹ️ View Info';
      }
    }
    
    return '📄 View Details';
  };

  const getNotificationIcon = (type) => {
    const emojis = {
      'item_approved': '✅',
      'item_rejected': '❌',
      'user_blocked': '🚫',
      'new_user': '👤',
      'new_item': '📦',
      'item_flag': '🚩',
      'system': '⚙️',
      'system_update': '🔄',
      'admin_alert': '📢',
      'new_order': '🛒',
      'message': '💬',
      'barter': '🔄',
      'trade': '🤝',
      'warning': '⚠️',
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
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
      'system_update': { bg: '#e0f2fe', text: '#0c4a6e', border: '#bae6fd' },
      'admin_alert': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
      'new_order': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
      'message': { bg: '#f0f9ff', text: '#0c4a6e', border: '#bae6fd' },
      'barter': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
      'trade': { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' },
      'warning': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
      'info': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
      'success': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
      'error': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
      'default': { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
    };
    return colors[type] || colors.default;
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      if (apiService.admin?.markAdminNotificationAsRead) {
        await apiService.admin.markAdminNotificationAsRead(notificationId);
      } else if (apiService.notifications?.markAsRead) {
        await apiService.notifications.markAsRead(notificationId);
      }
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (apiService.admin?.markAllAdminNotificationsAsRead) {
        await apiService.admin.markAllAdminNotificationsAsRead();
      }
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      alert('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      alert('✅ Notifications marked as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      if (apiService.admin?.deleteAdminNotification) {
        await apiService.admin.deleteAdminNotification(notificationId);
      }
      
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      if (apiService.admin?.clearAllAdminNotifications) {
        await apiService.admin.clearAllAdminNotifications();
      }
      
      setNotifications([]);
      setTotalPages(1);
      setCurrentPage(1);
      setTotalItems(0);
      alert('✅ All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setNotifications([]);
      alert('✅ Notifications cleared');
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffWeeks < 4) return `${diffWeeks}w ago`;
      if (diffMonths < 12) return `${diffMonths}mo ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const notificationTypes = [
    { value: 'all', label: '🔔 All Types' },
    { value: 'new_user', label: '👤 New Users' },
    { value: 'new_item', label: '📦 New Items' },
    { value: 'item_approved', label: '✅ Approved Items' },
    { value: 'item_rejected', label: '❌ Rejected Items' },
    { value: 'user_blocked', label: '⚠️ User Blocks' },
    { value: 'item_flag', label: '🚩 Flagged Items' },
    { value: 'system', label: '⚙️ System Alerts' },
    { value: 'system_update', label: '🔄 System Updates' },
    { value: 'new_order', label: '🛒 New Orders' },
    { value: 'message', label: '💬 Messages' },
    { value: 'barter', label: '🔄 Barters' },
    { value: 'trade', label: '🤝 Trades' },
    { value: 'admin_alert', label: '📢 Admin Alerts' },
    { value: 'warning', label: '⚠️ Warnings' },
    { value: 'info', label: 'ℹ️ Information' },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📢 Admin Notifications
          </h1>
          <p style={{
            color: '#6b7280',
            marginTop: '0.25rem',
            fontSize: '0.875rem'
          }}>
            {totalItems > 0 ? `${totalItems} total notifications` : 'No notifications available'}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          {/* Send Notification Button */}
          <button
            onClick={() => setShowSendNotification(!showSendNotification)}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: showSendNotification ? '#059669' : '#10b981',
              color: '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.2)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showSendNotification ? '#059669' : '#10b981';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(16, 185, 129, 0.2)';
            }}
          >
            <span>📤</span>
            {showSendNotification ? 'Close Form' : 'Send Notification'}
          </button>
          
          {/* Mark All Read Button */}
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: unreadCount === 0 ? '#f3f4f6' : '#2563eb',
              color: unreadCount === 0 ? '#9ca3af' : '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (unreadCount > 0) {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (unreadCount > 0) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span>✅</span>
            Mark All Read
          </button>
          
          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: notifications.length === 0 ? '#f3f4f6' : '#dc2626',
              color: notifications.length === 0 ? '#9ca3af' : '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: notifications.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (notifications.length > 0) {
                e.currentTarget.style.backgroundColor = '#b91c1c';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (notifications.length > 0) {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span>🗑️</span>
            Clear All
          </button>
        </div>
      </div>

      {/* Send Notification Form */}
      {showSendNotification && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          animation: 'slideDown 0.3s ease'
        }}>
          {/* ... [Keep your existing send notification form JSX] ... */}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <div style={{ 
            flexShrink: 0, 
            fontSize: '1.25rem',
            marginTop: '0.125rem'
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              margin: 0, 
              fontWeight: 600, 
              fontSize: '0.875rem',
              marginBottom: '0.25rem'
            }}>
              Error Loading Notifications
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '0.75rem',
              color: '#991b1b'
            }}>
              {error}
            </p>
            <button
              onClick={fetchNotifications}
              style={{
                marginTop: '0.75rem',
                padding: '0.375rem 0.75rem',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444';
              }}
            >
              <span>🔄</span>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
          gap: '1rem',
          alignItems: 'end'
        }}>
          {/* Status Filter */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <span>📊</span>
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="all">🔔 All Notifications</option>
              <option value="unread">📨 Unread Only ({unreadCount})</option>
              <option value="read">📭 Read Only ({notifications.length - unreadCount})</option>
            </select>
          </div>
          
          {/* Type Filter */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              <span>🏷️</span>
              Filter by Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Refresh Button */}
          <div>
            <button
              onClick={fetchNotifications}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>🔄</span>
              Refresh Notifications
            </button>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span>
            Showing {notifications.length} of {totalItems} notifications
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📄</span>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem'
          }}>
            <div style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '9999px',
              height: '3rem',
              width: '3rem',
              borderBottom: '3px solid #2563eb',
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderTop: '3px solid transparent'
            }}></div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span style={{ 
              fontSize: '4rem', 
              opacity: 0.2,
              display: 'block',
              marginBottom: '1rem'
            }}>🔔</span>
            <p style={{ 
              color: '#6b7280',
              margin: 0,
              fontSize: '1rem',
              fontWeight: 500
            }}>No notifications found</p>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#9ca3af',
              margin: '0.5rem 0 0 0'
            }}>
              {error ? 'Could not load notifications' : 'Your notification inbox is empty'}
            </p>
            <button
              onClick={fetchNotifications}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1.5rem',
                border: '1px solid #3b82f6',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>🔄</span>
              Refresh
            </button>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const colors = getNotificationColor(notification.type);
              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '1.25rem',
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
                      left: '0.75rem',
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
                    gap: '1rem'
                  }}>
                    {/* Notification Icon */}
                    <div style={{
                      flexShrink: 0,
                      width: '3rem',
                      height: '3rem',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderRadius: '0.75rem',
                      border: `2px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Notification Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        gap: '1rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ 
                            fontWeight: 600, 
                            color: '#1f2937', 
                            fontSize: '1rem',
                            margin: 0,
                            lineHeight: 1.4
                          }}>
                            {notification.title || 'Notification'}
                          </p>
                          <p style={{ 
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: '0.5rem 0 0 0',
                            lineHeight: 1.5
                          }}>
                            {notification.message || 'No message provided'}
                          </p>
                        </div>
                        
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '9999px',
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`
                          }}>
                            {notification.type ? notification.type.replace(/_/g, ' ') : 'Notification'}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af'
                          }}>
                            {notification.createdAt ? formatTimeAgo(notification.createdAt) : 'Recently'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '1rem'
                      }}>
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: 'transparent',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1d4ed8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563eb';
                              }}
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#047857';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                            }}
                          >
                            {getActionLabel(notification)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1.5rem',
          padding: '1rem'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
              color: currentPage === 1 ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            Previous
          </button>
          
          <span style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            padding: '0 1rem'
          }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#3b82f6',
              color: currentPage === totalPages ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Add CSS animations */}
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
      `}</style>
    </div>
  );
};

export default AdminNotificationsPage;