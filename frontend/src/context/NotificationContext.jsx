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
      console.log('🚨 ====== NOTIFICATION CLICK START ======');
      console.log('📋 Notification Data:', {
        type: notification.type,
        action: notification.action,
        link: notification.link,
        actionData: notification.actionData,
        relatedItem: notification.relatedItem
      });
      
      // Mark as read if unread
      if (!notification.isRead && notification._id) {
        try {
          if (isAdmin) {
            await apiService.admin.markAdminNotificationAsRead(notification._id);
          } else {
            await apiService.notifications.markAsRead(notification._id);
          }
          console.log('✅ Marked as read');
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }

      // FUNCTION TO FIX NOTIFICATION LINKS
      const fixNotificationLink = (link, notification) => {
        if (!link) return null;
        
        console.log(`🔧 Fixing link: ${link}`);
        
        // Fix 1: /items/:id → /item/:id
        if (link.startsWith('/items/') && !link.startsWith('/items?')) {
          const fixedLink = link.replace('/items/', '/item/');
          console.log(`  🔄 Fixed to: ${fixedLink}`);
          return fixedLink;
        }
        
        // Fix 2: /chats?itemId=xxx → /chat/xxx
        if (link.includes('/chats') && link.includes('itemId=')) {
          const itemId = new URLSearchParams(link.split('?')[1]).get('itemId');
          if (itemId) {
            const fixedLink = `/chat/${itemId}`;
            console.log(`  🔄 Fixed to: ${fixedLink}`);
            return fixedLink;
          }
        }
        
        // Fix 3: /chats (without itemId) → use actionData.itemId or relatedItem
        if (link.includes('/chats')) {
          const itemId = notification.actionData?.itemId || 
                        (notification.relatedItem && notification.relatedItem._id);
          if (itemId) {
            const fixedLink = `/chat/${itemId}`;
            console.log(`  🔄 Fixed to: ${fixedLink}`);
            return fixedLink;
          }
        }
        
        console.log(`  ✅ Link is OK: ${link}`);
        return link;
      };

      // PRIORITY 1: Handle fixed link
      if (notification.link) {
        const fixedLink = fixNotificationLink(notification.link, notification);
        if (fixedLink) {
          console.log(`📍 Navigating to fixed link: ${fixedLink}`);
          navigate(fixedLink);
          return;
        }
      }

      // PRIORITY 2: Handle based on action field
      if (notification.action) {
        console.log(`🎯 Processing action: ${notification.action}`);
        
        switch (notification.action) {
          case 'view_message':
            const chatItemId = notification.actionData?.itemId || 
                              (notification.relatedItem && notification.relatedItem._id);
            if (chatItemId) {
              console.log(`💬 Going to chat with item: /chat/${chatItemId}`);
              navigate(`/chat/${chatItemId}`);
            } else {
              console.log('❌ No itemId for chat, going to dashboard');
              navigate('/dashboard');
            }
            return;

          case 'view_item':
            const itemId = notification.actionData?.itemId || 
                          (notification.relatedItem && notification.relatedItem._id);
            if (itemId) {
              console.log(`📦 Going to item: /item/${itemId}`);
              navigate(`/item/${itemId}`);
            } else {
              console.log('❌ No itemId, going to my-items');
              navigate('/my-items');
            }
            return;

          case 'view_order':
            const orderId = notification.actionData?.orderId || 
                           notification.relatedOrder;
            if (orderId) {
              console.log(`📋 Going to order: /orders/${orderId}`);
              navigate(`/orders/${orderId}`);
            } else {
              console.log('❌ No orderId, going to orders');
              navigate('/orders');
            }
            return;

          default:
            console.log(`⚠️ Unknown action: ${notification.action}`);
            break;
        }
      }

      // PRIORITY 3: Handle based on type field
      if (notification.type) {
        console.log(`🔍 Processing type: ${notification.type}`);
        
        switch (notification.type) {
          case 'message':
          case 'new_message':
            const msgItemId = notification.actionData?.itemId || 
                             (notification.relatedItem && notification.relatedItem._id);
            if (msgItemId) {
              console.log(`💬 Type:message -> /chat/${msgItemId}`);
              navigate(`/chat/${msgItemId}`);
            } else {
              console.log('❌ No itemId for message type');
              navigate('/dashboard');
            }
            return;

          case 'item_approved':
          case 'item_rejected':
            const statusItemId = notification.actionData?.itemId || 
                                (notification.relatedItem && notification.relatedItem._id);
            if (statusItemId) {
              console.log(`📊 Type:${notification.type} -> /item/${statusItemId}`);
              navigate(`/item/${statusItemId}`);
            } else {
              console.log(`❌ No itemId for ${notification.type}, going to my-items`);
              navigate('/my-items');
            }
            return;

          case 'new_order':
            const newOrderId = notification.actionData?.orderId || 
                              notification.relatedOrder;
            if (newOrderId) {
              console.log(`🛒 Type:new_order -> /orders/${newOrderId}`);
              navigate(`/orders/${newOrderId}`);
            } else {
              console.log('❌ No orderId for new_order, going to orders');
              navigate('/orders');
            }
            return;

          case 'barter_request':
          case 'trade':
            console.log('🤝 Going to barter-requests');
            navigate('/barter-requests');
            return;

          default:
            console.log(`⚠️ Unknown type: ${notification.type}`);
            break;
        }
      }

      // FINAL FALLBACK
      console.log('⚠️ Could not determine destination, going to dashboard');
      navigate('/dashboard');

      console.log('✅ ====== NOTIFICATION CLICK END ======');

    } catch (error) {
      console.error('❌ ERROR in handleNotificationClick:', error);
      navigate('/dashboard');
    }
  }, [navigate, isAdmin]);

  const getActionLabel = (notification) => {
    if (notification.action) {
      switch (notification.action) {
        case 'view_user':
          return isAdmin ? 'View User' : 'View Profile';
        case 'view_item':
          return 'View Item';
        case 'view_order':
          return 'View Order';
        case 'view_message':
          return 'Open Chat';
        default:
          return 'View Details';
      }
    }
    
    if (notification.type) {
      switch (notification.type) {
        case 'message':
        case 'new_message':
          return 'Open Chat';
        case 'item_approved':
        case 'item_rejected':
          return 'View Item';
        case 'new_order':
          return 'View Order';
        case 'barter_request':
          return 'View Barter';
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