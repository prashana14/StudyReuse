// backend/models/notificationModel.js
const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    type: {
      type: String,
      enum: [
        "message", 
        "item_approved", 
        "item_rejected", 
        "user_blocked", 
        "user_verified", 
        "system", 
        "barter", 
        "trade",
        "new_user",       // New user registered
        "new_item",       // New item added (pending)
        "new_order",      // New order placed
        "item_flag",      // Item flagged/reported
        "admin_alert",     // System alert for admin
        "order_updated",   // Order status updated
        "order_cancelled"  // Order cancelled
      ],
      default: "message"
    },
    
    title: {
      type: String,
      default: "New Notification"
    },
    
    message: {
      type: String,
      required: true
    },
    
    // Click Action Fields
    action: {
      type: String,
      enum: [
        "view_item",
        "view_user",
        "view_order",
        "review_item",
        "view_message",
        "view_barter",
        "view_trade",
        "system",
        "none"
      ],
      default: "none"
    },
    
    actionData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    link: {
      type: String,
      default: null
    },
    
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    },
    
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    
    relatedBarter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barter"
    },
    
    isRead: {
      type: Boolean,
      default: false
    },
    
    readAt: {
      type: Date,
      default: null
    },
    
    fromAdmin: {
      type: Boolean,
      default: false
    },
    
    adminAction: {
      type: Boolean,
      default: false
    },
    
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    }
  },
  {
    timestamps: true,
  }
);

// ======================
// INSTANCE METHODS
// ======================

/**
 * Generate a link for this notification based on its type and related data
 */
notificationSchema.methods.generateLink = function() {
  // If link is already set, use it
  if (this.link) return this.link;
  
  // Generate link based on notification type and related data
  switch (this.type) {
    case 'item_approved':
    case 'item_rejected':
    case 'new_item':
    case 'item_flag':
      return this.relatedItem ? `/item/${this.relatedItem}` : '/my-items';
    
    case 'new_order':
    case 'order_updated':
    case 'order_cancelled':
      return this.relatedOrder ? `/orders/${this.relatedOrder}` : '/orders';
    
    case 'message':
      return '/chats';
    
    case 'barter':
    case 'trade':
      return this.relatedItem ? `/barter/${this.relatedItem}` : '/barter-requests';
    
    case 'user_blocked':
    case 'user_verified':
    case 'new_user':
      return this.relatedUser ? `/profile/${this.relatedUser}` : '/profile';
    
    case 'system':
    case 'admin_alert':
      return '/dashboard';
    
    default:
      // Generate based on action if type not recognized
      switch (this.action) {
        case 'view_item':
          return this.relatedItem ? `/item/${this.relatedItem}` : '/items';
        case 'view_order':
          return this.relatedOrder ? `/orders/${this.relatedOrder}` : '/orders';
        case 'view_message':
          return '/chats';
        case 'view_user':
          return this.relatedUser ? `/profile/${this.relatedUser}` : '/profile';
        case 'view_barter':
        case 'view_trade':
          return this.relatedItem ? `/barter/${this.relatedItem}` : '/barter-requests';
        case 'review_item':
          return '/admin/items?status=pending';
        default:
          return '/notifications';
      }
  }
};

/**
 * Generate an appropriate action for this notification
 */
