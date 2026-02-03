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

export const NotificationProvider = ({ children, isAdmin = false }) => {
  const navigate = useNavigate();
  const [notificationAction, setNotificationAction] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotificationClick = useCallback(async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead && notification._id) {
        try {
          if (isAdmin) {
            await apiService.admin.markAdminNotificationAsRead(notification._id);
          } else {
            await apiService.notifications.markAsRead(notification._id);
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }

      // Priority 1: Use link field
      if (notification.link) {
        navigate(notification.link);
        return;
      }

      // Priority 2: Use action field
      if (notification.action) {
        switch (notification.action) {
          case 'view_user':
            if (isAdmin) {
              navigate(notification.actionData?.userId 
                ? `/admin/users?userId=${notification.actionData.userId}`
                : notification.relatedUser 
                  ? `/admin/users/${notification.relatedUser}`
                  : '/admin/users'
              );
            } else {
              navigate(notification.relatedUser ? `/profile/${notification.relatedUser}` : '/profile');
            }
            break;

          case 'view_item':
            if (isAdmin) {
              navigate(notification.actionData?.itemId 
                ? `/admin/items?itemId=${notification.actionData.itemId}`
                : notification.relatedItem 
                  ? `/admin/items/${notification.relatedItem}`
                  : '/admin/items'
              );
            } else {
              navigate(notification.relatedItem ? `/item/${notification.relatedItem}` : '/items');
            }
            break;

          case 'review_item':
            if (isAdmin) {
              navigate('/admin/items?status=pending');
            } else {
              navigate('/my-items');
            }
            break;

          case 'view_order':
            if (isAdmin) {
              navigate(notification.actionData?.orderId 
                ? `/admin/orders?orderId=${notification.actionData.orderId}`
                : notification.relatedOrder
                  ? `/admin/orders/${notification.relatedOrder}`
                  : '/admin/orders'
              );
            } else {
              navigate(notification.relatedOrder ? `/orders/${notification.relatedOrder}` : '/orders');
            }
            break;

          case 'view_message':
            navigate('/chats');
            break;

          case 'system':
            if (notification.link) {
              navigate(notification.link);
            }
            break;

          default:
            if (isAdmin) {
              navigate('/admin/notifications');
            } else {
              navigate('/notifications');
            }
            break;
        }
        return;
      }

      // Priority 3: Use type field
      if (notification.type) {
        switch (notification.type) {
          case 'message':
            navigate('/chats');
            break;
          case 'new_order':
            navigate(isAdmin ? '/admin/orders' : '/orders');
            break;
          case 'item_approved':
          case 'item_rejected':
            navigate(notification.relatedItem 
              ? (isAdmin ? `/admin/items/${notification.relatedItem}` : `/item/${notification.relatedItem}`)
              : (isAdmin ? '/admin/items' : '/my-items')
            );
            break;
          case 'barter':
          case 'trade':
            navigate(isAdmin ? '/admin/barter' : '/barter-requests');
            break;
          case 'new_user':
            navigate(isAdmin ? '/admin/users' : '/profile');
            break;
          case 'new_item':
            navigate(notification.relatedItem 
              ? (isAdmin ? `/admin/items/${notification.relatedItem}` : `/item/${notification.relatedItem}`)
              : (isAdmin ? '/admin/items' : '/items')
            );
            break;
          case 'user_blocked':
          case 'user_verified':
            navigate(isAdmin ? '/admin/users' : '/profile');
            break;
          default:
            navigate(isAdmin ? '/admin/notifications' : '/notifications');
            break;
        }
        return;
      }

      // Default navigation
      navigate(isAdmin ? '/admin/notifications' : '/notifications');

    } catch (error) {
      console.error('Error handling notification click:', error);
      navigate(isAdmin ? '/admin/notifications' : '/notifications');
    }
  }, [navigate, isAdmin]);

  const getActionLabel = (notification) => {
    if (notification.action) {
      switch (notification.action) {
        case 'view_user':
          return isAdmin ? 'View User' : 'View Profile';
        case 'view_item':
          return isAdmin ? 'View Item' : 'View Item';
        case 'review_item':
          return isAdmin ? 'Review Item' : 'Review Item';
        case 'view_order':
          return isAdmin ? 'View Order' : 'View Order';
        case 'view_message':
          return 'View Message';
        default:
          return 'View Details';
      }
    }
    
    if (notification.type) {
      switch (notification.type) {
        case 'message':
          return 'View Chat';
        case 'new_order':
          return 'View Order';
        case 'item_approved':
        case 'item_rejected':
          return 'View Item';
        case 'barter':
        case 'trade':
          return 'View Barter';
        case 'new_user':
          return isAdmin ? 'View User' : 'View Profile';
        default:
          return 'View Details';
      }
    }
    
    return 'View Details';
  };

  const fetchUnreadCount = async () => {
    try {
      if (isAdmin && localStorage.getItem('adminToken')) {
        const data = await apiService.admin.getAdminUnreadCount();
        setUnreadCount(data.count || 0);
      } else if (!isAdmin && localStorage.getItem('token')) {
        const data = await apiService.notifications.getUnreadCount();
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