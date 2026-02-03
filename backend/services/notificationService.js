// services/notificationService.js
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Item = require('../models/itemModel');

class NotificationService {
  
  // Create a notification with comprehensive validation
  static async create(notificationData) {
    try {
      // VALIDATION: Check if user is provided
      if (!notificationData.user) {
        console.error('❌ Notification creation failed: user field is required');
        console.error('Notification data:', notificationData);
        // Log stack trace to find where this was called from
        console.error('Stack trace:', new Error().stack);
        return null;
      }
      
      // Additional validation
      if (!notificationData.message && !notificationData.title) {
        console.error('❌ Notification creation failed: message or title is required');
        return null;
      }
      
      // Generate link if not provided
      if (!notificationData.link) {
        notificationData.link = this.generateLink(notificationData);
      }
      
      // Generate action if not provided
      if (!notificationData.action) {
        notificationData.action = this.generateAction(notificationData);
      }
      
      const notification = await Notification.create(notificationData);
      return await this.populateNotification(notification._id);
    } catch (error) {
      console.error('❌ Error creating notification:', error.message);
      console.error('Error details:', error);
      return null;
    }
  }
  
  // Populate notification with related data
  static async populateNotification(notificationId) {
    try {
      const notification = await Notification.findById(notificationId)
        .populate('relatedItem', 'title images price')
        .populate('relatedUser', 'name email profilePicture')
        .populate('user', 'name email');
      
      if (!notification) {
        console.error('❌ Notification not found for ID:', notificationId);
        return null;
      }
      
      return notification;
    } catch (error) {
      console.error('❌ Error populating notification:', error.message);
      return null;
    }
  }
  
  // Generate link based on notification data
  static generateLink(notificationData) {
    // If link already exists, use it
    if (notificationData.link) return notificationData.link;
    
    // Generate based on type/action
    switch (notificationData.type || notificationData.action) {
      case 'item_approved':
      case 'item_rejected':
      case 'new_item':
      case 'item_flag':
        return notificationData.relatedItem ? `/item/${notificationData.relatedItem}` : '/my-items';
      
      case 'new_order':
      case 'order_updated':
      case 'order_cancelled':
        return notificationData.relatedOrder ? `/orders/${notificationData.relatedOrder}` : '/orders';
      
      case 'message':
      case 'new_message':
        return '/chats';
      
      case 'barter':
      case 'trade':
      case 'barter_request':
        return notificationData.relatedItem ? `/barter/${notificationData.relatedItem}` : '/barter-requests';
      
      case 'user_blocked':
      case 'user_verified':
      case 'new_user':
        return notificationData.relatedUser ? `/profile/${notificationData.relatedUser}` : '/profile';
      
      case 'system':
      case 'admin_alert':
        return '/dashboard';
      
      default:
        return '/notifications';
    }
  }
  
  // Generate action based on notification data
  static generateAction(notificationData) {
    switch (notificationData.type) {
      case 'item_approved':
      case 'item_rejected':
      case 'new_item':
      case 'item_flag':
        return 'view_item';
      
      case 'new_order':
      case 'order_updated':
      case 'order_cancelled':
        return 'view_order';
      
      case 'message':
      case 'new_message':
        return 'view_message';
      
      case 'barter':
      case 'trade':
      case 'barter_request':
        return 'view_barter';
      
      case 'user_blocked':
      case 'user_verified':
      case 'new_user':
        return 'view_user';
      
      case 'system':
      case 'admin_alert':
        return 'system';
      
      default:
        return 'none';
    }
  }
  
