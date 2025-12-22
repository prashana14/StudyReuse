const express = require("express");
const router = express.Router();
const Message = require("../models/messageModel"); // update filename if needed
const Item = require("../models/itemModel");       // update filename if needed
const Notification = require("../models/notificationModel"); // add Notification import
const authMiddleware = require("../middleware/authMiddleware");

// Send message
router.post("/", authMiddleware, async (req, res) => {
  const { itemId, receiverId, message } = req.body;

  const msg = new Message({
    item: itemId,
    sender: req.user._id,
    receiver: receiverId,
    message
  });

  await msg.save();

  // ✅ Move Notification creation inside async route
  await Notification.create({
    user: receiverId,
    message: "You received a new message."
  });

  res.json(msg);
});

// Get messages for an item
router.get("/:itemId", authMiddleware, async (req, res) => {
  const messages = await Message.find({
    item: req.params.itemId,
    $or: [
      { sender: req.user._id },
      { receiver: req.user._id }
    ]
  }).populate("sender receiver", "name");

  res.json(messages);
});

module.exports = router;
