const Order = require('../models/orderModel');
const Item = require('../models/itemModel');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const jwt = require('jsonwebtoken');
const NotificationService = require('../services/notificationService');
const mongoose = require('mongoose');

// ======================
// IMPROVED Token Verification
// ======================

/**
 * Enhanced verifyToken function that handles both user and admin tokens
 */
function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No authorization header found');
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('No token found in header');
      return null;
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-for-development');
    
    // Check if it's an admin token
    if (decoded.modelType === 'admin') {
      console.log('Admin token detected:', { 
        id: decoded.id, 
        email: decoded.email,
        modelType: decoded.modelType 
      });
      return {
        id: decoded.id,
        email: decoded.email,
        role: 'admin',
        modelType: 'admin',
        isAdmin: true
      };
    }
    
    // Regular user token
    console.log('User token detected:', { 
      id: decoded.id || decoded._id, 
      email: decoded.email 
    });
    return {
      id: decoded.id || decoded._id,
      email: decoded.email,
      role: decoded.role || 'user',
      isAdmin: decoded.role === 'admin'
    };
    
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return null;
  }
}

// ======================
// ADMIN ORDER FUNCTIONS - UPDATED
// ======================

// @desc    Get all orders (Admin) - UPDATED with proper admin verification
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    console.log('=== GET ALL ORDERS REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Query params:', req.query);
    
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user is admin
    if (!userData.isAdmin && userData.role !== 'admin') {
      console.log('Non-admin user attempted to access all orders:', userData);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    console.log('Admin verified, fetching orders...');
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Search filter
    if (req.query.search) {
      query.$or = [
        { _id: { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Payment status filter
    if (req.query.paymentStatus && req.query.paymentStatus !== 'all') {
      query.paymentStatus = req.query.paymentStatus;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get total count
    const total = await Order.countDocuments(query);
    
    // Get orders with pagination and population
    const orders = await Order.find(query)
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'seller',
        select: 'name email'
      })
      .populate({
        path: 'items.item',
        select: 'title imageURL price category'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${orders.length} orders`);
    
    res.json({
      success: true,
      count: orders.length,
      total,
      data: orders,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get all orders error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const orders = await Order.find({ user: userData.id })
      .populate('items.item', 'title imageURL category')
      .populate('seller', 'name email')
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
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const order = await Order.findById(req.params.id)
      .populate('items.item', 'title imageURL category condition description')
      .populate('user', 'name email phone')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin or is seller
    const isOwner = order.user._id.toString() === userData.id.toString();
    const isSeller = order.seller._id.toString() === userData.id.toString();
    
    if (!isOwner && !isSeller && !userData.isAdmin) {
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

// @desc    Update order status WITH QUANTITY HANDLING
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('seller', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    // Update deliveredAt if status changed to Delivered
    if (status === 'Delivered' && oldStatus !== 'Delivered') {
      order.deliveredAt = new Date();
      // Auto update payment status to Paid if delivered
      if (order.paymentStatus === 'Pending') {
        order.paymentStatus = 'Paid';
      }
    }
    
    // Add admin notes if provided
    if (notes) {
      order.adminNotes = notes;
    }

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

      // Add notification for order status change
      try {
        await NotificationService.create({
          user: order.user,
          type: 'system',
          title: `Order Status Updated`,
          message: `Your order #${order._id.toString().slice(-6)} status changed to ${status}`,
          action: 'view_order',
          actionData: { orderId: order._id },
          link: `/orders/${order._id}`,
          relatedOrder: order._id,
          isRead: false
        });

        // Notify seller as well
        await NotificationService.create({
          user: order.seller._id,
          type: 'system',
          title: `Order Status Updated`,
          message: `Order #${order._id.toString().slice(-6)} status changed to ${status}`,
          action: 'view_order',
          actionData: { orderId: order._id },
          link: `/seller/orders/${order._id}`,
          relatedOrder: order._id,
          isRead: false
        });
      } catch (notifError) {
        console.error('Error creating status notification:', notifError);
      }

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
    
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, transactionId, notes } = req.body;
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    if (!['Pending', 'Paid', 'Failed', 'Refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('seller', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    
    // Add transaction ID if provided
    if (transactionId) {
      order.transactionId = transactionId;
    }
    
    // Add admin notes if provided
    if (notes) {
      order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') + 
                         `[Payment Update ${new Date().toLocaleDateString()}]: ${notes}`;
    }

    await order.save();

    // Add notification for payment status change
    try {
      await NotificationService.create({
        user: order.user._id,
        type: 'payment_update',
        title: `Payment Status Updated`,
        message: `Payment status for order #${order._id.toString().slice(-6)} changed to ${paymentStatus}`,
        action: 'view_order',
        actionData: { orderId: order._id },
        link: `/orders/${order._id}`,
        relatedOrder: order._id,
        isRead: false
      });

      // Notify seller as well
      await NotificationService.create({
        user: order.seller._id,
        type: 'payment_update',
        title: `Payment Status Updated`,
        message: `Payment status for order #${order._id.toString().slice(-6)} changed to ${paymentStatus}`,
        action: 'view_order',
        actionData: { orderId: order._id },
        link: `/seller/orders/${order._id}`,
        relatedOrder: order._id,
        isRead: false
      });
    } catch (notifError) {
      console.error('Error creating payment notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Payment status updated',
      data: order
    });
    
  } catch (error) {
    console.error('Update payment status error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error updating payment status'
    });
  }
};

// @desc    Update shipping/tracking information
// @route   PUT /api/orders/:id/shipping
// @access  Private/Admin
const updateShippingInfo = async (req, res) => {
  try {
    const { trackingNumber, carrier, estimatedDelivery, notes } = req.body;
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update shipping info
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    
    // Update status to Shipped if not already shipped
    if (order.status === 'Processing') {
      order.status = 'Shipped';
    }
    
    // Add admin notes if provided
    if (notes) {
      order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') + 
                         `[Shipping Update ${new Date().toLocaleDateString()}]: ${notes}`;
    }

    await order.save();

    // Add notification for shipping update
    try {
      await NotificationService.create({
        user: order.user._id,
        type: 'shipping_update',
        title: `Shipping Information Updated`,
        message: `Your order #${order._id.toString().slice(-6)} has been shipped${trackingNumber ? ` with tracking number: ${trackingNumber}` : ''}`,
        action: 'track_order',
        actionData: { 
          orderId: order._id,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier 
        },
        link: `/orders/${order._id}`,
        relatedOrder: order._id,
        isRead: false
      });
    } catch (notifError) {
      console.error('Error creating shipping notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Shipping information updated',
      data: order
    });
    
  } catch (error) {
    console.error('Update shipping info error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error updating shipping information'
    });
  }
};

