const express = require("express");
const router = express.Router();
const Notification = require("../models/notificationModel");
const authMiddleware = require("../middleware/authMiddleware");

// Get my notifications
router.get("/", authMiddleware, async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

// Mark notification as read
router.put("/:id", authMiddleware, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true
  });

  res.json({ message: "Notification marked as read" });
});

module.exports = router;