notificationSchema.methods.generateAction = function() {
  // If action is already set, use it
  if (this.action && this.action !== 'none') return this.action;
  
  // Generate action based on type
  switch (this.type) {
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
      return 'view_message';
    
    case 'barter':
    case 'trade':
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
};

/**
 * Mark this notification as read
 */
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

/**
 * Get the icon for this notification type
 */
notificationSchema.methods.getIcon = function() {
  const icons = {
    'item_approved': '✅',
    'item_rejected': '❌',
    'user_blocked': '🚫',
    'user_verified': '✅',
    'new_user': '👤',
    'new_item': '📦',
    'item_flag': '🚩',
    'system': '⚙️',
    'admin_alert': '📢',
    'barter': '🔄',
    'trade': '🤝',
    'new_order': '🛒',
    'message': '💬',
    'order_updated': '🔄',
    'order_cancelled': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'success': '✅',
    'error': '❌'
  };
  return icons[this.type] || '🔔';
};

/**
 * Get the CSS color class for this notification type
 */
notificationSchema.methods.getColorClass = function() {
  const colors = {
    'item_approved': 'notification-success',
    'item_rejected': 'notification-error',
    'user_blocked': 'notification-warning',
    'user_verified': 'notification-success',
    'new_user': 'notification-info',
    'new_item': 'notification-primary',
    'item_flag': 'notification-warning',
    'system': 'notification-info',
    'admin_alert': 'notification-warning',
    'barter': 'notification-primary',
    'trade': 'notification-success',
    'new_order': 'notification-success',
    'message': 'notification-info',
    'order_updated': 'notification-info',
    'order_cancelled': 'notification-error',
    'warning': 'notification-warning',
    'info': 'notification-info',
    'success': 'notification-success',
    'error': 'notification-error'
  };
  return colors[this.type] || 'notification-default';
};

/**
 * Get a human-readable label for the action
 */
notificationSchema.methods.getActionLabel = function() {
  const labels = {
    'view_item': 'View Item',
    'view_user': 'View Profile',
    'view_order': 'View Order',
    'review_item': 'Review Item',
    'view_message': 'View Message',
    'view_barter': 'View Barter',
    'view_trade': 'View Trade',
    'system': 'View Details',
    'none': 'View Details'
  };
  return labels[this.action] || 'View Details';
};

/**
 * Check if this notification is clickable (has a link or action)
 */
notificationSchema.methods.isClickable = function() {
  return this.link || (this.action && this.action !== 'none');
};

/**
 * Get time ago string for display
 */
notificationSchema.methods.getTimeAgo = function() {
  const now = new Date();
  const createdAt = this.createdAt;
  const diffMs = now - createdAt;
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffYear > 0) return `${diffYear}y ago`;
  if (diffMonth > 0) return `${diffMonth}mo ago`;
  if (diffWeek > 0) return `${diffWeek}w ago`;
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  if (diffSec > 0) return `${diffSec}s ago`;
  
  return 'Just now';
};

// ======================
// MIDDLEWARE
// ======================

/**
 * Auto-generate link and action before saving if not provided
 */
notificationSchema.pre('save', function(next) {
  // Only auto-generate if saving a new document
  if (this.isNew) {
    // Generate link if not provided
    if (!this.link) {
      this.link = this.generateLink();
    }
    
    // Generate action if not provided or set to 'none'
    if (!this.action || this.action === 'none') {
      this.action = this.generateAction();
    }
    
    // Set priority based on type
    const highPriorityTypes = ['admin_alert', 'item_flag', 'user_blocked', 'order_cancelled'];
    const mediumPriorityTypes = ['new_order', 'barter', 'trade', 'item_rejected'];
    
    if (highPriorityTypes.includes(this.type)) {
      this.priority = 'high';
    } else if (mediumPriorityTypes.includes(this.type)) {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  
  next();
});

// ======================
// STATIC METHODS
// ======================

/**
 * Get unread notifications count for a user
 */
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return await this.countDocuments({ 
      user: userId, 
      isRead: false 
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark all notifications as read for a user
 */
notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    const result = await this.updateMany(
      { 
        user: userId, 
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    return result.modifiedCount;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return 0;
  }
};

/**
 * Get notifications for a user with pagination
 */
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  try {
    const {
      limit = 20,
      skip = 0,
      type = null,
      isRead = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const query = { user: userId };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (isRead !== null) {
      query.isRead = isRead;
    }
    
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const notifications = await this.find(query)
      .populate('relatedItem', 'title images price')
      .populate('relatedUser', 'name email profilePicture')
      .populate('relatedOrder', 'totalAmount status')
      .populate('user', 'name email')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit);
    
    const total = await this.countDocuments(query);
    
    return {
      notifications,
      total,
      hasMore: (skip + limit) < total
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { notifications: [], total: 0, hasMore: false };
  }
};

/**
 * Create a notification with auto-generated fields
 */
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    
    // Ensure link and action are generated
    if (!notification.link) {
      notification.link = notification.generateLink();
    }
    
    if (!notification.action || notification.action === 'none') {
      notification.action = notification.generateAction();
    }
    
    await notification.save();
    return await notification.populate([
      { path: 'relatedItem', select: 'title images price' },
      { path: 'relatedUser', select: 'name email profilePicture' },
      { path: 'user', select: 'name email' }
    ]);
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Clean up old notifications
 */
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
      priority: { $ne: 'high' } // Don't delete high priority notifications
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    return 0;
  }
};

// Create indexes for better performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);