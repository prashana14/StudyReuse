const User = require('../models/userModel');
const Item = require('../models/itemModel');
const Notification = require('../models/notificationModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to create admin notifications with click actions
const createAdminNotification = async (adminId, notificationData) => {
  try {
    const notification = await Notification.create({
      user: adminId,
      ...notificationData
    });
    return notification;
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};

// Helper function for time ago
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

// ✅ Check admin limit
exports.checkAdminLimit = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    
    res.json({
      success: true,
      allowed: adminCount < 5,
      currentCount: adminCount,
      maxAllowed: 5
    });
  } catch (error) {
    console.error('Check admin limit error:', error);
    res.status(500).json({ 
      success: false,
      allowed: false,
      currentCount: 0,
      maxAllowed: 5,
      message: 'Error checking admin limit'
    });
  }
};

// ✅ Admin Register - FIXED (Removed manual hashing)
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('Admin registration attempt:', { name, email });
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }
    
    // Validate SDC email domain
    const validateSDCDomain = (email) => {
      return email.endsWith('@sdc.edu.np') || email.endsWith('.ria.edu.np');
    };
    
    if (!validateSDCDomain(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Only SDC email addresses are allowed for admin registration" 
      });
    }
    
    // Check admin limit
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount >= 2) {
      return res.status(403).json({ 
        success: false,
        message: "Maximum admin limit reached (2 admins only)" 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }
    
    // ✅ FIX: Create admin with plain password - model will hash it automatically
    const admin = await User.create({
      name,
      email,
      password,  // Pass plain password
      role: "admin"
    });
    
    console.log('Admin created successfully:', admin._id);
    
    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id,
        role: admin.role,
        email: admin.email,
        isAdmin: true
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during admin registration" 
    });
  }
};

// ✅ Admin Login - FIXED (Using model's matchPassword)
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Admin login attempt:', { email });
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid admin credentials" 
      });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('User is not admin:', user.role);
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }
    
    // ✅ FIX: Use the model's matchPassword method
    const isPasswordValid = await user.matchPassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid admin credentials" 
      });
    }
    
    // Check if admin is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: "Admin account is blocked",
        reason: user.blockedReason 
      });
    }
    
    // Generate ADMIN token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email,
        isAdmin: true
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Admin login successful:', user._id);
    
    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during admin login" 
    });
  }
};

// ✅ Verify Admin Token
exports.verifyAdmin = async (req, res) => {
  try {
    // This middleware already verified the token
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized - Admin access required" 
      });
    }
    
    res.json({
      success: true,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during admin verification" 
    });
  }
};

// ✅ Get Admin Profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }
    
    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// ✅ Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      blockedUsers,
      totalItems,
      pendingItems,
      flaggedItems,
      totalAdmins,
      activeUsers,
      verifiedItems
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ isBlocked: true }),
      Item.countDocuments(),
      Item.countDocuments({ isApproved: false }),
      Item.countDocuments({ isFlagged: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isBlocked: false }),
      Item.countDocuments({ isApproved: true })
    ]);
    
    // Calculate growth (you can make this dynamic based on time range)
    const userGrowth = 0; // Implement based on previous period
    const itemGrowth = 0; // Implement based on previous period
    const revenueToday = 0; // Implement if you have orders
    const revenueGrowth = 0; // Implement if you have orders
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        blockedUsers,
        totalItems,
        pendingItems,
        flaggedItems,
        totalAdmins,
        activeUsers,
        verifiedItems,
        userGrowth,
        itemGrowth,
        revenueToday,
        revenueGrowth,
        satisfaction: 95 // Default or calculate from reviews
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching dashboard stats" 
    });
  }
};

// ✅ Get All Users (for admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;
    
    // Build query
    const query = { role: 'user' }; // Only regular users, not admins
    
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
    } else if (status === "active") {
      query.isBlocked = false;
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching users" 
    });
  }
};

