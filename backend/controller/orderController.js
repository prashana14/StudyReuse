const Order = require('../models/orderModel');
const Item = require('../models/itemModel');

// ======================
// Helper Functions
// ======================

/**
 * Verify JWT token from request header
 */
function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('Missing authorization header');
    
    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Missing token');
    
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
}

// @desc    Create new order WITH QUANTITY VALIDATION
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const userData = verifyToken(req);
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
    const updates = []; // Store updates for item quantities
    
    for (const orderItem of items) {
      const item = itemMap.get(orderItem.item.toString());
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item ${orderItem.item} not found`
        });
      }
      
      // Check if item is available
      if (item.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: `Item "${item.title}" is not available (status: ${item.status})`
        });
      }
      
      // Check if requested quantity is available
      const requestedQuantity = parseInt(orderItem.quantity) || 1;
      const availableQuantity = item.quantity || 0;
      
      if (requestedQuantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableQuantity} units available for "${item.title}". You requested ${requestedQuantity}.`
        });
      }
      
      if (requestedQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Quantity must be at least 1 for "${item.title}"`
        });
      }
      
      // Use database price to prevent tampering
      const itemPrice = parseFloat(item.price);
      
      totalAmount += itemPrice * requestedQuantity;
      
      // Prepare item quantity update
      updates.push({
        itemId: item._id,
        newQuantity: availableQuantity - requestedQuantity,
        requestedQuantity
      });
    }

    // Add tax (8%)
    // const tax = totalAmount * 0.08;
    const finalTotal = totalAmount;

    // Start a session for transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Update item quantities
      for (const update of updates) {
        const newQuantity = update.newQuantity;
        const updateData = {
          quantity: newQuantity,
          status: newQuantity > 0 ? 'Available' : 'Sold Out'
        };
        
        await Item.findByIdAndUpdate(
          update.itemId,
          updateData,
          { session, new: true }
        );
      }

      // Create order
      const order = await Order.create([{
        user: userData.id,
        items: items.map(orderItem => {
          const item = itemMap.get(orderItem.item.toString());
          const quantity = parseInt(orderItem.quantity) || 1;
          
          return {
            item: orderItem.item,
            quantity: quantity,
            price: item.price,
            itemSnapshot: {
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              imageURL: item.imageURL || item.image
            }
          };
        }),
        totalAmount: finalTotal,
        shippingAddress,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        notes
      }], { session });

      await session.commitTransaction();
      session.endSession();

      // Populate item details in response
      const populatedOrder = await Order.findById(order[0]._id)
        .populate('items.item', 'title imageURL category condition')
        .populate('user', 'name email');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: populatedOrder
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

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
    const userData = verifyToken(req);
    
    const orders = await Order.find({ user: userData.id })
      .populate('items.item', 'title imageURL category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    
    if (error.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
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
    const userData = verifyToken(req);
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
    if (order.user._id.toString() !== userData.id.toString() && userData.role !== 'admin') {
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
    
    if (error.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
};

// @desc    Update order status WITH QUANTITY HANDLING
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userData = verifyToken(req);
    
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
    if (order.user.toString() !== userData.id && userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    const oldStatus = order.status;
    order.status = status;

    // Start a session for transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // If status changed to Cancelled, restore quantities
      if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
        for (const orderItem of order.items) {
          const item = await Item.findById(orderItem.item).session(session);
          
          if (item) {
            const newQuantity = (item.quantity || 0) + orderItem.quantity;
            await Item.findByIdAndUpdate(
              orderItem.item,
              {
                quantity: newQuantity,
                status: newQuantity > 0 ? 'Available' : 'Sold Out'
              },
              { session }
            );
          }
        }
      }
      
      // If status changed from Cancelled to something else, reduce quantities
      if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
        for (const orderItem of order.items) {
          const item = await Item.findById(orderItem.item).session(session);
          
          if (item) {
            const availableQuantity = item.quantity || 0;
            const requestedQuantity = orderItem.quantity || 1;
            
            if (requestedQuantity > availableQuantity) {
              await session.abortTransaction();
              session.endSession();
              
              return res.status(400).json({
                success: false,
                message: `Cannot change status. Only ${availableQuantity} units available for item "${item.title}". Order requires ${requestedQuantity}.`
              });
            }
            
            const newQuantity = availableQuantity - requestedQuantity;
            await Item.findByIdAndUpdate(
              orderItem.item,
              {
                quantity: newQuantity,
                status: newQuantity > 0 ? 'Available' : 'Sold Out'
              },
              { session }
            );
          }
        }
      }

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Order status updated',
        data: order
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Update order status error:', error);
    
    if (error.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

// @desc    Cancel order WITH QUANTITY RESTORATION
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== userData.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only pending or processing orders can be cancelled
    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Start a session for transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Restore item quantities
      for (const orderItem of order.items) {
        const item = await Item.findById(orderItem.item).session(session);
        
        if (item) {
          const newQuantity = (item.quantity || 0) + orderItem.quantity;
          await Item.findByIdAndUpdate(
            orderItem.item,
            {
              quantity: newQuantity,
              status: newQuantity > 0 ? 'Available' : 'Sold Out'
            },
            { session }
          );
        }
      }

      // Update order status
      order.status = 'Cancelled';
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('Cancel order error:', error);
    
    if (error.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
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
    const userData = verifyToken(req);
    
    // Check if user is admin
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
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
    
    if (error.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// @desc    Check if cart items are available
// @route   POST /api/orders/check-availability
// @access  Private
const checkCartAvailability = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const { cartItems } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        message: 'Cart items required'
      });
    }

    const results = [];
    const unavailableItems = [];
    
    for (const cartItem of cartItems) {
      const item = await Item.findById(cartItem.itemId);
      
      if (!item) {
        unavailableItems.push({
          itemId: cartItem.itemId,
          reason: 'Item not found'
        });
        continue;
      }
      
      const requestedQuantity = parseInt(cartItem.quantity) || 1;
      const availableQuantity = item.quantity || 0;
      
      const isAvailable = item.status === 'Available' && 
                         requestedQuantity <= availableQuantity;
      
      results.push({
        itemId: item._id,
        title: item.title,
        requestedQuantity,
        availableQuantity,
        isAvailable,
        price: item.price,
        status: item.status
      });
      
      if (!isAvailable) {
        unavailableItems.push({
          itemId: item._id,
          title: item.title,
          reason: availableQuantity === 0 ? 'Out of stock' : 
                 `Only ${availableQuantity} available`
        });
      }
    }

    const allAvailable = unavailableItems.length === 0;

    res.json({
      success: true,
      allAvailable,
      results,
      unavailableItems,
      message: allAvailable ? 
        'All items are available' : 
        'Some items are unavailable'
    });

  } catch (error) {
    console.error('Check availability error:', error);
    
    if (error.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error checking availability'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  checkCartAvailability
};