// src/pages/admin/AdminNotificationsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  UsersIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
// Fix: Import apiService instead of named exports
import apiService from "../../services/api"; // Changed from ../../../ to ../

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      const params = {
        page: currentPage,
        limit: 20,
        sort: 'desc'
      };
      
      if (filter === 'unread') {
        params.isRead = 'false';
      } else if (filter === 'read') {
        params.isRead = 'true';
      }
      
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      
      // Fix: Use apiService.admin.getAdminNotifications
      const data = await apiService.admin.getAdminNotifications(params);
      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'new_user':
        navigate(`/admin/users/${notification.relatedUser}`);
        break;
      case 'new_item':
        navigate(`/admin/items/${notification.relatedItem}`);
        break;
      case 'item_approved':
      case 'item_rejected':
        navigate(`/admin/items/${notification.relatedItem}`);
        break;
      case 'user_blocked':
        navigate(`/admin/users/${notification.relatedUser}`);
        break;
      case 'new_order':
        navigate(`/admin/orders/${notification.relatedOrder}`);
        break;
      default:
        // Just mark as read for system notifications
        if (!notification.isRead) {
          await handleMarkAsRead(notification._id);
        }
    }
  };

  const getActionLabel = (notification) => {
    switch (notification.type) {
      case 'new_user':
        return 'View User';
      case 'new_item':
        return 'Review Item';
      case 'item_approved':
      case 'item_rejected':
        return 'View Item';
      case 'user_blocked':
        return 'Manage User';
      case 'new_order':
        return 'View Order';
      default:
        return 'View Details';
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Fix: Use apiService.admin.markAdminNotificationAsRead
      await apiService.admin.markAdminNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Fix: Use apiService.admin.markAllAdminNotificationsAsRead
      await apiService.admin.markAllAdminNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      alert('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        // Fix: Use apiService.admin.deleteAdminNotification
        await apiService.admin.deleteAdminNotification(notificationId);
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        // Fix: Use apiService.admin.clearAllAdminNotifications
        await apiService.admin.clearAllAdminNotifications();
        setNotifications([]);
        alert('All notifications cleared');
      } catch (error) {
        console.error('Error clearing notifications:', error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'item_approved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'item_rejected':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'user_blocked':
        return <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />;
      case 'new_user':
        return <UsersIcon className="h-6 w-6 text-blue-500" />;
      case 'new_item':
        return <CubeIcon className="h-6 w-6 text-purple-500" />;
      case 'item_flag':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'system':
      case 'admin_alert':
        return <BellIcon className="h-6 w-6 text-indigo-500" />;
      case 'new_order':
        return <ShoppingCartIcon className="h-6 w-6 text-green-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'item_approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'item_rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'user_blocked':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'new_user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'new_item':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'item_flag':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'system':
      case 'admin_alert':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'new_order':
        return 'bg-green-50 text-green-800 border-green-100';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'new_user', label: 'New Users' },
    { value: 'new_item', label: 'New Items' },
    { value: 'item_approved', label: 'Approved Items' },
    { value: 'item_rejected', label: 'Rejected Items' },
    { value: 'user_blocked', label: 'User Blocks' },
    { value: 'item_flag', label: 'Flagged Items' },
    { value: 'system', label: 'System Alerts' },
    { value: 'new_order', label: 'New Orders' },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Notifications</h1>
          <p className="text-gray-600 mt-1">Manage and review all system notifications</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <BellIcon className="h-6 w-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckIcon className="h-5 w-5" />
            Mark All as Read
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <TrashIcon className="h-5 w-5" />
            Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchNotifications}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications found</p>
            <p className="text-gray-400 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification._id || notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-all duration-200 hover:bg-blue-50 group ${
                  !notification.isRead ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-800">
                            {notification.title || 'Notification'}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getNotificationColor(notification.type)}`}>
                            {notification.type ? notification.type.replace('_', ' ') : 'Notification'}
                          </span>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Unread
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-2">
                          {notification.message || notification.description || 'No message provided'}
                        </p>
                      </div>
                      
                      {/* Action Button */}
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                        {getActionLabel(notification)}
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                    
                    {/* Metadata and Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {notification.createdAt ? formatTimeAgo(notification.createdAt) : 'Recently'}
                        </span>
                        {notification.relatedUser && (
                          <span className="text-sm text-gray-500">
                            User ID: {notification.relatedUser}
                          </span>
                        )}
                        {notification.relatedItem && (
                          <span className="text-sm text-gray-500">
                            Item ID: {notification.relatedItem}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id || notification.id);
                            }}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification._id || notification.id);
                          }}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;