const express = require("express");
const router = express.Router();
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const Item = require("../models/itemModel");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// Middleware to prevent caching
// ======================
router.use((req, res, next) => {
  // Prevent caching for all notification routes
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ======================
// GET /api/notifications - Get all notifications for current user
// ======================
router.get("/", authMiddleware, async (req, res) => {
  try {

    
    const { 
      type, 
      isRead, 
      limit = 50, 
      page = 1,
      sort = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const sortOrder = sort === 'asc' ? 1 : -1;
    
    // Build query
    const query = { user: req.user._id };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .populate({
        path: 'relatedItem',
        select: 'title image price category condition',
        model: Item
      })
      .populate({
        path: 'relatedUser',
        select: 'name email profilePicture',
        model: User
      })
      .populate({
        path: 'user',
        select: 'name email',
        model: User
      })
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Convert to plain objects for better performance
    
    // Get counts for summary
    const totalCount = await Notification.countDocuments({ user: req.user._id });
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });
    
    // Format response
    const response = {
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: notifications.map(notif => ({
          ...notif,
          // Ensure proper type handling
          type: notif.type || 'system',
          title: notif.title || 'Notification',
          // Format dates
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
          // Human readable time
          timeAgo: getTimeAgo(notif.createdAt)
        })),
        summary: {
          total: totalCount,
          unread: unreadCount,
          read: totalCount - unreadCount
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
          hasMore: (page * limit) < totalCount
        }
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ======================
// GET /api/notifications/unread/count - Get unread count
// ======================
router.get("/unread/count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });
    
    res.json({
      success: true,
      data: { count }
    });
    
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count' 
    });
  }
});

// ======================
// PUT /api/notifications/:id/read - Mark notification as read
// ======================
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Marking notification ${id} as read`);
    
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id, 
        user: req.user._id 
      },
      { 
        isRead: true,
        readAt: new Date()
      },
      { 
        new: true,
        runValidators: true 
      }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or unauthorized' 
      });
    }
    
    console.log(`✅ Notification ${id} marked as read`);
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
    
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ======================
// PUT /api/notifications/read/all - Mark all notifications as read
// ======================
router.put("/read/all", authMiddleware, async (req, res) => {
  try {
    console.log(`📝 Marking all notifications as read for user ${req.user._id}`);
    
    const result = await Notification.updateMany(
      { 
        user: req.user._id, 
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    
    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: { modifiedCount: result.modifiedCount }
    });
    
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
});

// ======================
// DELETE /api/notifications/:id - Delete single notification
// ======================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting notification ${id}`);
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found or unauthorized' 
      });
    }
    
    console.log(`✅ Notification ${id} deleted`);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: { deletedId: id }
    });
    
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
});

// ======================
// DELETE /api/notifications - Delete all notifications
// ======================
router.delete("/", authMiddleware, async (req, res) => {
  try {
    console.log(`🗑️ Deleting all notifications for user ${req.user._id}`);
    
    const result = await Notification.deleteMany({ 
      user: req.user._id 
    });
    
    console.log(`✅ Deleted ${result.deletedCount} notifications`);
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      data: { deletedCount: result.deletedCount }
    });
    
  } catch (error) {
    console.error("❌ Error deleting all notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notifications' 
    });
  }
});

// ======================
// POST /api/notifications/test - Create test notifications (development only)
// ======================
if (process.env.NODE_ENV === 'development') {
  router.post("/test", authMiddleware, async (req, res) => {
    try {
      const userId = req.user._id;
      
      const testNotifications = [
        {
          user: userId,
          type: "item_approved",
          title: "Item Approved! 🎉",
          message: "Your 'Calculus Textbook' has been approved and is now visible to everyone.",
          isRead: false
        },
        {
          user: userId,
          type: "message",
          title: "New Message ✉️",
          message: "John Doe sent you a message: 'Is this item still available?'",
          isRead: true
        },
        {
          user: userId,
          type: "system",
          title: "Welcome to StudyReuse! 👋",
          message: "Thank you for joining our community. Start by browsing items or listing your own!",
          isRead: false
        },
        {
          user: userId,
          type: "barter",
          title: "Barter Request 🔄",
          message: "Sarah wants to trade 'Engineering Calculator' for your 'Physics Lab Manual'",
          isRead: false
        },
        {
          user: userId,
          type: "trade",
          title: "Trade Successful! ✅",
          message: "Your trade with Alex has been completed successfully.",
          isRead: false
        }
      ];
      
      // Insert test notifications
      const created = await Notification.insertMany(testNotifications);
      
      console.log(`✅ Created ${created.length} test notifications`);
      
      res.json({
        success: true,
        message: `Created ${created.length} test notifications`,
        data: { count: created.length }
      });
      
    } catch (error) {
      console.error("❌ Error creating test notifications:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create test notifications' 
      });
    }
  });
}

// ======================
// Helper Functions
// ======================

function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return past.toLocaleDateString();
}

// ======================
// Handle OPTIONS preflight
// ======================
router.options("/", (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

router.options("/*", (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

module.exports = router;