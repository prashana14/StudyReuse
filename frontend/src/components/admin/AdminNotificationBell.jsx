// src/components/admin/AdminNotificationBell.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { BellIcon, XMarkIcon, CheckIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';
import apiService from '../../services/api'; // Use apiService, NOT adminService

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
      // Use apiService.admin.getAdminNotifications
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
      // Use apiService.admin.getAdminUnreadCount
      const data = await apiService.admin.getAdminUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      // Use apiService.admin.markAdminNotificationAsRead
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
      // Use apiService.admin.markAllAdminNotificationsAsRead
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
      // Use apiService.admin.deleteAdminNotification
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
    switch (type) {
      case 'item_approved':
        return '✅';
      case 'item_rejected':
        return '❌';
      case 'user_blocked':
        return '🚫';
      case 'user_verified':
      case 'new_user':
        return '👤';
      case 'new_item':
        return '📦';
      case 'item_flag':
        return '🚩';
      case 'system':
      case 'admin_alert':
        return '📢';
      case 'barter':
        return '🔄';
      case 'trade':
        return '🤝';
      case 'new_order':
        return '🛒';
      default:
        return '🔔';
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close notifications"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">All caught up!</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClickLocal(notification)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-blue-50 group ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Notification Icon */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${getNotificationColor(notification.type)} flex items-center justify-center text-lg`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800 text-sm truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Action Label */}
                          <span className="flex items-center text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {getActionLabel(notification)}
                            <ChevronRightIcon className="h-3 w-3 ml-1" />
                          </span>
                        </div>
                        
                        {/* Metadata and Actions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getNotificationColor(notification.type)}`}>
                              {notification.type.replace('_', ' ')}
                            </span>
                            <p className="text-xs text-gray-500">
                              {notification.timeAgo}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification._id, e)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                title="Mark as read"
                                aria-label="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification._id, e)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                              title="Delete notification"
                              aria-label="Delete notification"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex justify-between items-center">
              <a
                href="/admin/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View all notifications
              </a>
              <span className="text-xs text-gray-500">
                Click notifications to take action
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;