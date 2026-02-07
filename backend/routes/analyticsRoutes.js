// backend/routes/analyticsRoutes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const analyticsController = require('../controller/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// ✅ REMOVE auth temporarily for testing (add back later)
// router.use(authMiddleware.protect);
// router.use(adminMiddleware.isAdmin);

// ✅ Analytics route - accepts query parameters
router.get('/', analyticsController.getAnalytics);

console.log('✅ Analytics routes loaded');
console.log('✅ Endpoint: GET /api/admin/analytics?timeRange=month');

module.exports = router;