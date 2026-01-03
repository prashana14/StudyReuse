// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const navigate = useNavigate();
  const [notificationAction, setNotificationAction] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotificationClick = useCallback(async (notification) => {
    try {
      if (!notification.isRead && notification._id) {
        try {
          await apiService.admin.markAdminNotificationAsRead(notification._id);
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }

      switch (notification.action) {
        case 'view_user':
          if (notification.actionData?.userId) {
            navigate(`/admin/users?userId=${notification.actionData.userId}`);
          } else if (notification.relatedUser) {
            navigate(`/admin/users?userId=${notification.relatedUser}`);
          } else {
            navigate('/admin/users');
          }
          break;

        case 'view_item':
          if (notification.actionData?.itemId) {
            navigate(`/admin/items?itemId=${notification.actionData.itemId}`);
          } else if (notification.relatedItem) {
            navigate(`/admin/items?itemId=${notification.relatedItem}`);
          } else {
            navigate('/admin/items');
          }
          break;

        case 'review_item':
          navigate('/admin/items?status=pending');
          break;

        case 'view_order':
          if (notification.actionData?.orderId) {
            navigate(`/admin/orders?orderId=${notification.actionData.orderId}`);
          } else {
            navigate('/admin/orders');
          }
          break;

        case 'system':
          if (notification.link) {
            navigate(notification.link);
          }
          break;

        default:
          navigate('/admin/notifications');
          break;
      }

      setNotificationAction({
        type: notification.action,
        data: notification.actionData,
        notificationId: notification._id
      });

    } catch (error) {
      console.error('Error handling notification click:', error);
      navigate('/admin/notifications');
    }
  }, [navigate]);

  const getActionLabel = (notification) => {
    switch (notification.action) {
      case 'view_user':
        return 'View User';
      case 'view_item':
        return 'View Item';
      case 'review_item':
        return 'Review Item';
      case 'view_order':
        return 'View Order';
      case 'view_message':
        return 'View Message';
      default:
        return 'View Details';
    }
  };

  const fetchUnreadCount = async () => {
    try {
      if (localStorage.getItem('adminToken')) {
        const data = await apiService.admin.getAdminUnreadCount();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        handleNotificationClick,
        getActionLabel,
        notificationAction,
        setNotificationAction,
        unreadCount,
        setUnreadCount,
        fetchUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};