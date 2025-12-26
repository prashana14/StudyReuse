const express = require("express");
const router = express.Router();
const Notification = require("../models/notificationModel");
const authMiddleware = require("../middleware/authMiddleware");

// Get my notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    // CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const notifications = await Notification.find({
      user: req.user._id
    }).sort({ createdAt: -1 });
    
    // REMOVED: console.log(`Found ${notifications.length} notifications`);
    
    // Always return an array, even if empty
    res.json(notifications);
  } catch (error) {
    console.error("Error in notifications route:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // REMOVED: console.log("Marking notification as read:", req.params.id);
    
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true
    });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: error.message });
  }
});

// Handle OPTIONS preflight for notifications
router.options("/", (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;