// @desc    Cancel order WITH QUANTITY RESTORATION
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id)
      .populate('seller', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    const isOwner = order.user.toString() === userData.id;
    const isSeller = order.seller._id.toString() === userData.id;
    
    if (!isOwner && !isSeller && !userData.isAdmin) {
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
      order.sellerAction = 'rejected';
      order.cancelledReason = reason || 'Order cancelled by ' + (userData.id === order.user.toString() ? 'buyer' : 'seller');
      order.sellerRejectionReason = order.cancelledReason;
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Add notification for order cancellation
      try {
        await NotificationService.create({
          user: order.user,
          type: 'system',
          title: `Order Cancelled`,
          message: `Your order #${order._id.toString().slice(-6)} has been cancelled`,
          action: 'view_order',
          actionData: { orderId: order._id },
          link: `/orders/${order._id}`,
          relatedOrder: order._id,
          isRead: false
        });
        
        // Notify seller
        await NotificationService.create({
          user: order.seller._id,
          type: 'system',
          title: `Order Cancelled`,
          message: `Order #${order._id.toString().slice(-6)} for "${order.items[0]?.itemSnapshot?.title || 'your item'}" has been cancelled`,
          action: 'view_order',
          actionData: { orderId: order._id },
          link: `/seller/orders/${order._id}`,
          relatedOrder: order._id,
          isRead: false
        });
      } catch (notifError) {
        console.error('Error creating cancellation notification:', notifError);
      }

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
    
    res.status(500).json({
      success: false,
      message: 'Error cancelling order'
    });
  }
};

