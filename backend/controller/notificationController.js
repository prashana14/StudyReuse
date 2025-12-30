const Notification = require('../models/notificationModel');
const jwt = require('jsonwebtoken');

// Helper to verify token
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing token');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

// ✅ FIXED: Return simple array for frontend
exports.getNotifications = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    // Get query parameters
    const { 
      type, 
      isRead, 
      limit = 20, 
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Build query
    const query = { user: userData.id };
    
    if (type) {
      query.type = type;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    // Get notifications
    const notifications = await Notification.find(query)
      .populate('relatedItem', 'title image price')
      .populate('relatedUser', 'name email profilePicture')
      .populate('user', 'name email')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));
    
    // ✅ FIXED: Return array directly (simpler for frontend)
    res.json(notifications);
    
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    
    if (err.message === 'Missing token') {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching notifications',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// ✅ PUT /api/notifications/:id/read - Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const { id } = req.params;
    
    console.log(`📝 Marking notification ${id} as read for user ${userData.id}`);
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userData.id },
      { isRead: true },
      { new: true }
    ).populate('relatedItem', 'title')
     .populate('relatedUser', 'name');
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or unauthorized' 
      });
    }
    
    console.log(`✅ Notification marked as read: ${notification._id}`);
    
    res.json({ 
      success: true, 
      message: 'Notification marked as read',
      data: { notification }
    });
    
  } catch (err) {
    console.error('❌ Error marking notification as read:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating notification',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ✅ PUT /api/notifications/read/all - Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    console.log(`📝 Marking all notifications as read for user ${userData.id}`);
    
    const result = await Notification.updateMany(
      { user: userData.id, isRead: false },
      { isRead: true }
    );
    
    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    
    res.json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: { modifiedCount: result.modifiedCount }
    });
    
  } catch (err) {
    console.error('❌ Error marking all notifications as read:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating notifications',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ✅ DELETE /api/notifications/:id - Delete single notification
exports.deleteNotification = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const { id } = req.params;
    
    console.log(`🗑️ Deleting notification ${id} for user ${userData.id}`);
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userData.id
    });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or unauthorized' 
      });
    }
    
    console.log(`✅ Notification deleted: ${notification._id}`);
    
    res.json({ 
      success: true, 
      message: 'Notification deleted successfully',
      data: { deletedId: id }
    });
    
  } catch (err) {
    console.error('❌ Error deleting notification:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting notification',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ✅ DELETE /api/notifications - Delete all notifications (optional)
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    console.log(`🗑️ Deleting all notifications for user ${userData.id}`);
    
    const result = await Notification.deleteMany({ user: userData.id });
    
    console.log(`✅ Deleted ${result.deletedCount} notifications`);
    
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} notifications`,
      data: { deletedCount: result.deletedCount }
    });
    
  } catch (err) {
    console.error('❌ Error deleting all notifications:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting notifications',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ✅ GET /api/notifications/unread/count - Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    const count = await Notification.countDocuments({
      user: userData.id,
      isRead: false
    });
    
    res.json({ 
      success: true, 
      data: { count }
    });
    
  } catch (err) {
    console.error('❌ Error getting unread count:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting notification count',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// ✅ HELPER FUNCTIONS (For use in other controllers)
// ============================================

// Create a notification (for use in other controllers)
exports.createNotification = async (notificationData) => {
  try {
    console.log('📨 Creating notification:', notificationData);
    
    const notification = await Notification.create(notificationData);
    
    // Populate if needed
    const populated = await Notification.findById(notification._id)
      .populate('relatedItem', 'title image')
      .populate('relatedUser', 'name email')
      .populate('user', 'name email');
    
    console.log(`✅ Notification created: ${notification._id}`);
    return populated || notification;
    
  } catch (err) {
    console.error('❌ Error creating notification:', err);
    return null;
  }
};

// Create notification for item approval
exports.notifyItemApproved = async (userId, itemId, itemTitle) => {
  return await this.createNotification({
    user: userId,
    type: 'item_approved',
    title: 'Item Approved',
    message: `Your item "${itemTitle}" has been approved and is now visible to everyone.`,
    relatedItem: itemId,
    isRead: false
  });
};

// Create notification for item rejection
exports.notifyItemRejected = async (userId, itemId, itemTitle, reason) => {
  return await this.createNotification({
    user: userId,
    type: 'item_rejected',
    title: 'Item Rejected',
    message: `Your item "${itemTitle}" was rejected. Reason: ${reason}`,
    relatedItem: itemId,
    isRead: false
  });
};

// Create notification for new message
exports.notifyNewMessage = async (userId, senderId, senderName, messagePreview) => {
  return await this.createNotification({
    user: userId,
    type: 'message',
    title: 'New Message',
    message: `New message from ${senderName}: ${messagePreview}`,
    relatedUser: senderId,
    isRead: false
  });
};

// Create system notification
exports.notifySystem = async (userId, title, message, data = {}) => {
  return await this.createNotification({
    user: userId,
    type: 'system',
    title: title || 'System Notification',
    message,
    data,
    isRead: false
  });
};