  // Send item approval notification
  static async notifyItemApproved(userId, itemId, itemTitle) {
    try {
      if (!userId || !itemId || !itemTitle) {
        console.error('❌ Missing parameters for notifyItemApproved');
        return null;
      }
      
      return await this.create({
        user: userId,
        type: 'item_approved',
        title: 'Item Approved 🎉',
        message: `Your item "${itemTitle}" has been approved and is now visible to everyone.`,
        relatedItem: itemId,
        action: 'view_item',
        actionData: { itemId },
        link: `/item/${itemId}`, // Link to item page
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyItemApproved:', error.message);
      return null;
    }
  }
  
  // Send item rejection notification
  static async notifyItemRejected(userId, itemId, itemTitle, reason) {
    try {
      if (!userId || !itemId || !itemTitle || !reason) {
        console.error('❌ Missing parameters for notifyItemRejected');
        return null;
      }
      
      return await this.create({
        user: userId,
        type: 'item_rejected',
        title: 'Item Needs Changes ⚠️',
        message: `Your item "${itemTitle}" requires changes. Reason: ${reason}`,
        relatedItem: itemId,
        action: 'view_item',
        actionData: { itemId },
        link: `/item/${itemId}/edit`, // Link to edit item page
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyItemRejected:', error.message);
      return null;
    }
  }
  
  // Send new message notification
  static async notifyNewMessage(receiverId, senderId, senderName, messagePreview, itemId) {
    try {
      if (!receiverId || !senderId || !senderName) {
        console.error('❌ Missing parameters for notifyNewMessage');
        return null;
      }
      
      const preview = messagePreview || 'New message received';
      
      const notificationData = {
        user: receiverId,
        type: 'message',
        title: `New Message from ${senderName} ✉️`,
        message: preview.length > 50 
          ? `${preview.substring(0, 50)}...` 
          : preview,
        relatedUser: senderId,
        relatedItem: itemId,
        action: 'view_message',
        actionData: { 
          senderId,
          itemId: itemId,
          chatType: 'item_chat'
        },
        link: itemId ? `/chats?itemId=${itemId}` : '/chats',
        isRead: false
      };
      
      console.log('✅ Creating notification with data:', {
        receiverId,
        senderName,
        itemId,
        link: notificationData.link
      });
      
      return await this.create(notificationData);
    } catch (error) {
      console.error('❌ Error in notifyNewMessage:', error);
      return null;
    }
  }
  
  // Send barter request notification
  static async notifyBarterRequest(receiverId, senderId, senderName, itemTitle, itemId) {
    try {
      if (!receiverId || !senderId || !senderName || !itemTitle || !itemId) {
        console.error('❌ Missing parameters for notifyBarterRequest');
        return null;
      }
      
      return await this.create({
        user: receiverId,
        type: 'barter',
        title: 'New Barter Request 🔄',
        message: `${senderName} wants to barter for your "${itemTitle}"`,
        relatedUser: senderId,
        relatedItem: itemId,
        action: 'view_barter',
        actionData: { itemId, senderId },
        link: `/barter/${itemId}`, // Link to barter page
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyBarterRequest:', error.message);
      return null;
    }
  }
  
  // Send trade notification
  static async notifyTrade(receiverId, senderId, senderName, itemTitle, itemId, tradeId) {
    try {
      if (!receiverId || !senderId || !senderName || !itemTitle || !itemId || !tradeId) {
        console.error('❌ Missing parameters for notifyTrade');
        return null;
      }
      
      return await this.create({
        user: receiverId,
        type: 'trade',
        title: 'Trade Request 🤝',
        message: `${senderName} wants to trade for your "${itemTitle}"`,
        relatedUser: senderId,
        relatedItem: itemId,
        action: 'view_barter',
        actionData: { itemId, senderId, tradeId },
        link: `/barter/trade/${tradeId}`, // Link to specific trade
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyTrade:', error.message);
      return null;
    }
  }
  
  // Send new order notification
  static async notifyNewOrder(userId, orderId, itemTitles, buyerName, isBuyer = false) {
    try {
      if (!userId || !orderId) {
        console.error('❌ Missing parameters for notifyNewOrder');
        return null;
      }
      
      const itemList = Array.isArray(itemTitles) 
        ? itemTitles.join(', ') 
        : itemTitles;
      
      const title = isBuyer 
        ? 'Order Confirmed ✅' 
        : 'New Order Received 🛒';
      
      const message = isBuyer
        ? `Your order #${orderId.toString().slice(-6)} has been placed successfully`
        : `${buyerName || 'A customer'} ordered ${itemList}`;
      
      return await this.create({
        user: userId,
        type: 'new_order',
        title: title,
        message: message,
        relatedOrder: orderId,
        action: 'view_order',
        actionData: { orderId },
        link: `/orders/${orderId}`, // Link to order page
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyNewOrder:', error.message);
      return null;
    }
  }
  
  // Send order status update notification
  static async notifyOrderStatusUpdate(userId, orderId, newStatus, isBuyer = true) {
    try {
      if (!userId || !orderId || !newStatus) {
        console.error('❌ Missing parameters for notifyOrderStatusUpdate');
        return null;
      }
      
      const statusMap = {
        'Pending': 'is pending',
        'Processing': 'is being processed',
        'Shipped': 'has been shipped',
        'Delivered': 'has been delivered',
        'Cancelled': 'has been cancelled'
      };
      
      const statusText = statusMap[newStatus] || `status changed to ${newStatus}`;
      
      return await this.create({
        user: userId,
        type: 'order_updated',
        title: `Order ${newStatus === 'Cancelled' ? 'Cancelled' : 'Updated'} ${newStatus === 'Cancelled' ? '❌' : '🔄'}`,
        message: `Your order #${orderId.toString().slice(-6)} ${statusText}`,
        relatedOrder: orderId,
        action: 'view_order',
        actionData: { orderId, status: newStatus },
        link: `/orders/${orderId}`,
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyOrderStatusUpdate:', error.message);
      return null;
    }
  }
  
  // Send order cancellation notification
  static async notifyOrderCancelled(userId, orderId, reason = '', isSeller = false) {
    try {
      if (!userId || !orderId) {
        console.error('❌ Missing parameters for notifyOrderCancelled');
        return null;
      }
      
      const title = isSeller ? 'Order Cancelled by Buyer ❌' : 'Order Cancelled ❌';
      const message = isSeller
        ? `Order #${orderId.toString().slice(-6)} was cancelled by the buyer${reason ? `: ${reason}` : ''}`
        : `Your order #${orderId.toString().slice(-6)} has been cancelled${reason ? `: ${reason}` : ''}`;
      
      return await this.create({
        user: userId,
        type: 'order_cancelled',
        title: title,
        message: message,
        relatedOrder: orderId,
        action: 'view_order',
        actionData: { orderId },
        link: `/orders/${orderId}`,
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyOrderCancelled:', error.message);
      return null;
    }
  }
  
  // Send user blocked notification
  static async notifyUserBlocked(userId, reason, blockedByAdmin = 'Admin') {
    try {
      if (!userId || !reason) {
        console.error('❌ Missing parameters for notifyUserBlocked');
        return null;
      }
      
      return await this.create({
        user: userId,
        type: 'user_blocked',
        title: 'Account Blocked 🚫',
        message: `Your account has been blocked by ${blockedByAdmin}. Reason: ${reason}`,
        action: 'view_user',
        actionData: { userId },
        link: '/profile',
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyUserBlocked:', error.message);
      return null;
    }
  }
  
  // Send user verified notification
  static async notifyUserVerified(userId) {
    try {
      if (!userId) {
        console.error('❌ Missing parameters for notifyUserVerified');
        return null;
      }
      
      return await this.create({
        user: userId,
        type: 'user_verified',
        title: 'Account Verified ✅',
        message: 'Your account has been verified and is now active',
        action: 'view_user',
        actionData: { userId },
        link: '/profile',
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyUserVerified:', error.message);
      return null;
    }
  }
  
  // Send new user notification (for admin)
  static async notifyNewUser(userId, userName) {
    try {
      if (!userId || !userName) {
        console.error('❌ Missing parameters for notifyNewUser');
        return null;
      }
      
      return await this.create({
        user: userId, // This would be admin's ID, need to get admin ID
        type: 'new_user',
        title: 'New User Registered 👤',
        message: `${userName} has registered on the platform`,
        relatedUser: userId,
        action: 'view_user',
        actionData: { userId },
        link: `/admin/users/${userId}`,
        isRead: false,
        fromAdmin: true,
        adminAction: true
      });
    } catch (error) {
      console.error('❌ Error in notifyNewUser:', error.message);
      return null;
    }
  }
  
  // Send item flagged notification (for admin)
  static async notifyItemFlagged(itemId, itemTitle, reason, reportedBy) {
    try {
      if (!itemId || !itemTitle || !reason || !reportedBy) {
        console.error('❌ Missing parameters for notifyItemFlagged');
        return null;
      }
      
      // This would be sent to admin, so we need to get admin ID
      // For now, we'll return null as admin ID needs to be fetched
      return null;
      
      // Example implementation:
      // const admin = await User.findOne({ role: 'admin' });
      // if (!admin) return null;
      
      // return await this.create({
      //   user: admin._id,
      //   type: 'item_flag',
      //   title: 'Item Flagged 🚩',
      //   message: `Item "${itemTitle}" has been flagged by ${reportedBy}. Reason: ${reason}`,
      //   relatedItem: itemId,
      //   action: 'view_item',
      //   actionData: { itemId },
      //   link: `/admin/items/${itemId}`,
      //   isRead: false,
      //   fromAdmin: false,
      //   adminAction: true
      // });
    } catch (error) {
      console.error('❌ Error in notifyItemFlagged:', error.message);
      return null;
    }
  }
  
  // Send system notification
  static async notifySystem(userId, title, message, data = {}) {
    try {
      if (!userId || !title || !message) {
        console.error('❌ Missing parameters for notifySystem');
        return null;
      }
      
      const notificationData = {
        user: userId,
        type: 'system',
        title: title,
        message: message,
        action: 'system',
        isRead: false
      };
      
      // Add link if provided in data
      if (data.link) {
        notificationData.link = data.link;
      } else if (data.action) {
        notificationData.action = data.action;
        notificationData.actionData = data.actionData;
        notificationData.link = this.generateLink({
          ...notificationData,
          type: data.action
        });
      }
      
      // Add additional data
      if (Object.keys(data).length > 0) {
        notificationData.data = data;
      }
      
      return await this.create(notificationData);
    } catch (error) {
      console.error('❌ Error in notifySystem:', error.message);
      return null;
    }
  }
  
  // Send welcome notification to new user
  static async sendWelcomeNotification(userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot send welcome notification: userId is required');
        return null;
      }
      
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        console.error('❌ User not found for welcome notification:', userId);
        return null;
      }
      
      return await this.create({
        user: userId,
        type: 'system',
        title: 'Welcome to StudyReuse! 🎓',
        message: `Welcome ${user.name}! Thanks for joining our community. Start by browsing items or listing your own study materials!`,
        action: 'none',
        link: '/dashboard',
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in sendWelcomeNotification:', error.message);
      return null;
    }
  }
  
  // Get user notifications
  static async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      if (!userId) {
        console.error('❌ User ID is required for getUserNotifications');
        return [];
      }
      
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedItem', 'title images price')
        .populate('relatedUser', 'name email profilePicture')
        .populate('user', 'name email');
      
      return notifications;
    } catch (error) {
      console.error('❌ Error in getUserNotifications:', error.message);
      return [];
    }
  }
  
  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      if (!notificationId || !userId) {
        console.error('❌ Missing parameters for markAsRead');
        return null;
      }
      
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true },
        { new: true }
      ).populate('relatedItem', 'title images price')
       .populate('relatedUser', 'name email profilePicture');
      
      return notification;
    } catch (error) {
      console.error('❌ Error in markAsRead:', error.message);
      return null;
    }
  }
  
  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      if (!userId) {
        console.error('❌ User ID is required for markAllAsRead');
        return { success: false };
      }
      
      const result = await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true }
      );
      
      return { 
        success: true, 
        modifiedCount: result.modifiedCount 
      };
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error.message);
      return { success: false };
    }
  }
  
  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      if (!notificationId || !userId) {
        console.error('❌ Missing parameters for deleteNotification');
        return { success: false };
      }
      
      const result = await Notification.deleteOne({
        _id: notificationId,
        user: userId
      });
      
      return { 
        success: result.deletedCount > 0,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('❌ Error in deleteNotification:', error.message);
      return { success: false };
    }
  }
  
  // Get unread notification count for a user
  static async getUnreadCount(userId) {
    try {
      if (!userId) {
        console.error('❌ User ID is required for getUnreadCount');
        return 0;
      }
      
      const count = await Notification.countDocuments({
        user: userId,
        isRead: false
      });
      
      return count;
    } catch (error) {
      console.error('❌ Error in getUnreadCount:', error.message);
      return 0;
    }
  }
  
  // Clean up old notifications (optional utility)
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error in cleanupOldNotifications:', error.message);
      return 0;
    }
  }
  
  // Send admin notification (for admin panel)
  static async sendAdminNotification(adminId, title, message, data = {}) {
    try {
      if (!adminId || !title || !message) {
        console.error('❌ Missing parameters for sendAdminNotification');
        return null;
      }
      
      const notificationData = {
        user: adminId,
        type: 'admin_alert',
        title: title,
        message: message,
        action: 'system',
        fromAdmin: true,
        adminAction: true,
        isRead: false
      };
      
      if (data.link) {
        notificationData.link = data.link;
      }
      
      if (data.action) {
        notificationData.action = data.action;
        notificationData.actionData = data.actionData;
      }
      
      return await this.create(notificationData);
    } catch (error) {
      console.error('❌ Error in sendAdminNotification:', error.message);
      return null;
    }
  }
}

module.exports = NotificationService;