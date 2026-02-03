const jwt = require('jsonwebtoken');
const NotificationService = require('../services/notificationService');

// Helper to verify token
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing token');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

// ✅ GET /api/notifications - Get all notifications for current user
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
    
    // Use NotificationService to get notifications
    const notifications = await NotificationService.getUserNotifications(userData.id, {
      limit: parseInt(limit),
      skip: skip,
      type: type,
      isRead: isRead !== undefined ? (isRead === 'true') : null,
      sortBy: sortBy,
      sortOrder: sortOrder
    });
    
    // ✅ Return array directly (simpler for frontend)
    res.json(notifications.notifications || []);
    
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
    
    const notification = await NotificationService.markAsRead(id, userData.id);
    
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
    
    const result = await NotificationService.markAllAsRead(userData.id);
    
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
    
    const result = await NotificationService.deleteNotification(id, userData.id);
    
    if (!result.success) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or unauthorized' 
      });
    }
    
    console.log(`✅ Notification deleted: ${id}`);
    
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
    
    // This function doesn't exist in NotificationService yet, so implement it here
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
    
    const count = await NotificationService.getUnreadCount(userData.id);
    
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
// ✅ TEST ENDPOINTS (For development)
// ============================================

// ✅ POST /api/notifications/test - Create test notifications
exports.createTestNotification = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    const { type = 'item_approved', itemId = 'test_item_123' } = req.body;
    
    console.log(`🧪 Creating test notification for user ${userData.id}, type: ${type}`);
    
    let notification;
    
    switch (type) {
      case 'item_approved':
        notification = await NotificationService.notifyItemApproved(
          userData.id,
          itemId,
          'Test Item Title'
        );
        break;
        
      case 'item_rejected':
        notification = await NotificationService.notifyItemRejected(
          userData.id,
          itemId,
          'Test Item Title',
          'Test rejection reason'
        );
        break;
        
      case 'new_order':
        notification = await NotificationService.notifyNewOrder(
          userData.id,
          'test_order_123',
          ['Test Item 1', 'Test Item 2'],
          'Test Buyer',
          true
        );
        break;
        
      case 'message':
        notification = await NotificationService.notifyNewMessage(
          userData.id,
          'test_sender_123',
          'Test Sender',
          'This is a test message preview',
          itemId
        );
        break;
        
      default:
        notification = await NotificationService.create({
          user: userData.id,
          type: type,
          title: `Test ${type} Notification`,
          message: `This is a test ${type} notification`,
          isRead: false
        });
    }
    
    if (!notification) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create test notification'
      });
    }
    
    res.json({
      success: true,
      message: 'Test notification created successfully',
      data: { notification }
    });
    
  } catch (err) {
    console.error('❌ Error creating test notification:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating test notification',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ✅ GET /api/notifications/debug - Get notification debug info
exports.getDebugInfo = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    // Get latest notification for debugging
    const notifications = await NotificationService.getUserNotifications(userData.id, {
      limit: 5,
      skip: 0
    });
    
    const debugInfo = {
      userId: userData.id,
      totalNotifications: notifications.total || 0,
      latestNotifications: notifications.notifications.map(n => ({
        id: n._id,
        type: n.type,
        action: n.action,
        link: n.link,
        relatedItem: n.relatedItem,
        relatedOrder: n.relatedOrder,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt
      }))
    };
    
    res.json({
      success: true,
      data: debugInfo
    });
    
  } catch (err) {
    console.error('❌ Error getting debug info:', err);
    res.status(500).json({
      success: false,
      message: 'Error getting debug info',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// ✅ FORWARDING FUNCTIONS (For backward compatibility)
// ============================================

// Create a notification (for use in other controllers) - USING NEW SERVICE
exports.createNotification = async (notificationData) => {
  return await NotificationService.create(notificationData);
};

// Create notification for item approval - USING NEW SERVICE
exports.notifyItemApproved = async (userId, itemId, itemTitle) => {
  return await NotificationService.notifyItemApproved(userId, itemId, itemTitle);
};

// Create notification for item rejection - USING NEW SERVICE
exports.notifyItemRejected = async (userId, itemId, itemTitle, reason) => {
  return await NotificationService.notifyItemRejected(userId, itemId, itemTitle, reason);
};

// Create notification for new message - USING NEW SERVICE
exports.notifyNewMessage = async (userId, senderId, senderName, messagePreview, itemId) => {
  return await NotificationService.notifyNewMessage(userId, senderId, senderName, messagePreview, itemId);
};

// Create system notification - USING NEW SERVICE
exports.notifySystem = async (userId, title, message, data = {}) => {
  return await NotificationService.notifySystem(userId, title, message, data);
};

// Create welcome notification - USING NEW SERVICE
exports.sendWelcomeNotification = async (userId) => {
  return await NotificationService.sendWelcomeNotification(userId);
};

// Create new order notification - USING NEW SERVICE
exports.notifyNewOrder = async (userId, orderId, itemTitles, buyerName, isBuyer = false) => {
  return await NotificationService.notifyNewOrder(userId, orderId, itemTitles, buyerName, isBuyer);
};

// Create order status update notification - USING NEW SERVICE
exports.notifyOrderStatusUpdate = async (userId, orderId, newStatus, isBuyer = true) => {
  return await NotificationService.notifyOrderStatusUpdate(userId, orderId, newStatus, isBuyer);
};

// Create order cancellation notification - USING NEW SERVICE
exports.notifyOrderCancelled = async (userId, orderId, reason = '', isSeller = false) => {
  return await NotificationService.notifyOrderCancelled(userId, orderId, reason, isSeller);
};