const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  checkCartAvailability
} = require('../controller/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// ======================
// 1. Cart & Order Routes
// ======================

// Check cart availability before checkout
router.post('/check-availability', authMiddleware, checkCartAvailability);

// Create new order
router.post('/', authMiddleware, createOrder);

// Get user's orders
router.get('/my', authMiddleware, getUserOrders);

// Get specific order by ID
router.get('/:id', authMiddleware, getOrderById);

// Cancel order
router.put('/:id/cancel', authMiddleware, cancelOrder);

// ======================
// 2. Admin Routes
// ======================

// Get all orders (admin only)
router.get('/', authMiddleware, (req, res, next) => {
  // Check if user is admin
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}, getAllOrders);

// Update order status (admin only)
router.put('/:id/status', authMiddleware, (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}, updateOrderStatus);

module.exports = router;