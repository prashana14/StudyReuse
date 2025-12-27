// services/notificationService.js
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Item = require('../models/itemModel');

class NotificationService {
  
  // Create a notification
  static async create(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      return await this.populateNotification(notification._id);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return null;
    }
  }
  
  // Populate notification with related data
  static async populateNotification(notificationId) {
    return await Notification.findById(notificationId)
      .populate('relatedItem', 'title image price')
      .populate('relatedUser', 'name email profilePicture')
      .populate('user', 'name email');
  }
  
  // Send item approval notification
  static async notifyItemApproved(userId, itemId, itemTitle) {
    return await this.create({
      user: userId,
      type: 'item_approved',
      title: 'Item Approved 🎉',
      message: `Your item "${itemTitle}" has been approved and is now visible to everyone.`,
      relatedItem: itemId,
      isRead: false
    });
  }
  
  // Send item rejection notification
  static async notifyItemRejected(userId, itemId, itemTitle, reason) {
    return await this.create({
      user: userId,
      type: 'item_rejected',
      title: 'Item Needs Changes ⚠️',
      message: `Your item "${itemTitle}" requires changes. Reason: ${reason}`,
      relatedItem: itemId,
      isRead: false
    });
  }
  
  // Send new message notification
  static async notifyNewMessage(receiverId, senderId, senderName, messagePreview) {
    return await this.create({
      user: receiverId,
      type: 'message',
      title: `New Message from ${senderName} ✉️`,
      message: messagePreview.length > 50 
        ? `${messagePreview.substring(0, 50)}...` 
        : messagePreview,
      relatedUser: senderId,
      isRead: false
    });
  }
  
  // Send barter request notification
  static async notifyBarterRequest(receiverId, senderId, senderName, itemTitle) {
    return await this.create({
      user: receiverId,
      type: 'barter',
      title: 'New Barter Request 🔄',
      message: `${senderName} wants to barter for your "${itemTitle}"`,
      relatedUser: senderId,
      isRead: false
    });
  }
  
  // Send system notification
  static async notifySystem(userId, title, message, data = {}) {
    return await this.create({
      user: userId,
      type: 'system',
      title: title,
      message: message,
      data: data,
      isRead: false
    });
  }
  
  // Send welcome notification to new user
  static async sendWelcomeNotification(userId) {
    return await this.create({
      user: userId,
      type: 'system',
      title: 'Welcome to StudyReuse! 🎓',
      message: 'Thanks for joining our community. Start by browsing items or listing your own study materials!',
      isRead: false
    });
  }
}

module.exports = NotificationService;