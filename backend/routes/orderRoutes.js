const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Add this import

// Import the controller functions
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  checkCartAvailability,
  checkCartAvailabilityPublic // If you created this
} = require('../controller/orderController');

// Import middleware - IMPORTANT: Use destructuring for protect and admin
const { protect, admin } = require('../middleware/authMiddleware');

// ======================
// 1. Cart & Order Routes
// ======================

// Test endpoint - remove auth temporarily to test
router.post('/check-availability', protect, checkCartAvailability);

// Alternative: Create a debug endpoint without auth
router.post('/check-availability-debug', async (req, res) => {
  try {
    console.log('=== DEBUG CHECK AVAILABILITY ===');
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers);
    
    // Import controller function directly
    const { checkCartAvailability } = require('../controller/orderController');
    
    // Create a mock req object with user for testing
    const mockReq = {
      ...req,
      user: { id: 'test-user-id', role: 'user' }
    };
    
    // Create a mock res object that captures the response
    const mockRes = {
      json: (data) => {
        console.log('Response data:', data);
        res.json(data);
      },
      status: (code) => {
        console.log('Status code:', code);
        return {
          json: (data) => {
            console.log('Error response:', data);
            res.status(code).json(data);
          }
        };
      }
    };
    
    await checkCartAvailability(mockReq, mockRes);
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Simple test endpoint without database
router.post('/check-availability-test', (req, res) => {
  console.log('Test request received:', req.body);
  
  // Return a mock response
  const mockResponse = {
    success: true,
    allAvailable: true,
    results: [
      {
        productId: req.body.cartItems?.[0]?.productId || 'test-id',
        title: 'Test Item',
        requestedQuantity: req.body.cartItems?.[0]?.quantity || 1,
        availableQuantity: 10,
        isAvailable: true,
        price: 99.99,
        status: 'Available'
      }
    ],
    unavailableItems: [],
    message: 'Test response - no database check performed',
    timestamp: new Date().toISOString()
  };
  
  res.json(mockResponse);
});

// Create new order
router.post('/', protect, createOrder);

// Get user's orders
router.get('/my', protect, getUserOrders);

// Get specific order by ID
router.get('/:id', protect, getOrderById);

// Cancel order
router.put('/:id/cancel', protect, cancelOrder);

// ======================
// 2. Test & Debug Routes
// ======================

// Test endpoint to verify API is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Orders API is working',
    timestamp: new Date().toISOString()
  });
});

// Get sample items from database
router.get('/sample-items', async (req, res) => {
  try {
    const Item = require('../models/itemModel');
    const items = await Item.find().limit(5).select('_id title price quantity status');
    
    res.json({
      success: true,
      count: items.length,
      items: items.map(item => ({
        _id: item._id,
        productId: item._id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        status: item.status
      }))
    });
  } catch (error) {
    console.error('Sample items error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ======================
// 3. Admin Routes (using admin middleware)
// ======================

// Get all orders (admin only) - using both protect and admin middleware
router.get('/', protect, admin, getAllOrders);

// Update order status (admin only) - using both protect and admin middleware
router.put('/:id/status', protect, admin, updateOrderStatus);

// ======================
// 4. Debug Middleware Route
// ======================

// Route to test if middleware is working
router.get('/debug/middleware', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Middleware is working',
    user: req.user
  });
});

module.exports = router;