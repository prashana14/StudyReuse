// backend/routes/adminRoutes.js - UPDATED FOR SEPARATE ADMIN MODEL
const express = require('express');
const router = express.Router();

// Import Admin model (not User model)
const Admin = require('../models/adminModel');

// Import adminController and adminMiddleware
const adminController = require('../controller/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Import orderController for admin order management
const orderController = require('../controller/orderController');

console.log('✅ Admin routes loading...');
console.log('Admin controller functions loaded successfully');

// ======================
// PUBLIC ROUTES (No Auth Required)
// ======================

// ✅ Admin Registration
router.post('/register', adminController.registerAdmin);

// ✅ Admin Login
router.post('/login', adminController.loginAdmin);

// ✅ Check Admin Limit
router.get('/check-limit', adminController.checkAdminLimit);

// ======================
// PROTECTED ROUTES (Admin Auth Required)
// ======================

// ✅ Admin Verification
router.get('/verify', adminMiddleware, adminController.verifyAdmin);

// ✅ Admin Profile
router.get('/profile', adminMiddleware, adminController.getAdminProfile);

// ✅ Dashboard Statistics
router.get('/dashboard/stats', adminMiddleware, adminController.getDashboardStats);

// ======================
// USER MANAGEMENT
// ======================

// ✅ Get All Users
router.get('/users', adminMiddleware, adminController.getAllUsers);

// ✅ Get User by ID
router.get('/users/:id', adminMiddleware, adminController.getUserById);

// ✅ Block User
router.patch('/users/:id/block', adminMiddleware, adminController.blockUser);

// ✅ Unblock User
router.patch('/users/:id/unblock', adminMiddleware, adminController.unblockUser);

// ======================
// ITEM MANAGEMENT
// ======================

// ✅ Approve Item
router.patch('/items/approve/:id', adminMiddleware, adminController.approveItem);

// ✅ Reject Item
router.patch('/items/reject/:id', adminMiddleware, adminController.rejectItem);

// ✅ Delete Item
router.delete('/items/delete/:id', adminMiddleware, adminController.deleteItem);

// ======================
// ORDER MANAGEMENT (ADDED)
// ======================

// ✅ Get All Orders (Admin Only)
router.get('/orders', adminMiddleware, orderController.getAllOrders);

// ✅ Get Order by ID (Admin Only)
router.get('/orders/:id', adminMiddleware, orderController.getOrderById);

// ✅ Update Order Status (Admin Only)
router.put('/orders/:id/status', adminMiddleware, orderController.updateOrderStatus);

// ======================
// NOTIFICATION MANAGEMENT
// ======================

// ✅ Send Notification to Users
router.post('/notifications/send', adminMiddleware, adminController.sendNotification);

// ✅ Get Admin Notifications
router.get('/notifications/all', adminMiddleware, adminController.getAdminNotifications);

// ✅ Get Unread Notification Count
router.get('/notifications/unread-count', adminMiddleware, adminController.getAdminUnreadCount);

// ✅ Mark Notification as Read
router.put('/notifications/mark-read/:id', adminMiddleware, adminController.markAdminNotificationAsRead);

// ✅ Mark All Notifications as Read
router.put('/notifications/mark-all-read', adminMiddleware, adminController.markAllAdminNotificationsAsRead);

// ✅ Delete Notification
router.delete('/notifications/delete/:id', adminMiddleware, adminController.deleteAdminNotification);

// ✅ Clear All Notifications
router.delete('/notifications/clear-all', adminMiddleware, adminController.clearAllAdminNotifications);

// ✅ Send Notification to Admin
router.post('/notifications/send-admin', adminMiddleware, adminController.sendAdminNotification);

// ✅ Get Notification Types
router.get('/notifications/types', adminMiddleware, adminController.getNotificationTypes);

console.log('✅ Admin routes configured successfully');

module.exports = router;