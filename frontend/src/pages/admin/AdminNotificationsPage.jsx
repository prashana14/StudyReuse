// src/pages/admin/AdminNotificationsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from "../../services/api";

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const itemId = searchParams.get('itemId');
    
    if (type || userId || itemId) {
      // Apply filters based on URL params
      if (type === 'user') {
        setTypeFilter('user_blocked');
      } else if (type === 'item') {
        setTypeFilter('new_item');
      }
    }
    
    fetchNotifications();
  }, [currentPage, filter, typeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      console.log('Fetching notifications with params:', params);
      
      let data;
      
      // Check if notification endpoint exists
      if (typeof apiService.admin.getAdminNotifications === 'function') {
        try {
          data = await apiService.admin.getAdminNotifications(params);
          console.log('Notifications API response:', data);
        } catch (apiError) {
          console.log('Notifications API failed, trying fallback:', apiError.message);
          data = await generateNotificationsFromItems(params);
        }
      } else {
        console.log('Notifications API not found, using fallback');
        data = await generateNotificationsFromItems(params);
      }
      
      // Handle different response structures
      let notificationsList = [];
      let paginationInfo = {
        totalPages: 1,
        currentPage: currentPage,
        total: 0
      };
      
      if (data) {
        if (Array.isArray(data)) {
          notificationsList = data;
          paginationInfo.total = data.length;
        } else if (data.notifications) {
          notificationsList = data.notifications;
          paginationInfo.total = data.total || data.notifications.length || 0;
          paginationInfo.totalPages = data.pagination?.totalPages || 
                                     data.totalPages || 
                                     Math.ceil(paginationInfo.total / params.limit);
        } else if (data.data) {
          notificationsList = data.data;
          paginationInfo.total = data.total || data.data.length || 0;
        } else {
          notificationsList = [];
        }
      }
      
      setNotifications(notificationsList);
      setTotalPages(paginationInfo.totalPages);
      setTotalItems(paginationInfo.total);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // CLICKABLE NOTIFICATION HANDLING
  // ======================
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await handleMarkAsRead(notification._id);
      }
      
      // Navigate based on notification data
      const navigateTo = getNavigationTarget(notification);
      
      if (navigateTo) {
        navigate(navigateTo);
      }
      
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNavigationTarget = (notification) => {
    // Priority 1: Use link field if available
    if (notification.link) {
      return notification.link;
    }
    
    // Priority 2: Use action field
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
        case 'view_message':
          return '/admin/chats';
        case 'system':
          return '/admin/dashboard';
        default:
          break;
      }
    }
    
    // Priority 3: Use type field
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
        case 'admin_alert':
        case 'system':
          return '/admin/dashboard';
        case 'message':
          return '/admin/chats';
        case 'barter':
        case 'trade':
          return '/admin/barter';
        default:
          break;
      }
    }
    
    // Default: Stay on notifications page
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
        case 'message':
          return '💬 View Chat';
        case 'barter':
        case 'trade':
          return '🔄 View Barter';
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

  // ======================
  // NOTIFICATION ACTIONS
  // ======================
  const handleMarkAsRead = async (notificationId) => {
    try {
      if (typeof apiService.admin.markAdminNotificationAsRead === 'function') {
        await apiService.admin.markAdminNotificationAsRead(notificationId);
      } else {
        console.log('Mark as read API not available, updating locally');
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
      if (typeof apiService.admin.markAllAdminNotificationsAsRead === 'function') {
        await apiService.admin.markAllAdminNotificationsAsRead();
      } else {
        console.log('Mark all as read API not available, updating locally');
      }
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      alert('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      alert('Notifications marked as read locally');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      if (typeof apiService.admin.deleteAdminNotification === 'function') {
        await apiService.admin.deleteAdminNotification(notificationId);
      } else {
        console.log('Delete notification API not available, removing locally');
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
      if (typeof apiService.admin.clearAllAdminNotifications === 'function') {
        await apiService.admin.clearAllAdminNotifications();
      } else {
        console.log('Clear all notifications API not available, clearing locally');
      }
      
      setNotifications([]);
      setTotalPages(1);
      setCurrentPage(1);
      
      alert('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setNotifications([]);
      alert('Notifications cleared locally');
    }
  };

  // Fallback function
  const generateNotificationsFromItems = async (params) => {
    try {
      console.log('Generating notifications from items data...');
      
      const itemsData = await apiService.admin.getItems({
        page: params.page,
        limit: params.limit,
        sort: 'desc'
      });
      
      let items = [];
      if (Array.isArray(itemsData)) {
        items = itemsData;
      } else if (itemsData?.items) {
        items = itemsData.items;
      } else if (itemsData?.data) {
        items = itemsData.data;
      }
      
      const generatedNotifications = items.map((item, index) => ({
        _id: `generated_${item._id || index}`,
        title: `New Item: ${item.title}`,
        message: `${item.title} has been listed by ${item.owner?.name || 'Unknown User'}`,
        type: 'new_item',
        action: 'view_item',
        isRead: false,
        createdAt: item.createdAt || new Date().toISOString(),
        relatedItem: item._id,
        relatedUser: item.owner?._id,
        link: `/admin/items/${item._id}`
      }));
      
      const systemNotifications = [
        {
          _id: 'system_1',
          title: 'System Update',
          message: 'Platform maintenance scheduled for this weekend',
          type: 'system',
          action: 'system',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          link: '/admin/dashboard'
        },
        {
          _id: 'system_2',
          title: 'New User Registered',
          message: 'A new user has joined the platform',
          type: 'new_user',
          action: 'view_user',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          link: '/admin/users'
        }
      ];
      
      const allNotifications = [...generatedNotifications, ...systemNotifications];
      
      let filteredNotifications = allNotifications;
      
      if (params.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === params.type);
      }
      
      if (params.isRead !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.isRead === params.isRead);
      }
      
      return {
        notifications: filteredNotifications.slice(0, params.limit),
        total: filteredNotifications.length,
        pagination: {
          totalPages: Math.ceil(filteredNotifications.length / params.limit),
          currentPage: params.page,
          total: filteredNotifications.length
        }
      };
      
    } catch (error) {
      console.error('Error generating notifications from items:', error);
      throw new Error('Could not generate notifications from available data');
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
    { value: 'new_order', label: '🛒 New Orders' },
    { value: 'message', label: '💬 Messages' },
    { value: 'barter', label: '🔄 Barters' },
    { value: 'trade', label: '🤝 Trades' },
    { value: 'admin_alert', label: '📢 Admin Alerts' },
    { value: 'warning', label: '⚠️ Warnings' },
    { value: 'info', label: 'ℹ️ Information' },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ======================
  // STYLES
  // ======================
  const filterLabelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '0.5rem'
  };

  const filterLabelWithIconStyle = {
    ...filterLabelStyle,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  };

  const selectStyle = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const selectFocusStyle = {
    outline: 'none',
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  };

  const selectHoverStyle = {
    borderColor: '#9ca3af'
  };

  const refreshButtonStyle = {
    flex: 1,
    padding: '0.625rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 500,
    fontSize: '0.875rem',
    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)'
  };

  const refreshButtonHoverStyle = {
    backgroundColor: '#1d4ed8',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            <span style={{ marginRight: '0.5rem' }}>📢</span>
            Admin Notifications
          </h1>
          <p style={{
            color: '#6b7280',
            marginTop: '0.25rem',
            fontSize: '0.875rem'
          }}>
            {totalItems > 0 ? `${totalItems} total notifications` : 'Manage system notifications'}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ 
            position: 'relative',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            backgroundColor: unreadCount > 0 ? '#f0f9ff' : 'transparent',
            border: unreadCount > 0 ? '1px solid #dbeafe' : 'none'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-0.25rem',
                right: '-0.25rem',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.75rem',
                borderRadius: '9999px',
                height: '1.25rem',
                width: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: unreadCount === 0 ? '#f3f4f6' : '#2563eb',
              color: unreadCount === 0 ? '#9ca3af' : '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500,
              fontSize: '0.875rem',
              boxShadow: unreadCount > 0 ? '0 1px 3px rgba(37, 99, 235, 0.2)' : 'none'
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
            Mark All as Read
          </button>
          
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: notifications.length === 0 ? '#f3f4f6' : '#dc2626',
              color: notifications.length === 0 ? '#9ca3af' : '#ffffff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: notifications.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500,
              fontSize: '0.875rem',
              boxShadow: notifications.length > 0 ? '0 1px 3px rgba(220, 38, 38, 0.2)' : 'none'
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
            <div style={{ 
              marginTop: '0.75rem', 
              display: 'flex', 
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={fetchNotifications}
                style={{
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
              <button
                onClick={() => setError(null)}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: 'transparent',
                  color: '#991b1b',
                  border: '1px solid #991b1b',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fecaca';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
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
          <div>
            <label style={filterLabelWithIconStyle}>
              <span>📊</span>
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={selectStyle}
              onFocus={(e) => {
                Object.assign(e.currentTarget.style, selectFocusStyle);
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
            >
              <option value="all">🔔 All Notifications</option>
              <option value="unread">📨 Unread Only ({unreadCount})</option>
              <option value="read">📭 Read Only ({notifications.length - unreadCount})</option>
            </select>
          </div>
          
          <div>
            <label style={filterLabelWithIconStyle}>
              <span>🏷️</span>
              Filter by Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={selectStyle}
              onFocus={(e) => {
                Object.assign(e.currentTarget.style, selectFocusStyle);
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end',
            gap: '0.5rem'
          }}>
            <button
              onClick={fetchNotifications}
              style={refreshButtonStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, refreshButtonHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(37, 99, 235, 0.2)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
            >
              <span>🔄</span>
              Refresh
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
        overflow: 'hidden',
        minHeight: '300px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            padding: '3rem'
          }}>
            <div style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '9999px',
              height: '3rem',
              width: '3rem',
              borderBottom: '2px solid #2563eb',
              borderLeft: '2px solid transparent',
              borderRight: '2px solid transparent',
              borderTop: '2px solid transparent'
            }}></div>
            <p style={{
              marginTop: '1rem',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{ 
              fontSize: '4rem', 
              opacity: 0.2,
              marginBottom: '0.5rem'
            }}>
              🔔
            </span>
            <p style={{
              color: '#6b7280',
              fontSize: '1.125rem',
              margin: 0,
              fontWeight: 500
            }}>
              No notifications found
            </p>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem',
              margin: 0,
              maxWidth: '24rem',
              lineHeight: 1.5
            }}>
              {filter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your filters to see more notifications.'
                : 'All caught up! New notifications will appear here.'}
            </p>
            {(filter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setFilter('all');
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
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
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ 
              maxHeight: '600px',
              overflowY: 'auto',
              borderTop: '1px solid #e5e7eb'
            }}>
              {notifications.map((notification, index) => {
                const colors = getNotificationColor(notification.type);
                const isLast = index === notifications.length - 1;
                const actionLabel = getActionLabel(notification);
                
                return (
                  <div
                    key={notification._id || notification.id || index}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: !notification.isRead ? '#eff6ff' : '#ffffff',
                      borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = !notification.isRead ? '#e0f2fe' : '#f9fafb';
                      e.currentTarget.style.paddingLeft = '1.5rem';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = !notification.isRead ? '#eff6ff' : '#ffffff';
                      e.currentTarget.style.paddingLeft = '1.25rem';
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
                      gap: '1rem',
                      position: 'relative'
                    }}>
                      {/* Icon */}
                      <div style={{
                        flexShrink: 0,
                        marginTop: '0.125rem',
                        fontSize: '1.5rem',
                        width: '2.5rem',
                        height: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderRadius: '0.5rem',
                        border: `1px solid ${colors.border}`
                      }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          gap: '1rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              flexWrap: 'wrap',
                              marginBottom: '0.5rem'
                            }}>
                              <h3 style={{
                                fontWeight: 600,
                                color: '#1f2937',
                                fontSize: '0.875rem',
                                margin: 0
                              }}>
                                {notification.title || 'Notification'}
                              </h3>
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                borderRadius: '9999px',
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`
                              }}>
                                {notification.type ? 
                                  notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                                  : 'Notification'}
                              </span>
                            </div>
                            <p style={{
                              color: '#6b7280',
                              margin: '0 0 0.75rem 0',
                              fontSize: '0.875rem',
                              lineHeight: 1.5
                            }}>
                              {notification.message || notification.description || 'No message provided'}
                            </p>
                          </div>
                          
                          {/* Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            style={{
                              padding: '0.375rem 0.75rem',
                              backgroundColor: 'transparent',
                              color: '#2563eb',
                              border: '1px solid #dbeafe',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.2s ease',
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dbeafe';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {actionLabel}
                            <span>→</span>
                          </button>
                        </div>
                        
                        {/* Metadata and Actions */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '0.75rem',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              backgroundColor: '#f9fafb',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem'
                            }}>
                              <span>🕐</span>
                              {notification.createdAt ? formatTimeAgo(notification.createdAt) : 'Recently'}
                            </span>
                            
                            {notification.relatedUser && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backgroundColor: '#f9fafb',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem'
                              }}>
                                <span>👤</span>
                                User: {typeof notification.relatedUser === 'string' 
                                  ? notification.relatedUser.substring(0, 8) 
                                  : 'Unknown'}
                              </span>
                            )}
                            
                            {notification.relatedItem && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backgroundColor: '#f9fafb',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem'
                              }}>
                                <span>📦</span>
                                Item: {typeof notification.relatedItem === 'string'
                                  ? notification.relatedItem.substring(0, 8)
                                  : 'Unknown'}
                              </span>
                            )}
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id || notification.id);
                                }}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  color: '#2563eb',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #dbeafe',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontWeight: 500,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#dbeafe';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#eff6ff';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                ✅ Mark as Read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id || notification.id);
                              }}
                              style={{
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem',
                                color: '#dc2626',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee2e2';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fef2f2';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                      color: currentPage === 1 ? '#9ca3af' : '#374151',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      minWidth: '7rem',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage > 1) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage > 1) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <span>⬅️</span>
                    Previous
                  </button>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            minWidth: '2.5rem',
                            backgroundColor: currentPage === pageNum ? '#3b82f6' : '#ffffff',
                            color: currentPage === pageNum ? '#ffffff' : '#374151',
                            border: `1px solid ${currentPage === pageNum ? '#3b82f6' : '#d1d5db'}`,
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: currentPage === pageNum ? 600 : 400,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = currentPage === pageNum ? '#2563eb' : '#f9fafb';
                            e.currentTarget.style.borderColor = currentPage === pageNum ? '#2563eb' : '#9ca3af';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = currentPage === pageNum ? '#3b82f6' : '#ffffff';
                            e.currentTarget.style.borderColor = currentPage === pageNum ? '#3b82f6' : '#d1d5db';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span style={{ color: '#9ca3af' }}>...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                            e.currentTarget.style.borderColor = '#9ca3af';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      minWidth: '7rem',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage < totalPages) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage < totalPages) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    Next
                    <span>➡️</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;