// @desc    Create new order WITH QUANTITY VALIDATION
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  console.log('=== CREATE ORDER REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Verify token
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log('User data from token:', userData);
    
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('No items in order request');
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    console.log(`Processing ${items.length} items for order`);
    
    // Calculate total amount and validate items
    let totalAmount = 0;
    const itemIds = items.map(item => item.item);
    
    console.log('Item IDs from request:', itemIds);
    
    // Get all items from database
    console.log('Fetching items from database...');
    const dbItems = await Item.find({ _id: { $in: itemIds } });
    console.log(`Found ${dbItems.length} items in database`);
    
    // Create a map for quick lookup
    const itemMap = new Map();
    dbItems.forEach(item => {
      console.log(`Item ${item._id}: ${item.title}, price: ${item.price}, quantity: ${item.quantity}, status: ${item.status}, owner: ${item.owner}`);
      itemMap.set(item._id.toString(), item);
    });
    
    // Validate each item and calculate total
    const updates = []; // Store updates for item quantities
    
    for (const orderItem of items) {
      console.log('Processing order item:', orderItem);
      
      const item = itemMap.get(orderItem.item.toString());
      
      if (!item) {
        console.log(`Item ${orderItem.item} not found in database`);
        return res.status(404).json({
          success: false,
          message: `Item ${orderItem.item} not found`
        });
      }
      
      // Check if item is available
      if (item.status !== 'Available') {
        console.log(`Item "${item.title}" is not available (status: ${item.status})`);
        return res.status(400).json({
          success: false,
          message: `Item "${item.title}" is not available (status: ${item.status})`
        });
      }
      
      // Check if requested quantity is available
      const requestedQuantity = parseInt(orderItem.quantity) || 1;
      const availableQuantity = item.quantity || 0;
      
      console.log(`Item ${item._id}: requested ${requestedQuantity}, available ${availableQuantity}`);
      
      if (requestedQuantity > availableQuantity) {
        console.log(`Insufficient stock for "${item.title}"`);
        return res.status(400).json({
          success: false,
          message: `Only ${availableQuantity} units available for "${item.title}". You requested ${requestedQuantity}.`
        });
      }
      
      if (requestedQuantity < 1) {
        console.log(`Invalid quantity for "${item.title}"`);
        return res.status(400).json({
          success: false,
          message: `Quantity must be at least 1 for "${item.title}"`
        });
      }
      
      // Use database price to prevent tampering
      const itemPrice = parseFloat(item.price);
      console.log(`Item price: ${itemPrice}, quantity: ${requestedQuantity}, subtotal: ${itemPrice * requestedQuantity}`);
      
      totalAmount += itemPrice * requestedQuantity;
      
      // Prepare item quantity update
      updates.push({
        itemId: item._id,
        newQuantity: availableQuantity - requestedQuantity,
        requestedQuantity,
        owner: item.owner
      });
    }

    console.log(`Total amount: ${totalAmount}`);
    const finalTotal = totalAmount;

    // Get the seller (owner of the first item)
    const firstItem = itemMap.get(items[0].item.toString());
    const sellerId = firstItem?.owner;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine seller'
      });
    }

    // Start a session for transaction
    console.log('Starting database transaction...');
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Update item quantities
      console.log(`Updating ${updates.length} items...`);
      for (const update of updates) {
        const newQuantity = update.newQuantity;
        const updateData = {
          quantity: newQuantity,
          status: newQuantity > 0 ? 'Available' : 'Sold Out'
        };
        
        console.log(`Updating item ${update.itemId} to quantity ${newQuantity}`);
        await Item.findByIdAndUpdate(
          update.itemId,
          updateData,
          { session, new: true }
        );
      }

      // Create order
      console.log('Creating order...');
      const orderData = {
        user: userData.id,
        seller: sellerId,
        items: items.map(orderItem => {
          const item = itemMap.get(orderItem.item.toString());
          const quantity = parseInt(orderItem.quantity) || 1;
          
          return {
            item: orderItem.item,
            sellerId: item.owner,
            quantity: quantity,
            price: item.price,
            itemStatus: 'pending',
            itemSnapshot: {
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              imageURL: item.imageURL || item.image,
              sellerId: item.owner
            }
          };
        }),
        totalAmount: finalTotal,
        shippingAddress,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        notes: notes || '',
        sellerAction: 'pending'
      };
      
      console.log('Order data to create:', orderData);
      
      const order = await Order.create([orderData], { session });

      console.log('Order created successfully:', order[0]._id);
      
      await session.commitTransaction();
      session.endSession();

      // Populate item details in response
      const populatedOrder = await Order.findById(order[0]._id)
        .populate('items.item', 'title imageURL category condition')
        .populate('user', 'name email')
        .populate('seller', 'name email');

      console.log('=== ORDER CREATED SUCCESSFULLY ===');
      console.log('Order ID:', populatedOrder._id);
      console.log('Total amount:', populatedOrder.totalAmount);
      console.log('Seller:', populatedOrder.seller?.name);
      
      // Add notifications
      try {
        // Add notification for seller (item owner)
        await NotificationService.create({
          user: sellerId,
          type: 'new_order',
          title: 'New Order Received',
          message: `${userData.name || 'A customer'} placed an order for ${populatedOrder.items.length} item(s)`,
          action: 'view_order',
          actionData: { orderId: populatedOrder._id },
          link: `/seller/orders/${populatedOrder._id}`,
          relatedOrder: populatedOrder._id,
          relatedUser: userData.id,
          isRead: false
        });

        // Add notification for buyer
        await NotificationService.create({
          user: userData.id,
          type: 'new_order',
          title: 'Order Confirmed',
          message: `Your order #${populatedOrder._id.toString().slice(-6)} has been placed successfully`,
          action: 'view_order',
          actionData: { orderId: populatedOrder._id },
          link: `/orders/${populatedOrder._id}`,
          relatedOrder: populatedOrder._id,
          isRead: false
        });
        
        console.log('✅ Notifications created for order');
      } catch (notifError) {
        console.error('❌ Error creating notifications:', notifError);
        // Don't fail the order if notifications fail
      }
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: populatedOrder
      });

    } catch (error) {
      console.error('Transaction error:', error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('=== ORDER CREATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
        error: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Check if cart items are available
// @route   POST /api/orders/check-availability
// @access  Private
const checkCartAvailability = async (req, res) => {
  try {
    console.log('=== CHECK AVAILABILITY REQUEST ===');
    console.log('Request body:', req.body);
    
    // Verify token (with fallback for debugging)
    let userData = verifyToken(req);
    
    if (!userData) {
      console.log('No valid token, proceeding with fallback');
      userData = { id: 'fallback-user', role: 'user' };
    }
    
    const { cartItems } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      console.log('Invalid cart items:', cartItems);
      return res.status(400).json({
        success: false,
        message: 'Cart items required and must be an array',
        allAvailable: false,
        unavailableItems: [],
        results: []
      });
    }

    console.log(`Processing ${cartItems.length} cart items`);
    
    const results = [];
    const unavailableItems = [];
    
    for (const cartItem of cartItems) {
      try {
        // Support multiple field names for flexibility
        const itemId = cartItem.productId || cartItem.itemId || cartItem._id || cartItem.item;
        
        if (!itemId) {
          console.log('Missing ID for cart item:', cartItem);
          unavailableItems.push({
            productId: 'unknown',
            reason: 'Missing item ID',
            requestedQuantity: cartItem.quantity || 1
          });
          results.push({
            productId: 'unknown',
            title: 'Unknown Item',
            requestedQuantity: cartItem.quantity || 1,
            availableQuantity: 0,
            isAvailable: false,
            available: false,
            price: 0,
            status: 'Unknown'
          });
          continue;
        }

        console.log(`Looking for item with ID: ${itemId}, quantity: ${cartItem.quantity || 1}`);
        
        const item = await Item.findById(itemId);
        
        if (!item) {
          console.log('Item not found:', itemId);
          unavailableItems.push({
            productId: itemId,
            reason: 'Item not found',
            requestedQuantity: cartItem.quantity || 1
          });
          results.push({
            productId: itemId,
            title: 'Item Not Found',
            requestedQuantity: cartItem.quantity || 1,
            availableQuantity: 0,
            isAvailable: false,
            available: false,
            price: 0,
            status: 'Not Found'
          });
          continue;
        }
        
        const requestedQuantity = parseInt(cartItem.quantity) || 1;
        const availableQuantity = item.quantity || 0;
        
        console.log(`Item ${itemId}: requested ${requestedQuantity}, available ${availableQuantity}, status ${item.status}`);
        
        const isAvailable = item.status === 'Available' && 
                           requestedQuantity <= availableQuantity;
        
        results.push({
          productId: item._id.toString(),
          itemId: item._id.toString(),
          title: item.title || 'Untitled Item',
          requestedQuantity,
          availableQuantity,
          isAvailable,
          available: isAvailable, // Duplicate for compatibility
          price: item.price || 0,
          status: item.status,
          imageURL: item.imageURL || item.image || null,
          sellerId: item.owner
        });
        
        if (!isAvailable) {
          unavailableItems.push({
            productId: item._id.toString(),
            itemId: item._id.toString(),
            title: item.title || 'Untitled Item',
            reason: availableQuantity === 0 ? 'Out of stock' : 
                   `Only ${availableQuantity} available (requested ${requestedQuantity})`,
            availableQuantity,
            requestedQuantity
          });
        }
        
      } catch (itemError) {
        console.error(`Error processing cart item:`, itemError);
        unavailableItems.push({
          productId: cartItem.productId || cartItem.itemId || 'unknown',
          reason: 'Error checking availability'
        });
      }
    }

    const allAvailable = unavailableItems.length === 0;

    const response = {
      success: true,
      allAvailable,
      results,
      unavailableItems,
      message: allAvailable ? 
        'All items are available' : 
        'Some items are unavailable',
      timestamp: new Date().toISOString()
    };

    console.log('=== CHECK AVAILABILITY RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));

    res.json(response);

  } catch (error) {
    console.error('=== CHECK AVAILABILITY ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Return a safe response that won't break frontend
    res.status(500).json({
      success: false,
      allAvailable: false,
      results: [],
      unavailableItems: [],
      message: 'Error checking availability. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Check cart availability (Public version for testing)
// @route   POST /api/orders/check-availability-public
// @access  Public
const checkCartAvailabilityPublic = async (req, res) => {
  try {
    console.log('=== PUBLIC CHECK AVAILABILITY REQUEST ===');
    console.log('Body:', req.body);
    
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
      // Support multiple field names
      const itemId = cartItem.productId || cartItem.itemId || cartItem._id;
      
      if (!itemId) {
        unavailableItems.push({
          itemId: 'unknown',
          reason: 'Missing item ID'
        });
        continue;
      }
      
      const item = await Item.findById(itemId);
      
      if (!item) {
        unavailableItems.push({
          itemId: itemId,
          reason: 'Item not found'
        });
        continue;
      }
      
      const requestedQuantity = parseInt(cartItem.quantity) || 1;
      const availableQuantity = item.quantity || 0;
      
      const isAvailable = item.status === 'Available' && 
                         requestedQuantity <= availableQuantity;
      
      results.push({
        productId: item._id,
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
          productId: item._id,
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
    console.error('Public check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability'
    });
  }
};

// ======================
// SELLER ORDER FUNCTIONS - NEW
// ======================

// @desc    Get orders where user is seller
// @route   GET /api/orders/seller/my
// @access  Private (Seller)
const getSellerOrders = async (req, res) => {
  try {
    console.log('=== GET SELLER ORDERS REQUEST ===');
    
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const sellerId = userData.id;
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query - orders where user is seller
    const query = { seller: sellerId };
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Seller action filter
    if (req.query.sellerAction && req.query.sellerAction !== 'all') {
      query.sellerAction = req.query.sellerAction;
    }
    
    // Get total count
    const total = await Order.countDocuments(query);
    
    // Get orders with pagination
    const orders = await Order.find(query)
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'items.item',
        select: 'title imageURL price category'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${orders.length} orders for seller ${sellerId}`);
    
    res.json({
      success: true,
      count: orders.length,
      total,
      data: orders,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get seller orders error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching seller orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Seller accepts an order
// @route   PUT /api/orders/:id/seller/accept
// @access  Private (Seller)
const acceptOrderBySeller = async (req, res) => {
  try {
    console.log('=== SELLER ACCEPT ORDER REQUEST ===');
    
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const orderId = req.params.id;
    const sellerId = userData.id;
    
    console.log(`Seller ${sellerId} accepting order ${orderId}`);
    
    // Find the order
    const order = await Order.findById(orderId)
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Verify seller is the actual seller
    if (order.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. You are not the seller of this order.'
      });
    }
    
    // Check if order is in pending status
    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept order with status: ${order.status}`
      });
    }
    
    // Check if seller already took action
    if (order.sellerAction !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Seller already ${order.sellerAction} this order`
      });
    }
    
    // Update order
    order.sellerAction = 'accepted';
    order.sellerActionAt = new Date();
    order.status = 'Processing'; // Move to processing after seller acceptance
    await order.save();
    
    // Update item statuses
    for (const item of order.items) {
      item.itemStatus = 'accepted';
    }
    await order.save();
    
    // Create notification for buyer
    try {
      await NotificationService.create({
        user: order.user._id,
        type: 'order_update',
        title: 'Order Accepted by Seller',
        message: `Seller has accepted your order #${order._id.toString().slice(-6)}`,
        action: 'view_order',
        actionData: { orderId: order._id },
        link: `/orders/${order._id}`,
        relatedOrder: order._id,
        isRead: false
      });
      
      // Also create system notification
      await NotificationService.create({
        user: order.user._id,
        type: 'system',
        title: 'Order Status Updated',
        message: `Your order has been accepted by the seller and is now being processed`,
        action: 'view_order',
        actionData: { orderId: order._id },
        link: `/orders/${order._id}`,
        relatedOrder: order._id,
        isRead: false
      });
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
    }
    
    console.log(`Order ${orderId} accepted by seller ${sellerId}`);
    
    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: order
    });
    
  } catch (error) {
    console.error('Seller accept order error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error accepting order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Seller rejects an order
// @route   PUT /api/orders/:id/seller/reject
// @access  Private (Seller)
const rejectOrderBySeller = async (req, res) => {
  try {
    console.log('=== SELLER REJECT ORDER REQUEST ===');
    
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const { reason } = req.body;
    const orderId = req.params.id;
    const sellerId = userData.id;
    
    console.log(`Seller ${sellerId} rejecting order ${orderId}, reason: ${reason}`);
    
    // Find the order
    const order = await Order.findById(orderId)
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Verify seller is the actual seller
    if (order.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. You are not the seller of this order.'
      });
    }
    
    // Check if order is in pending status
    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject order with status: ${order.status}`
      });
    }
    
    // Check if seller already took action
    if (order.sellerAction !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Seller already ${order.sellerAction} this order`
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
      
      // Update order
      order.sellerAction = 'rejected';
      order.sellerActionAt = new Date();
      order.sellerRejectionReason = reason || 'Seller rejected the order';
      order.status = 'Cancelled';
      await order.save({ session });
      
      // Update item statuses
      for (const item of order.items) {
        item.itemStatus = 'rejected';
      }
      await order.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      // Create notification for buyer
      try {
        await NotificationService.create({
          user: order.user._id,
          type: 'order_update',
          title: 'Order Rejected by Seller',
          message: `Seller has rejected your order #${order._id.toString().slice(-6)}${reason ? `: ${reason}` : ''}`,
          action: 'view_order',
          actionData: { orderId: order._id },
          link: `/orders/${order._id}`,
          relatedOrder: order._id,
          isRead: false
        });
        
        // Also create system notification
        await NotificationService.create({
          user: order.user._id,
          type: 'system',
          title: 'Order Cancelled',
          message: `Your order has been rejected by the seller`,
          action: 'view_order',
          actionData: { orderId: order._id },
          link: `/orders/${order._id}`,
          relatedOrder: order._id,
          isRead: false
        });
      } catch (notifError) {
        console.error('Error creating notifications:', notifError);
      }
      
      console.log(`Order ${orderId} rejected by seller ${sellerId}`);
      
      res.json({
        success: true,
        message: 'Order rejected successfully',
        data: order
      });
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('Seller reject order error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error rejecting order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get seller order statistics
// @route   GET /api/orders/seller/stats
// @access  Private (Seller)
const getSellerOrderStats = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const sellerId = userData.id;
    
    console.log(`📊 Fetching stats for seller: ${sellerId}`);
    
    // Get counts for different statuses
    const pendingOrders = await Order.countDocuments({ 
      seller: sellerId, 
      status: 'Pending',
      sellerAction: 'pending'
    });
    
    const acceptedOrders = await Order.countDocuments({ 
      seller: sellerId, 
      sellerAction: 'accepted'
    });
    
    const rejectedOrders = await Order.countDocuments({ 
      seller: sellerId, 
      sellerAction: 'rejected'
    });
    
    const processingOrders = await Order.countDocuments({ 
      seller: sellerId, 
      status: 'Processing'
    });
    
    const shippedOrders = await Order.countDocuments({ 
      seller: sellerId, 
      status: 'Shipped'
    });
    
    const deliveredOrders = await Order.countDocuments({ 
      seller: sellerId, 
      status: 'Delivered'
    });
    
    const totalOrders = await Order.countDocuments({ seller: sellerId });
    
    // Calculate total revenue - FIXED: Added 'new' keyword
    const revenueResult = await Order.aggregate([
      { 
        $match: { 
          seller: new mongoose.Types.ObjectId(sellerId), 
          status: 'Delivered' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$totalAmount' } 
        } 
      }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    console.log(`📊 Seller stats for ${sellerId}:`, {
      pendingOrders,
      acceptedOrders,
      rejectedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalOrders,
      totalRevenue
    });
    
    res.json({
      success: true,
      data: {
        pendingOrders,
        acceptedOrders,
        rejectedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        totalOrders,
        totalRevenue
      }
    });
    
  } catch (error) {
    console.error('❌ Get seller stats error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching seller statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Alternative simplified version (without aggregation)
// @desc    Get seller order statistics (SIMPLIFIED VERSION)
// @route   GET /api/orders/seller/stats-simple
// @access  Private (Seller)
const getSellerOrderStatsSimple = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const sellerId = userData.id;
    
    console.log(`📊 Fetching simplified stats for seller: ${sellerId}`);
    
    // Get all delivered orders first (for revenue calculation)
    const deliveredOrders = await Order.find({ 
      seller: sellerId, 
      status: 'Delivered' 
    });
    
    // Calculate total revenue manually
    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0);
    }, 0);
    
    // Get counts for different statuses
    const pendingOrders = await Order.countDocuments({ 
      seller: sellerId, 
      status: 'Pending',
      sellerAction: 'pending'
    });
    
    const acceptedOrders = await Order.countDocuments({ 
      seller: sellerId, 
      sellerAction: 'accepted'
    });
    
    const rejectedOrders = await Order.countDocuments({ 
      seller: sellerId, 
      sellerAction: 'rejected'
    });
    
    const processingOrders = await Order.countDocuments({ 
      seller: sellerId, 
      status: 'Processing'
    });
    
    const shippedOrders = await Order.countDocuments({ 
      seller: sellerId, 
      status: 'Shipped'
    });
    
    const deliveredCount = deliveredOrders.length;
    
    const totalOrders = await Order.countDocuments({ seller: sellerId });
    
    console.log(`📊 Simplified seller stats for ${sellerId}:`, {
      pendingOrders,
      acceptedOrders,
      rejectedOrders,
      processingOrders,
      shippedOrders,
      deliveredCount,
      totalOrders,
      totalRevenue
    });
    
    res.json({
      success: true,
      data: {
        pendingOrders,
        acceptedOrders,
        rejectedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders: deliveredCount,
        totalOrders,
        totalRevenue
      }
    });
    
  } catch (error) {
    console.error('❌ Get simplified seller stats error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching seller statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// ADMIN ANALYTICS & MANAGEMENT FUNCTIONS - NEW
// ======================

// @desc    Get admin dashboard statistics
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
const getAdminOrderStats = async (req, res) => {
  try {
    console.log('=== GET ADMIN ORDER STATS REQUEST ===');
    
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get counts for different statuses
    const [
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Processing' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.countDocuments(),
      // Calculate total revenue from delivered orders
      Order.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);
    
    // Calculate revenue metrics
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Today's revenue
    const todayRevenueResult = await Order.aggregate([
      { 
        $match: { 
          status: 'Delivered',
          deliveredAt: { $gte: startOfToday }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' } 
        } 
      }
    ]);
    
    const todayRevenue = todayRevenueResult[0]?.total || 0;
    
    // This month's revenue
    const monthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          status: 'Delivered',
          deliveredAt: { $gte: startOfMonth }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' } 
        } 
      }
    ]);
    
    const monthRevenue = monthRevenueResult[0]?.total || 0;
    
    // Payment status counts
    const paymentPendingCount = await Order.countDocuments({ paymentStatus: 'Pending' });
    const paymentPaidCount = await Order.countDocuments({ paymentStatus: 'Paid' });
    const paymentFailedCount = await Order.countDocuments({ paymentStatus: 'Failed' });
    const paymentRefundedCount = await Order.countDocuments({ paymentStatus: 'Refunded' });
    
    // Average order value
    const avgOrderValue = deliveredCount > 0 ? (totalRevenue / deliveredCount) : 0;
    
    console.log('📊 Admin order stats calculated:', {
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      totalOrders,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      avgOrderValue
    });
    
    res.json({
      success: true,
      data: {
        orderCounts: {
          pending: pendingCount,
          processing: processingCount,
          shipped: shippedCount,
          delivered: deliveredCount,
          cancelled: cancelledCount,
          total: totalOrders
        },
        paymentStatus: {
          pending: paymentPendingCount,
          paid: paymentPaidCount,
          failed: paymentFailedCount,
          refunded: paymentRefundedCount
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          month: monthRevenue,
          avgOrderValue: avgOrderValue.toFixed(2)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Get admin order stats error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching admin statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get revenue report with date filtering
// @route   GET /api/orders/admin/revenue-report
// @access  Private/Admin
const getRevenueReport = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30);
    
    const matchStage = {
      $match: {
        status: 'Delivered',
        deliveredAt: {
          $gte: start,
          $lte: end
        }
      }
    };
    
    let groupStage;
    let sortStage;
    
    if (groupBy === 'day') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$deliveredAt' },
            month: { $month: '$deliveredAt' },
            day: { $dayOfMonth: '$deliveredAt' }
          },
          date: { $first: '$deliveredAt' },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      };
      sortStage = { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } };
    } else if (groupBy === 'month') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$deliveredAt' },
            month: { $month: '$deliveredAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      };
      sortStage = { $sort: { '_id.year': 1, '_id.month': 1 } };
    } else if (groupBy === 'category') {
      // Need to populate items first
      const orders = await Order.find({
        status: 'Delivered',
        deliveredAt: { $gte: start, $lte: end }
      }).populate('items.item', 'category');
      
      const categoryRevenue = {};
      
      orders.forEach(order => {
        order.items.forEach(item => {
          const category = item.item?.category || 'Uncategorized';
          if (!categoryRevenue[category]) {
            categoryRevenue[category] = {
              revenue: 0,
              orders: 0,
              items: 0
            };
          }
          const itemRevenue = (item.price || 0) * (item.quantity || 1);
          categoryRevenue[category].revenue += itemRevenue;
          categoryRevenue[category].orders += 1;
          categoryRevenue[category].items += item.quantity || 1;
        });
      });
      
      const result = Object.entries(categoryRevenue).map(([category, data]) => ({
        _id: category,
        ...data,
        avgOrderValue: data.revenue / data.orders
      }));
      
      return res.json({
        success: true,
        data: result,
        summary: {
          startDate: start,
          endDate: end,
          totalRevenue: result.reduce((sum, item) => sum + item.revenue, 0),
          totalOrders: result.reduce((sum, item) => sum + item.orders, 0)
        }
      });
    }
    
    const revenueData = await Order.aggregate([
      matchStage,
      groupStage,
      sortStage
    ]);
    
    // Format dates for day grouping
    if (groupBy === 'day') {
      revenueData.forEach(item => {
        item.formattedDate = new Date(item._id.year, item._id.month - 1, item._id.day)
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
    } else if (groupBy === 'month') {
      revenueData.forEach(item => {
        item.formattedDate = new Date(item._id.year, item._id.month - 1)
          .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      });
    }
    
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = revenueData.reduce((sum, item) => sum + item.orders, 0);
    
    res.json({
      success: true,
      data: revenueData,
      summary: {
        startDate: start,
        endDate: end,
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      }
    });
    
  } catch (error) {
    console.error('❌ Get revenue report error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get top selling items
// @route   GET /api/orders/admin/top-items
// @access  Private/Admin
const getTopSellingItems = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { limit = 10, startDate, endDate } = req.query;
    
    const matchConditions = { status: 'Delivered' };
    
    if (startDate && endDate) {
      matchConditions.deliveredAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const topItems = await Order.aggregate([
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.item',
          itemSnapshot: { $first: '$items.itemSnapshot' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          title: '$itemSnapshot.title',
          imageURL: '$itemSnapshot.imageURL',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1,
          avgPrice: { $divide: ['$totalRevenue', '$totalQuantity'] }
        }
      }
    ]);
    
    // Populate item details for items that still exist
    for (let item of topItems) {
      if (item._id) {
        const dbItem = await Item.findById(item._id).select('title imageURL category');
        if (dbItem) {
          item.title = dbItem.title;
          item.imageURL = dbItem.imageURL;
          item.category = dbItem.category;
        }
      }
    }
    
    res.json({
      success: true,
      data: topItems
    });
    
  } catch (error) {
    console.error('❌ Get top selling items error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching top selling items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get top selling sellers
// @route   GET /api/orders/admin/top-sellers
// @access  Private/Admin
const getTopSellers = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { limit = 10, startDate, endDate } = req.query;
    
    const matchConditions = { status: 'Delivered' };
    
    if (startDate && endDate) {
      matchConditions.deliveredAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const topSellers = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$seller',
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    // Populate seller details
    for (let seller of topSellers) {
      if (seller._id) {
        const sellerDetails = await User.findById(seller._id).select('name email phone');
        if (sellerDetails) {
          seller.name = sellerDetails.name;
          seller.email = sellerDetails.email;
          seller.phone = sellerDetails.phone;
        }
      }
    }
    
    res.json({
      success: true,
      data: topSellers
    });
    
  } catch (error) {
    console.error('❌ Get top sellers error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching top sellers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk update order status
// @route   PUT /api/orders/admin/bulk-update
// @access  Private/Admin
const bulkUpdateOrders = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { orderIds, status, notes } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs are required'
      });
    }
    
    if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Start a session for transaction
    const session = await Order.startSession();
    session.startTransaction();
    
    try {
      const results = {
        updated: 0,
        failed: 0,
        details: []
      };
      
      for (const orderId of orderIds) {
        try {
          const order = await Order.findById(orderId).session(session);
          
          if (!order) {
            results.failed++;
            results.details.push({
              orderId,
              success: false,
              message: 'Order not found'
            });
            continue;
          }
          
          const oldStatus = order.status;
          order.status = status;
          
          // Update deliveredAt if status changed to Delivered
          if (status === 'Delivered' && oldStatus !== 'Delivered') {
            order.deliveredAt = new Date();
          }
          
          // Handle quantity restoration for cancellations
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
          
          // Add admin notes if provided
          if (notes) {
            order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') + 
                               `[Bulk Update ${new Date().toLocaleDateString()}]: ${notes}`;
          }
          
          await order.save({ session });
          
          // Create notification
          try {
            await NotificationService.create({
              user: order.user,
              type: 'system',
              title: `Order Status Updated`,
              message: `Your order #${order._id.toString().slice(-6)} status changed to ${status}`,
              action: 'view_order',
              actionData: { orderId: order._id },
              link: `/orders/${order._id}`,
              relatedOrder: order._id,
              isRead: false
            });
          } catch (notifError) {
            console.error(`Error creating notification for order ${orderId}:`, notifError);
          }
          
          results.updated++;
          results.details.push({
            orderId,
            success: true,
            message: `Status updated from ${oldStatus} to ${status}`
          });
          
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error);
          results.failed++;
          results.details.push({
            orderId,
            success: false,
            message: error.message
          });
        }
      }
      
      await session.commitTransaction();
      session.endSession();
      
      res.json({
        success: true,
        message: `Bulk update completed: ${results.updated} updated, ${results.failed} failed`,
        data: results
      });
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Bulk update orders error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error performing bulk update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Export orders to CSV/Excel
// @route   GET /api/orders/admin/export
// @access  Private/Admin
const exportOrders = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    if (!userData || !userData.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { format = 'csv', startDate, endDate } = req.query;
    
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('seller', 'name email')
      .populate('items.item', 'title')
      .sort({ createdAt: -1 });
    
    // Prepare CSV data
    if (format === 'csv') {
      const csvData = [
        ['Order ID', 'Date', 'Customer', 'Seller', 'Status', 'Payment Status', 'Total Amount', 'Items', 'Shipping Address']
      ];
      
      orders.forEach(order => {
        const items = order.items.map(item => 
          `${item.item?.title || 'N/A'} (x${item.quantity})`
        ).join('; ');
        
        const shipping = order.shippingAddress ? 
          `${order.shippingAddress.fullName}, ${order.shippingAddress.city}` : 
          'N/A';
        
        csvData.push([
          order._id.toString(),
          order.createdAt.toISOString().split('T')[0],
          order.user?.name || 'N/A',
          order.seller?.name || 'N/A',
          order.status,
          order.paymentStatus,
          order.totalAmount,
          items,
          shipping
        ]);
      });
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
      
    } else {
      // For JSON export
      res.json({
        success: true,
        data: orders,
        count: orders.length,
        exportedAt: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Export orders error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error exporting orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateShippingInfo,
  cancelOrder,
  getAllOrders,
  checkCartAvailability,
  checkCartAvailabilityPublic,
  // SELLER FUNCTIONS
  getSellerOrders,
  acceptOrderBySeller,
  rejectOrderBySeller,
  getSellerOrderStats,
  getSellerOrderStatsSimple,
  // ADMIN ANALYTICS FUNCTIONS
  getAdminOrderStats,
  getRevenueReport,
  getTopSellingItems,
  getTopSellers,
  bulkUpdateOrders,
  exportOrders
};