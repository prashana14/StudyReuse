const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Item = require("../models/itemModel");
const Notification = require("../models/notificationModel");
// REMOVE authMiddleware import since we don't need it
const adminMiddleware = require("../middleware/adminMiddleware");

// ==================== USER MANAGEMENT ====================

/**
 * GET all users with pagination and search
 */
router.get("/users", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const { page = 1, limit = 20, search = "", status } = req.query;
    
    // Build query
    const query = {};
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    // Filter by status
    if (status === "blocked") {
      query.isBlocked = true;
    } else if (status === "unverified") {
      // Assuming you might add isVerified field later
      // query.isVerified = false;
    }
    
    const users = await User.find(query)
      .select("-password")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Block user with reason
 */
router.put("/users/:id/block", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = true;
    user.blockedReason = reason;
    user.blockedAt = new Date();
    await user.save();

    // Create notification for the user
    await Notification.create({
      user: user._id,
      type: "user_blocked",
      title: "Account Blocked",
      message: `Your account has been blocked. Reason: ${reason || "Violation of community guidelines"}`,
      relatedUser: req.user.id
    });

    res.json({
      message: "User blocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Unblock user
 */
router.put("/users/:id/unblock", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = false;
    user.blockedReason = null;
    user.blockedAt = null;
    await user.save();

    res.json({
      message: "User unblocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Verify user (if you add isVerified field later)
 */
router.put("/users/:id/verify", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Create notification
    await Notification.create({
      user: user._id,
      type: "user_verified",
      title: "Account Verified",
      message: "Your account has been verified by the admin.",
      relatedUser: req.user.id
    });

    res.json({
      message: "User verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ITEM MANAGEMENT ====================

/**
 * GET all items with filters
 */
router.get("/items", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const { page = 1, limit = 20, status, search = "" } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status
    if (status === "pending") {
      query.isApproved = false;
    } else if (status === "approved") {
      query.isApproved = true;
    } else if (status === "flagged") {
      query.isFlagged = true;
    }
    
    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    
    const items = await Item.find(query)
      .populate("owner", "name email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Item.countDocuments(query);
    
    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Approve item
 */
router.put("/items/:id/approve", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const item = await Item.findById(req.params.id).populate("owner");
    
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.isApproved = true;
    item.isFlagged = false;
    item.flagReason = null;
    item.approvedAt = new Date();
    await item.save();

    // Create notification for item owner
    await Notification.create({
      user: item.owner._id,
      type: "item_approved",
      title: "Item Approved",
      message: `Your item "${item.title}" has been approved and is now visible to other users.`,
      relatedItem: item._id
    });

    res.json({
      message: "Item approved successfully",
      item: {
        id: item._id,
        title: item.title,
        isApproved: item.isApproved,
        approvedAt: item.approvedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Reject/Flag item
 */
router.put("/items/:id/reject", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const { reason } = req.body;
    const item = await Item.findById(req.params.id).populate("owner");
    
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.isFlagged = true;
    item.flagReason = reason;
    await item.save();

    // Create notification for item owner
    await Notification.create({
      user: item.owner._id,
      type: "item_rejected",
      title: "Item Rejected",
      message: `Your item "${item.title}" has been rejected. Reason: ${reason}`,
      relatedItem: item._id
    });

    res.json({
      message: "Item rejected successfully",
      item: {
        id: item._id,
        title: item.title,
        isFlagged: item.isFlagged,
        flagReason: item.flagReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete item
 */
router.delete("/items/:id", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const item = await Item.findById(req.params.id).populate("owner");
    
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Create notification before deleting
    await Notification.create({
      user: item.owner._id,
      type: "item_rejected",
      title: "Item Removed",
      message: `Your item "${item.title}" has been removed by admin for violating community guidelines.`,
      relatedItem: item._id
    });

    await Item.findByIdAndDelete(req.params.id);

    res.json({ 
      message: "Item deleted successfully",
      deletedItemId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN DASHBOARD ====================

/**
 * GET dashboard statistics
 */
router.get("/dashboard/stats", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const [
      totalUsers,
      blockedUsers,
      totalItems,
      pendingItems,
      flaggedItems
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Item.countDocuments(),
      Item.countDocuments({ isApproved: false }),
      Item.countDocuments({ isFlagged: true })
    ]);
    
    res.json({
      totalUsers,
      blockedUsers,
      totalItems,
      pendingItems,
      flaggedItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== NOTIFICATION MANAGEMENT ====================

/**
 * Send system notification to all users or specific user
 */
router.post("/notifications/send", adminMiddleware, async (req, res) => {  // REMOVED authMiddleware
  try {
    const { title, message, userId } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }
    
    if (userId) {
      // Send to specific user
      await Notification.create({
        user: userId,
        type: "system",
        title,
        message
      });
    } else {
      // Send to all users
      const users = await User.find({});
      const notifications = users.map(user => ({
        user: user._id,
        type: "system",
        title,
        message
      }));
      
      await Notification.insertMany(notifications);
    }
    
    res.json({ 
      message: "Notification sent successfully",
      sentTo: userId ? "specific user" : "all users"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;