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
        link: `/item/${itemId}/edit`, // Link to edit item page
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyItemRejected:', error.message);
      return null;
    }
  }
  
  // Send new message notification - FIXED: Added itemId parameter
  static async notifyNewMessage(receiverId, senderId, senderName, messagePreview, itemId) {
  try {
    if (!receiverId || !senderId || !senderName) {
      console.error('❌ Missing parameters for notifyNewMessage');
      return null;
    }
    
    // CRITICAL: ItemId is required for chat notifications
    if (!itemId) {
      console.error('❌ notifyNewMessage called without itemId! This will break chat links!');
      console.error('Parameters:', { receiverId, senderId, senderName, messagePreview, itemId });
      // Still create notification but it won't have proper chat link
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
      isRead: false
    };
    
    // Store itemId in multiple places for reliability
    if (itemId) {
      notificationData.relatedItem = itemId;
      notificationData.data = {
        itemId: itemId,
        senderId: senderId,
        notificationType: 'chat_message'
      };
    }
    
    // Always link to chats list, not specific chat (safer)
    notificationData.link = '/chats';
    
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
        link: `/barter/${itemId}`, // Link to barter page
        isRead: false
      });
    } catch (error) {
      console.error('❌ Error in notifyBarterRequest:', error.message);
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
        isRead: false
      };
      
      // Add link if provided in data
      if (data.link) {
        notificationData.link = data.link;
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
        link: '/', // Link to home page
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
}

module.exports = NotificationService;