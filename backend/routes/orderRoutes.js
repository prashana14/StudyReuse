const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  checkCartAvailability
} = require('../controller/orderController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// ======================
// 1. USER ROUTES (Regular Users)
// ======================

// Cart availability check - USER ONLY
router.post('/check-availability', protect, checkCartAvailability);

// Create new order - USER ONLY
router.post('/', protect, createOrder);

// Get user's own orders - USER ONLY
router.get('/my', protect, getUserOrders);

// Get specific order by ID - USER ONLY (can view their own orders)
router.get('/:id', protect, getOrderById);

// Cancel order - USER ONLY (can cancel their own orders)
router.put('/:id/cancel', protect, cancelOrder);

// ======================
// 2. ADMIN ROUTES (Separate Admin System)
// ======================

// Get all orders (ADMIN ONLY) - using separate adminMiddleware
router.get('/', adminMiddleware, getAllOrders);

// Update order status (ADMIN ONLY) - using separate adminMiddleware
router.put('/:id/status', adminMiddleware, updateOrderStatus);

// ======================
// 3. PUBLIC ROUTES
// ======================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Orders API is operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;