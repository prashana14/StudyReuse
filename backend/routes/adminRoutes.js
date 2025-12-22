const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Item = require("../models/itemModel"); // fixed import
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

/**
 * GET all users
 */
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

/**
 * Block / Unblock user
 */
router.put("/users/:id/block", authMiddleware, adminMiddleware, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.json({
    message: user.isBlocked ? "User blocked" : "User unblocked"
  });
});

/**
 * Get all items
 */
router.get("/items", authMiddleware, adminMiddleware, async (req, res) => {
  const items = await Item.find().populate("user", "name email");
  res.json(items);
});

/**
 * Delete item
 */
router.delete("/items/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ message: "Item deleted by admin" });
});

module.exports = router;