// ✅ Get All Items (for admin)
exports.getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search = "" } = req.query;
    
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
      .populate('owner', 'name email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Item.countDocuments(query);
    
    res.json({
      success: true,
      items,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get all items error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching items" 
    });
  }
};

// ✅ Block User (UPDATED with clickable notifications)
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notifyOtherAdmins = false } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // Cannot block other admins
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Cannot block another admin" 
      });
    }
    
    user.isBlocked = true;
    user.blockedReason = reason;
    user.blockedAt = new Date();
    await user.save();
    
    // Create notification for user
    await Notification.create({
      user: user._id,
      type: "user_blocked",
      title: "Account Blocked",
      message: `Your account has been blocked. Reason: ${reason || "Violation of terms of service"}`,
      action: "system",
      actionData: { blockedByAdmin: true },
      isRead: false
    });
    
    // Create clickable notification for admin (current admin)
    await createAdminNotification(req.user.id, {
      type: "user_blocked",
      title: "User Blocked",
      message: `You blocked user: ${user.name}`,
      action: "view_user",
      actionData: { userId: user._id },
      link: `/admin/users?userId=${user._id}`,
      relatedUser: user._id,
      isRead: false
    });
    
    // Create notification for other admins if needed
    if (notifyOtherAdmins) {
      const otherAdmins = await User.find({ 
        role: 'admin', 
        _id: { $ne: req.user.id } 
      });
      
      for (const admin of otherAdmins) {
        await createAdminNotification(admin._id, {
          type: "admin_alert",
          title: "User Blocked by Admin",
          message: `User ${user.name} was blocked by ${req.user.name}`,
          action: "view_user",
          actionData: { userId: user._id },
          link: `/admin/users?userId=${user._id}`,
          relatedUser: user._id,
          isRead: false
        });
      }
    }
    
    res.json({
      success: true,
      message: "User blocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error blocking user" 
    });
  }
};

// ✅ Unblock User (UPDATED with clickable notifications)
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    user.isBlocked = false;
    user.blockedReason = null;
    user.blockedAt = null;
    await user.save();
    
    // Create notification for user
    await Notification.create({
      user: user._id,
      type: "user_verified",
      title: "Account Unblocked",
      message: `Your account has been unblocked. You can now access all features.`,
      action: "system",
      isRead: false
    });
    
    // Create clickable notification for admin
    await createAdminNotification(req.user.id, {
      type: "user_verified",
      title: "User Unblocked",
      message: `You unblocked user: ${user.name}`,
      action: "view_user",
      actionData: { userId: user._id },
      link: `/admin/users?userId=${user._id}`,
      relatedUser: user._id,
      isRead: false
    });
    
    res.json({
      success: true,
      message: "User unblocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error unblocking user" 
    });
  }
};

// ✅ Approve Item (UPDATED with clickable notifications)
exports.approveItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Item.findById(id).populate('owner');
    
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: "Item not found" 
      });
    }
    
    item.isApproved = true;
    item.approvedAt = new Date();
    await item.save();
    
    // Create notification for item owner
    await Notification.create({
      user: item.owner._id,
      type: "item_approved",
      title: "Item Approved",
      message: `Your item "${item.title}" has been approved and is now visible to other users.`,
      action: "view_item",
      actionData: { itemId: item._id },
      link: `/items/${item._id}`,
      relatedItem: item._id,
      isRead: false
    });
    
    // Create clickable notification for admin
    await createAdminNotification(req.user.id, {
      type: "item_approved",
      title: "Item Approved",
      message: `You approved item: "${item.title}"`,
      action: "view_item",
      actionData: { itemId: item._id },
      link: `/admin/items?itemId=${item._id}`,
      relatedItem: item._id,
      isRead: false
    });
    
    res.json({
      success: true,
      message: "Item approved successfully",
      item: {
        id: item._id,
        title: item.title,
        isApproved: item.isApproved,
        approvedAt: item.approvedAt
      }
    });
  } catch (error) {
    console.error('Approve item error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error approving item" 
    });
  }
};

