const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Item = require("../models/itemModel");
const Notification = require("../models/notificationModel");
const adminMiddleware = require("../middleware/adminMiddleware");
const jwt = require('jsonwebtoken');

// ==================== ADMIN AUTH ====================

/**
 * Check if admin registration is allowed (max 2 admins)
 */
router.get("/admin/check-limit", async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    
    res.json({
      allowed: adminCount < 2,
      currentCount: adminCount,
      maxAllowed: 2
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Register new admin (only if less than 2 admins exist)
 */
router.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check admin limit
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount >= 2) {
      return res.status(403).json({ 
        message: "Maximum admin limit reached (2 admins only)" 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }
    
    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: "admin"
    });
    
    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id,
        role: admin.role,
        email: admin.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    
    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Admin login (only users with role: "admin")
 */
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with admin role
    const user = await User.findOne({ email, role: "admin" });
    
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid admin credentials" 
      });
    }
    
    // Check password using the model method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: "Invalid admin credentials" 
      });
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: "Admin account is blocked",
        reason: user.blockedReason 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    
    res.json({
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== USER MANAGEMENT ====================

/**
 * GET all users with pagination and search
 */
router.get("/users", adminMiddleware, async (req, res) => {
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
router.put("/users/:id/block", adminMiddleware, async (req, res) => {
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
router.put("/users/:id/unblock", adminMiddleware, async (req, res) => {
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
router.put("/users/:id/verify", adminMiddleware, async (req, res) => {
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
router.get("/items", adminMiddleware, async (req, res) => {
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
router.put("/items/:id/approve", adminMiddleware, async (req, res) => {
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
router.put("/items/:id/reject", adminMiddleware, async (req, res) => {
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
router.delete("/items/:id", adminMiddleware, async (req, res) => {
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

// ==================== ORDER MANAGEMENT ====================

/**
 * GET all orders (admin only)
 */
router.get("/orders", adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search = "" } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }
    
    // Search by order ID or user name/email
    if (search) {
      // Assuming you have an Order model
      // This is a placeholder - you need to implement based on your Order model
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        // Add other search fields based on your Order model
      ];
    }
    
    // Placeholder response - you need to implement based on your Order model
    const orders = []; // await Order.find(query).populate("user", "name email")...
    const total = 0; // await Order.countDocuments(query);
    
    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update order status
 */
router.put("/orders/:id/status", adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Placeholder - you need to implement based on your Order model
    // const order = await Order.findById(req.params.id).populate("user");
    
    // if (!order) return res.status(404).json({ message: "Order not found" });
    
    // order.status = status;
    // await order.save();
    
    // Create notification for user
    // await Notification.create({
    //   user: order.user._id,
    //   type: "order_updated",
    //   title: "Order Status Updated",
    //   message: `Your order #${order.orderId} status has been updated to: ${status}`,
    //   relatedOrder: order._id
    // });
    
    res.json({
      message: "Order status updated successfully",
      // order: {
      //   id: order._id,
      //   orderId: order.orderId,
      //   status: order.status
      // }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN DASHBOARD ====================

/**
 * GET dashboard statistics
 */
router.get("/dashboard/stats", adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      blockedUsers,
      totalItems,
      pendingItems,
      flaggedItems,
      totalAdmins,
      // totalOrders,
      // completedOrders,
      // pendingOrders
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Item.countDocuments(),
      Item.countDocuments({ isApproved: false }),
      Item.countDocuments({ isFlagged: true }),
      User.countDocuments({ role: "admin" }),
      // Order.countDocuments(),
      // Order.countDocuments({ status: "completed" }),
      // Order.countDocuments({ status: "pending" })
    ]);
    
    res.json({
      totalUsers,
      blockedUsers,
      totalItems,
      pendingItems,
      flaggedItems,
      totalAdmins,
      // totalOrders,
      // completedOrders,
      // pendingOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== NOTIFICATION MANAGEMENT ====================

/**
 * Send system notification to all users or specific user
 */
router.post("/notifications/send", adminMiddleware, async (req, res) => {
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

/**
 * GET admin profile
 */
router.get("/profile", adminMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select("-password");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;