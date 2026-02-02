const Item = require('../models/itemModel');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const NotificationService = require('../services/notificationService');

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

/**
 * Validate item data - UPDATED
 */
function validateItemData(data) {
  const errors = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  
  if (!data.price || isNaN(data.price) || parseFloat(data.price) <= 0) {
    errors.push('Price must be a positive number');
  }
  
  // ADDED: Quantity validation
  if (!data.quantity || isNaN(data.quantity) || parseInt(data.quantity) < 1) {
    errors.push('Quantity must be at least 1');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  // UPDATED: Accept more condition variations
  const validConditions = [
    'new', 'like-new', 'like new', 'like_new', 
    'good', 'fair', 'poor', 'excellent', 'mint', 'used', 'refurbished'
  ];
  if (data.condition) {
    const normalizedCondition = data.condition.toLowerCase().replace(' ', '-');
    if (!validConditions.some(cond => normalizedCondition.includes(cond.replace('-', '')))) {
      errors.push(`Condition must be one of: New, Like New, Good, Fair, Poor, Excellent, Mint, Used, Refurbished`);
    }
  }
  
  return errors;
}

/**
 * Delete image from Cloudinary
 */
async function deleteCloudinaryImage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return false;
    }
    
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicIdWithFolder = `study-reuse/${filename.split('.')[0]}`;
    
    const result = await cloudinary.uploader.destroy(publicIdWithFolder);
    
    if (result.result === 'ok') {
      console.log(`✅ Deleted Cloudinary image: ${publicIdWithFolder}`);
      return true;
    } else {
      console.log(`⚠️ Failed to delete Cloudinary image: ${result.result}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting Cloudinary image:', error.message);
    return false;
  }
}

/**
 * Build item query based on user role
 */
function buildItemQuery(userData) {
  // For ALL users (including logged-in), show only approved items
  const query = { isApproved: true, isFlagged: false };
  
  // Only exception: Admins can see all items
  if (userData?.role === 'admin') {
    return {};
  }
  
  return query;
}

/**
 * Add image URLs to items (Cloudinary URLs are already full URLs)
 */
function addImageURLs(items) {
  return items.map(item => ({
    ...item.toObject ? item.toObject() : item,
    imageURL: item.image || null // Cloudinary URLs are already full URLs
  }));
}

// ======================
// Controller Functions
// ======================

/**
 * Get all items with filtering based on user role
 */
exports.getAllItems = async (req, res) => {
  try {
    let userData = null;
    try {
      userData = verifyToken(req);
    } catch (err) {
      // Not authenticated - this is fine
    }
    
    // Build query based on user role
    const query = buildItemQuery(userData);
    
    // Get items with pagination
    const { 
      page = 1, 
      limit = 20, 
      category, 
      condition, 
      faculty,
      minPrice, 
      maxPrice, 
      sort = '-createdAt' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Add filters - UPDATED WITH FACULTY
    if (category && category !== 'all') query.category = category;
    if (condition && condition !== 'all') {
      // Normalize condition for database query
      const normalizedCondition = condition.toLowerCase().replace(' ', '-');
      query.condition = normalizedCondition;
    }
    if (faculty && faculty !== 'all') query.faculty = faculty;
    if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    
    console.log("🔍 Query filters:", query);
    
    // Execute query
    const items = await Item.find(query)
      .populate('owner', 'name email profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Item.countDocuments(query);
    
    // Add image URLs (Cloudinary URLs are already full)
    const itemsWithURL = addImageURLs(items);
    
    res.json({
      success: true,
      message: 'Items fetched successfully',
      data: {
        items: itemsWithURL,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: (parseInt(page) * parseInt(limit)) < total
        }
      }
    });
    
  } catch (err) {
    console.error('❌ Error fetching items:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching items', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Get current user's items
 */
exports.getMyItems = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query for user's items
    const query = { owner: userData.id };
    
    // Filter by status
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    if (status === 'flagged') query.isFlagged = true;
    
    // Get items
    const items = await Item.find(query)
      .populate('owner', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Item.countDocuments(query);
    
    // Add image URLs
    const itemsWithURL = addImageURLs(items);
    
    res.json({
      success: true,
      message: 'Your items fetched successfully',
      data: {
        items: itemsWithURL,
        summary: {
          total,
          approved: await Item.countDocuments({ owner: userData.id, isApproved: true }),
          pending: await Item.countDocuments({ owner: userData.id, isApproved: false }),
          flagged: await Item.countDocuments({ owner: userData.id, isFlagged: true })
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (err) {
    console.error('❌ Error fetching user items:', err);
    
    if (err.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error fetching your items'
    });
  }
};

/**
 * Get single item by ID
 */
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Item.findById(id)
      .populate('owner', 'name email profilePicture phone');
    
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }
    
    // Check if user can view the item
    let canView = true;
    let userData = null;
    
    try {
      userData = verifyToken(req);
      
      canView = userData.role === 'admin' || 
                userData.id === item.owner._id.toString() || 
                (item.isApproved && !item.isFlagged);
    } catch (err) {
      // Not logged in - can only view approved, non-flagged items
      canView = item.isApproved && !item.isFlagged;
    }
    
    if (!canView) {
      return res.status(403).json({ 
        success: false,
        message: item.isApproved === false 
          ? 'Item is pending approval' 
          : item.isFlagged === true
            ? 'Item has been flagged as inappropriate'
            : 'Access denied'
      });
    }
    
    // Cloudinary URL is already full URL
    const itemWithURL = {
      ...item.toObject ? item.toObject() : item,
      imageURL: item.image || null,
      canEdit: userData ? (userData.role === 'admin' || userData.id === item.owner._id.toString()) : false,
      canDelete: userData ? (userData.role === 'admin' || userData.id === item.owner._id.toString()) : false
    };
    
    res.json({
      success: true,
      message: 'Item fetched successfully',
      data: itemWithURL
    });
    
  } catch (err) {
    console.error(`❌ Error fetching item ${req.params.id}:`, err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error fetching item'
    });
  }
};

/**
 * Create new item with Cloudinary image upload - UPDATED
 */
exports.createItem = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    // ACCEPT ALL FIELDS from frontend including faculty
    const { 
      title, 
      description, 
      price, 
      category, 
      condition = 'good',
      faculty,
      quantity
    } = req.body;
    
    console.log("📦 Received item data:", {
      title, description, price, category, condition, faculty, quantity
    });
    console.log("🖼️ File received:", req.file ? {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      cloudinaryUrl: req.file.path
    } : "No file");
    
    // Validate required fields - UPDATED
    const errors = [];
    
    if (!title || title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    }
    
    if (!description || description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      errors.push('Price must be a positive number');
    }
    
    // ADDED: Quantity validation
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 1) {
      errors.push('Quantity must be at least 1');
    }
    
    if (!category) {
      errors.push('Category is required');
    }
    
    // UPDATED: Accept more condition variations
    const validConditions = [
      'new', 'like-new', 'like new', 'like_new', 
      'good', 'fair', 'poor', 'excellent', 'mint', 'used', 'refurbished'
    ];
    
    if (condition) {
      const normalizedCondition = condition.toLowerCase().replace(' ', '-');
      if (!validConditions.includes(normalizedCondition)) {
        errors.push(`Condition must be one of: New, Like New, Good, Fair, Poor, Excellent, Mint, Used, Refurbished`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors 
      });
    }
    
    // Check for uploaded image
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload an image of the item' 
      });
    }
    
    // Cloudinary provides the URL in req.file.path
    const cloudinaryUrl = req.file.path;
    const isAutoApproved = userData.role === 'admin';
    
    // Normalize condition for storage
    const normalizedCondition = condition.toLowerCase().replace(' ', '-');
    
    // Create item in database with Cloudinary URL - UPDATED WITH FACULTY
    const newItem = await Item.create({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category: category.trim(),
      condition: normalizedCondition,
      faculty: faculty || 'Other', // ADDED FACULTY FIELD
      image: cloudinaryUrl, // Cloudinary URL
      owner: userData.id,
      isApproved: isAutoApproved,
      isFlagged: false,
      approvedAt: isAutoApproved ? new Date() : null,
      status: parseInt(quantity) > 0 ? 'Available' : 'Sold Out'
    });
    
    // Add image URL (already full URL from Cloudinary)
    const itemWithURL = {
      ...newItem.toObject(),
      imageURL: cloudinaryUrl
    };
    
    console.log("✅ Item created successfully:", newItem._id);
    
    // Send notification if auto-approved
    if (isAutoApproved && NotificationService) {
      try {
        await NotificationService.notifyItemApproved(
          userData.id,
          newItem._id,
          newItem.title
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }
    
    res.status(201).json({
      success: true,
      message: isAutoApproved 
        ? 'Item added successfully and approved' 
        : 'Item added successfully (pending admin approval)',
      data: itemWithURL
    });
    
  } catch (err) {
    console.error('❌ Error creating item:', err);
    
    if (err.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating item',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Admin: Approve item
 */
exports.approveItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userData = verifyToken(req);
    
    // Check if user is admin
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const item = await Item.findByIdAndUpdate(
      id,
      { 
        isApproved: true,
        isFlagged: false,
        approvedAt: new Date(),
        flagReason: null
      },
      { new: true }
    ).populate('owner', 'name email');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Send notification to owner
    if (NotificationService) {
      try {
        await NotificationService.notifyItemApproved(
          item.owner._id,
          item._id,
          item.title
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }
    
    res.json({
      success: true,
      message: 'Item approved successfully',
      data: item
    });
    
  } catch (err) {
    console.error('❌ Error approving item:', err);
    res.status(500).json({
      success: false,
      message: 'Error approving item'
    });
  }
};

/**
 * Admin: Reject/Flag item
 */
exports.rejectItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const userData = verifyToken(req);
    
    // Check if user is admin
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const item = await Item.findByIdAndUpdate(
      id,
      { 
        isApproved: false,
        isFlagged: true,
        flagReason: reason,
        approvedAt: null
      },
      { new: true }
    ).populate('owner', 'name email');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Send notification to owner
    if (NotificationService) {
      try {
        await NotificationService.notifyItemRejected(
          item.owner._id,
          item._id,
          item.title,
          reason || 'No reason provided'
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }
    
    res.json({
      success: true,
      message: 'Item rejected successfully',
      data: item
    });
    
  } catch (err) {
    console.error('❌ Error rejecting item:', err);
    res.status(500).json({
      success: false,
      message: 'Error rejecting item'
    });
  }
};

/**
 * Update existing item with Cloudinary image handling - UPDATED WITH QUANTITY
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = verifyToken(req);
    
    // ACCEPT ALL FIELDS including quantity
    const { 
      title, 
      description, 
      price, 
      quantity,
      category, 
      condition,
      faculty 
    } = req.body;
    
    // Find item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }
    
    // Check authorization
    const isOwner = item.owner.toString() === userData.id;
    const isAdmin = userData.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this item' 
      });
    }
    
    // Validate data including quantity
    const validationData = {
      title: title || item.title,
      description: description || item.description,
      price: price || item.price,
      quantity: quantity !== undefined ? quantity : item.quantity, // ADDED
      category: category || item.category,
      condition: condition || item.condition
    };
    
    const errors = validateItemData(validationData);
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors 
      });
    }
    
    // Handle image update if new file uploaded
    let imageUrl = item.image;
    if (req.file) {
      // Delete old Cloudinary image if exists
      if (item.image && item.image.includes('cloudinary.com')) {
        await deleteCloudinaryImage(item.image);
      }
      
      // Set new Cloudinary URL
      imageUrl = req.file.path;
    }
    
    // Normalize condition if provided
    const normalizedCondition = condition ? condition.toLowerCase().replace(' ', '-') : item.condition;
    
    // Update item - INCLUDING QUANTITY
    const updatedData = {
      title: title ? title.trim() : item.title,
      description: description ? description.trim() : item.description,
      price: price ? parseFloat(price) : item.price,
      quantity: quantity ? parseInt(quantity) : item.quantity, // ADDED
      category: category ? category.trim() : item.category,
      condition: normalizedCondition,
      faculty: faculty !== undefined ? faculty : item.faculty,
      image: imageUrl,
      status: (quantity !== undefined ? parseInt(quantity) : item.quantity) > 0 ? 'Available' : 'Sold Out', // UPDATE STATUS
      // Reset approval if non-admin user updates the item
      ...(userData.role !== 'admin' && { 
        isApproved: false,
        approvedAt: null 
      })
    };
    
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');
    
    // Add image URL (already full URL from Cloudinary)
    const itemWithURL = {
      ...updatedItem.toObject(),
      imageURL: updatedItem.image || null
    };
    
    res.json({
      success: true,
      message: userData.role === 'admin' 
        ? 'Item updated successfully' 
        : 'Item updated successfully (pending admin approval)',
      data: itemWithURL
    });
    
  } catch (err) {
    console.error(`❌ Error updating item ${req.params.id}:`, err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating item'
    });
  }
};

/**
 * Update item quantity - NEW FUNCTION
 */
exports.updateItemQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userData = verifyToken(req);
    
    // Find item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }
    
    // Check authorization
    const isOwner = item.owner.toString() === userData.id;
    const isAdmin = userData.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update quantity of this item' 
      });
    }
    
    // Validate quantity
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Quantity must be a non-negative number' 
      });
    }
    
    const newQuantity = parseInt(quantity);
    
    // Update quantity and status
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { 
        quantity: newQuantity,
        status: newQuantity > 0 ? 'Available' : 'Sold Out'
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: `Item quantity updated to ${newQuantity}`,
      data: updatedItem
    });
    
  } catch (err) {
    console.error(`❌ Error updating item quantity ${req.params.id}:`, err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating item quantity'
    });
  }
};

/**
 * Check item availability - NEW FUNCTION
 */
exports.checkItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedQuantity = 1 } = req.body;
    
    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
        available: false
      });
    }
    
    const available = item.status === 'Available' && 
                     item.quantity >= parseInt(requestedQuantity);
    
    res.json({
      success: true,
      available,
      currentQuantity: item.quantity,
      maxAvailable: item.quantity,
      status: item.status
    });
    
  } catch (err) {
    console.error(`❌ Error checking item availability ${req.params.id}:`, err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error checking item availability'
    });
  }
};

/**
 * Update item status
 */
exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const userData = verifyToken(req);
    
    // Find item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }
    
    // Check authorization - only owner or admin can update status
    const isOwner = item.owner.toString() === userData.id;
    const isAdmin = userData.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update status of this item' 
      });
    }
    
    // Validate status
    const validStatuses = ['Available', 'Sold', 'Sold Out', 'Under Negotiation', 'Unavailable'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status value',
        validStatuses: validStatuses
      });
    }
    
    // Update status
    item.status = status;
    
    // If item is marked as sold and was approved, auto-unapprove it
    if (status === 'Sold' && item.isApproved) {
      item.isApproved = false;
      item.approvedAt = null;
    }
    
    await item.save();
    
    // Populate owner info for response
    const updatedItem = await Item.findById(id).populate('owner', 'name email');
    
    res.json({
      success: true,
      message: `Item status updated to ${status}`,
      data: updatedItem
    });
    
  } catch (err) {
    console.error(`❌ Error updating item status ${req.params.id}:`, err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating item status'
    });
  }
};

/**
 * Delete item with Cloudinary image cleanup
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = verifyToken(req);
    
    // Find item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }
    
    // Check authorization
    const isOwner = item.owner.toString() === userData.id;
    const isAdmin = userData.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this item' 
      });
    }
    
    // Delete image from Cloudinary if it exists there
    if (item.image && item.image.includes('cloudinary.com')) {
      await deleteCloudinaryImage(item.image);
    }
    
    // Delete item from database
    await Item.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: { deletedId: id }
    });
    
  } catch (err) {
    console.error(`❌ Error deleting item ${req.params.id}:`, err);
    
    if (err.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error deleting item'
    });
  }
};

/**
 * Search items - UPDATED with faculty
 */
exports.searchItems = async (req, res) => {
  try {
    const { 
      q, 
      category, 
      faculty,
      minPrice, 
      maxPrice, 
      condition, 
      sort = 'relevance' 
    } = req.query;
    
    // Build search query
    const query = { isApproved: true, isFlagged: false };
    
    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { faculty: { $regex: q, $options: "i" } } // ADDED FACULTY TO SEARCH
      ];
    }
    
    // Filters
    if (category && category !== 'all') query.category = category;
    if (faculty && faculty !== 'all') query.faculty = faculty; // ADDED FACULTY FILTER
    if (condition && condition !== 'all') {
      const normalizedCondition = condition.toLowerCase().replace(' ', '-');
      query.condition = normalizedCondition;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Execute search
    const items = await Item.find(query)
      .populate('owner', 'name email')
      .sort(sortOption)
      .limit(50);
    
    // Add image URLs
    const itemsWithURL = addImageURLs(items);
    
    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        items: itemsWithURL,
        total: items.length,
        query: { q, category, condition, faculty }
      }
    });
    
  } catch (err) {
    console.error('❌ Error searching items:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error searching items'
    });
  }
};