// ✅ Reject/Flag Item (UPDATED with clickable notifications)
exports.rejectItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const item = await Item.findById(id).populate('owner');
    
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: "Item not found" 
      });
    }
    
    item.isFlagged = true;
    item.flagReason = reason;
    await item.save();
    
    // Create notification for item owner
    await Notification.create({
      user: item.owner._id,
      type: "item_rejected",
      title: "Item Rejected",
      message: `Your item "${item.title}" has been rejected. Reason: ${reason || "Does not meet guidelines"}`,
      action: "system",
      actionData: { itemId: item._id, rejected: true },
      relatedItem: item._id,
      isRead: false
    });
    
    // Create clickable notification for admin
    await createAdminNotification(req.user.id, {
      type: "item_rejected",
      title: "Item Rejected",
      message: `You rejected item: "${item.title}"`,
      action: "view_item",
      actionData: { itemId: item._id },
      link: `/admin/items?itemId=${item._id}`,
      relatedItem: item._id,
      isRead: false
    });
    
    res.json({
      success: true,
      message: "Item rejected successfully",
      item: {
        id: item._id,
        title: item.title,
        isFlagged: item.isFlagged,
        flagReason: item.flagReason
      }
    });
  } catch (error) {
    console.error('Reject item error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error rejecting item" 
    });
  }
};

// ✅ Delete Item (UPDATED with clickable notifications)
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const item = await Item.findById(id).populate('owner');
    
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: "Item not found" 
      });
    }
    
    // Create notification before deleting
    await Notification.create({
      user: item.owner._id,
      type: "item_deleted",
      title: "Item Removed",
      message: `Your item "${item.title}" has been removed. Reason: ${reason || "Violation of terms of service"}`,
      action: "system",
      actionData: { itemId: item._id, deleted: true },
      relatedItem: item._id,
      isRead: false
    });
    
    // Create clickable notification for admin
    await createAdminNotification(req.user.id, {
      type: "item_deleted",
      title: "Item Deleted",
      message: `You deleted item: "${item.title}"`,
      action: "system",
      isRead: false
    });
    
    await Item.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: "Item deleted successfully",
      deletedItemId: id
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error deleting item" 
    });
  }
};

// ✅ Send Notification to Users
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, userId, userType, action = "system", actionData = {}, link = null } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ 
        success: false,
        message: "Title and message are required" 
      });
    }
    
    let users = [];
    
    if (userId) {
      // Send to specific user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }
      users = [user];
    } else if (userType === 'all') {
      // Send to all users
      users = await User.find({ role: 'user' });
    } else if (userType === 'active') {
      // Send to active users
      users = await User.find({ isBlocked: false, role: 'user' });
    } else if (userType === 'admins') {
      // Send to all admins
      users = await User.find({ role: 'admin' });
    }
    
    // Create notifications with click actions
    const notifications = users.map(user => ({
      user: user._id,
      type: "system",
      title,
      message,
      action,
      actionData,
      link,
      fromAdmin: true,
      isRead: false
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.json({
      success: true,
      message: `Notification sent to ${users.length} user(s)`,
      sentTo: userId ? 'specific user' : userType === 'all' ? 'all users' : userType === 'active' ? 'active users' : 'admins'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error sending notification" 
    });
  }
};

// ======================
// NEW NOTIFICATION FUNCTIONS
// ======================

// ✅ Get Admin Notifications
exports.getAdminNotifications = async (req, res) => {
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
    
    // Build query - get notifications where admin is recipient OR admin actions
    const query = { user: req.user.id };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .populate({
        path: 'user',
        select: 'name email',
        model: User
      })
      .populate({
        path: 'relatedItem',
        select: 'title image category',
        model: Item
      })
      .populate({
        path: 'relatedUser',
        select: 'name email',
        model: User
      })
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get counts
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      ...query,
      isRead: false 
    });
    
    res.json({
      success: true,
      notifications: notifications.map(notif => ({
        ...notif,
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
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching notifications" 
    });
  }
};

// ✅ Get Admin Unread Notification Count
exports.getAdminUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id,
      isRead: false
    });
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get admin unread count error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching unread count" 
    });
  }
};

