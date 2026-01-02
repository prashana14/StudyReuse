const Order = require('../models/orderModel');
const Item = require('../models/itemModel');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    // Calculate total amount and validate items
    let totalAmount = 0;
    const itemIds = items.map(item => item.item);
    
    // Get all items from database
    const dbItems = await Item.find({ _id: { $in: itemIds } });
    
    // Create a map for quick lookup
    const itemMap = new Map();
    dbItems.forEach(item => itemMap.set(item._id.toString(), item));
    
    // Validate each item and calculate total
    for (const orderItem of items) {
      const item = itemMap.get(orderItem.item.toString());
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item ${orderItem.item} not found`
        });
      }
      
      if (item.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: `Item "${item.title}" is not available (status: ${item.status})`
        });
      }
      
      // Use database price to prevent tampering
      const itemPrice = parseFloat(item.price);
      const quantity = parseInt(orderItem.quantity);
      
      totalAmount += itemPrice * quantity;
    }

    // Add tax (8%)
    const tax = totalAmount * 0.08;
    const finalTotal = totalAmount + tax;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: items.map(orderItem => ({
        item: orderItem.item,
        quantity: orderItem.quantity,
        price: itemMap.get(orderItem.item.toString()).price
      })),
      totalAmount: finalTotal,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      notes
    });

    // Populate item details in response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.item', 'title imageURL category condition')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.item', 'title imageURL category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.item', 'title imageURL category condition description')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization (only admin or owner can update)
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.status = status;
    
    // If cancelled, update item status back to Available
    if (status === 'Cancelled') {
      for (const orderItem of order.items) {
        await Item.findByIdAndUpdate(orderItem.item, {
          status: 'Available'
        });
      }
    }
    
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only pending orders can be cancelled
    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    order.status = 'Cancelled';
    
    // Update item status back to Available
    for (const orderItem of order.items) {
      await Item.findByIdAndUpdate(orderItem.item, {
        status: 'Available'
      });
    }
    
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order'
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.item', 'title imageURL')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
};