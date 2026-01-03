// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');

// ✅ Public routes (no auth required)
router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
router.get('/check-limit', adminController.checkAdminLimit);

// ✅ Protected routes (require admin auth)
router.get('/verify', adminMiddleware, adminController.verifyAdmin);
router.get('/profile', adminMiddleware, adminController.getAdminProfile);
router.get('/stats', adminMiddleware, adminController.getDashboardStats);

// ✅ User management
router.get('/users', adminMiddleware, adminController.getAllUsers);
router.patch('/users/:id/block', adminMiddleware, adminController.blockUser);
router.patch('/users/:id/unblock', adminMiddleware, adminController.unblockUser);

// ✅ Item management
router.get('/items', adminMiddleware, adminController.getAllItems);
router.patch('/items/:id/approve', adminMiddleware, adminController.approveItem);
router.patch('/items/:id/reject', adminMiddleware, adminController.rejectItem);
router.delete('/items/:id', adminMiddleware, adminController.deleteItem);

// ✅ Notification management
router.post('/notifications/send', adminMiddleware, adminController.sendNotification);

// ======================
// NEW NOTIFICATION ROUTES
// ======================
router.get('/notifications', adminMiddleware, adminController.getAdminNotifications);
router.get('/notifications/unread/count', adminMiddleware, adminController.getAdminUnreadCount);
router.get('/notifications/types', adminMiddleware, adminController.getNotificationTypes);
router.put('/notifications/:id/read', adminMiddleware, adminController.markAdminNotificationAsRead);
router.put('/notifications/read/all', adminMiddleware, adminController.markAllAdminNotificationsAsRead);
router.delete('/notifications/:id', adminMiddleware, adminController.deleteAdminNotification);
router.delete('/notifications', adminMiddleware, adminController.clearAllAdminNotifications);
router.post('/notifications/send-to-admin', adminMiddleware, adminController.sendAdminNotification);

module.exports = router;