// ✅ Mark Admin Notification as Read
exports.markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id,
        user: req.user.id
      },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: "Notification not found or unauthorized" 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark admin notification as read error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error marking notification as read" 
    });
  }
};

// ✅ Mark All Admin Notifications as Read
exports.markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { 
        user: req.user.id,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all admin notifications as read error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error marking all notifications as read" 
    });
  }
};

// ✅ Delete Admin Notification
exports.deleteAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: "Notification not found or unauthorized" 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Delete admin notification error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error deleting notification" 
    });
  }
};

// ✅ Clear All Admin Notifications
exports.clearAllAdminNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.user.id
    });
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear all admin notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error clearing notifications" 
    });
  }
};

// ✅ Send Notification to Admin (for system notifications)
exports.sendAdminNotification = async (req, res) => {
  try {
    const { title, message, type = 'system', action = 'system', actionData = {}, link = null, sendToAllAdmins = false } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ 
        success: false,
        message: "Title and message are required" 
      });
    }
    
    // Create notification for current admin
    const notification = await Notification.create({
      user: req.user.id,
      type,
      title,
      message,
      action,
      actionData,
      link,
      isRead: false
    });
    
    // If needed, send to all admins
    if (sendToAllAdmins) {
      const admins = await User.find({ role: 'admin', _id: { $ne: req.user.id } });
      const adminNotifications = admins.map(admin => ({
        user: admin._id,
        type,
        title,
        message,
        action,
        actionData,
        link,
        isRead: false
      }));
      
      await Notification.insertMany(adminNotifications);
    }
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send admin notification error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error sending notification" 
    });
  }
};

// ✅ Notify admins about new user (to be called from user post-save hook)
exports.notifyNewUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.role === 'admin') return;
    
    // Get all admins
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
      await createAdminNotification(admin._id, {
        type: "new_user",
        title: "New User Registered",
        message: `New user registered: ${user.name} (${user.email})`,
        action: "view_user",
        actionData: { userId: user._id },
        link: `/admin/users?userId=${user._id}&highlight=true`,
        relatedUser: user._id,
        isRead: false
      });
    }
    
    console.log(`✅ Notified ${admins.length} admin(s) about new user: ${user.name}`);
  } catch (error) {
    console.error('Error notifying admins about new user:', error);
  }
};

// ✅ Notify admins about new item (to be called from item post-save hook)
exports.notifyNewItem = async (itemId) => {
  try {
    const item = await Item.findById(itemId).populate('owner');
    if (!item || item.isApproved || item.isFlagged) return;
    
    // Get all admins
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
      await createAdminNotification(admin._id, {
        type: "new_item",
        title: "New Item Pending Approval",
        message: `New item added: "${item.title}" by ${item.owner.name}`,
        action: "review_item",
        actionData: { itemId: item._id },
        link: `/admin/items?itemId=${item._id}&status=pending&highlight=true`,
        relatedItem: item._id,
        relatedUser: item.owner._id,
        isRead: false
      });
    }
    
    console.log(`✅ Notified ${admins.length} admin(s) about new item: ${item.title}`);
  } catch (error) {
    console.error('Error notifying admins about new item:', error);
  }
};

// ✅ Get notification types for filtering
exports.getNotificationTypes = async (req, res) => {
  try {
    const types = await Notification.distinct('type', { user: req.user.id });
    
    res.json({
      success: true,
      types: types.sort()
    });
  } catch (error) {
    console.error('Get notification types error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching notification types" 
    });
  }
};