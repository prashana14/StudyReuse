const path = require('path');
const fs = require('fs');
const Item = require('../models/itemModel');
const jwt = require('jsonwebtoken');
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
    console.error('Token verification failed:', error.message);
    throw error;
  }
}

/**
 * Validate item data
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
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  // Validate condition if provided
  const validConditions = ['new', 'like_new', 'good', 'fair', 'needs_repair'];
  if (data.condition && !validConditions.includes(data.condition)) {
    errors.push(`Condition must be one of: ${validConditions.join(', ')}`);
  }
  
  return errors;
}

/**
 * Delete image file from uploads folder
 */
async function deleteImageFile(imagePath) {
  try {
    if (imagePath && imagePath.startsWith('/uploads/')) {
      const filename = path.basename(imagePath);
      const fullPath = path.join(__dirname, '..', 'uploads', filename);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Deleted image file: ${filename}`);
        return true;
      } else {
        console.log(`⚠️ Image file not found: ${filename}`);
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('Error deleting image file:', error.message);
    return false;
  }
}

/**
 * Build item query based on user role
 */
function buildItemQuery(userData) {
  if (userData?.role === 'admin') {
    return {}; // Admins see all items
  }
  
  if (userData) {
    return { 
      $or: [
        { isApproved: true, isFlagged: false },
        { owner: userData.id } // Users can see their own items even if not approved
      ]
    };
  }
  
  // Non-logged in users see only approved, non-flagged items
  return { isApproved: true, isFlagged: false };
}

/**
 * Add full image URL to items
 */
function addImageURLs(items, req) {
  return items.map(item => ({
    ...item.toObject ? item.toObject() : item,
    imageURL: item.image 
      ? `${req.protocol}://${req.get('host')}${item.image}`
      : null
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
    // console.log('📋 GET /items - Fetching all items');
    
    let userData = null;
    try {
      userData = verifyToken(req);
      // console.log(`👤 User authenticated: ${userData.id} (${userData.role})`);
    } catch (err) {
      console.log('👤 No user authenticated');
    }
    
    // Build query based on user role
    const query = buildItemQuery(userData);
    // console.log('🔍 Query:', query);
    
    // Get items with pagination
    const { page = 1, limit = 20, category, condition, minPrice, maxPrice, sort = '-createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Add filters
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    
    // Execute query
    const items = await Item.find(query)
      .populate('owner', 'name email profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Item.countDocuments(query);
    
    // Add image URLs
    const itemsWithURL = addImageURLs(items, req);
    
    // console.log(`✅ Found ${items.length} items`);
    
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
    // console.log('📋 GET /items/my - Fetching user items');
    
    const userData = verifyToken(req);
    // console.log(`👤 User: ${userData.id}`);
    
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
    const itemsWithURL = addImageURLs(items, req);
    
    // console.log(`✅ Found ${items.length} items for user ${userData.id}`);
    
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
      message: 'Error fetching your items', 
      error: err.message 
    });
  }
};

/**
 * Get single item by ID - FIXED VERSION (403 Issue Resolved)
 */
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    //console.log(`📋 GET /items/${id} - Fetching item details`);
    
    const item = await Item.findById(id)
      .populate('owner', 'name email profilePicture phone');
    
    if (!item) {
      console.log(`❌ Item ${id} not found`);
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }
    
    // FIXED: Check if user can view the item
    let canView = true;
    let userData = null;
    
    try {
      userData = verifyToken(req);
      //console.log(`👤 Authenticated user: ${userData.id} (${userData.role})`);
      
      // User is authenticated - can view if:
      // 1. They are admin OR
      // 2. They are the owner OR  
      // 3. The item is approved and not flagged
      canView = userData.role === 'admin' || 
                userData.id === item.owner._id.toString() || 
                (item.isApproved && !item.isFlagged);
    } catch (err) {
      // Not logged in - can only view approved, non-flagged items
      console.log('👤 Not authenticated - checking public access');
      canView = item.isApproved && !item.isFlagged;
    }
    
    if (!canView) {
      console.log(`⛔ Access denied for item ${id}`);
      console.log(`   Item status: approved=${item.isApproved}, flagged=${item.isFlagged}`);
      return res.status(403).json({ 
        success: false,
        message: item.isApproved === false 
          ? 'Item is pending approval' 
          : item.isFlagged === true
            ? 'Item has been flagged as inappropriate'
            : 'Access denied'
      });
    }
    
    // Add image URL
    const itemWithURL = {
  ...item.toObject ? item.toObject() : item, // Ensure we get plain object
  imageURL: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null,
  canEdit: userData ? (userData.role === 'admin' || userData.id === item.owner._id.toString()) : false,
  canDelete: userData ? (userData.role === 'admin' || userData.id === item.owner._id.toString()) : false
};
    
//     console.log(`✅ Item ${id} fetched successfully:`, {
//   title: itemWithURL.title,
//   isApproved: itemWithURL.isApproved,
//   imageURL: itemWithURL.imageURL
// });
    // Add this debugging code BEFORE the res.json()
// console.log('🔍 DEBUG - Item data structure:', {
//   itemId: item._id,
//   title: item.title,
//   isApproved: item.isApproved,
//   isFlagged: item.isFlagged,
//   image: item.image,
//   imageURL: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null,
//   itemWithURL: {
//     ...item.toObject(),
//     imageURL: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null
//   }
// });

// console.log('🔍 DEBUG - Final response data structure:', {
//   success: true,
//   message: 'Item fetched successfully',
//   data: {
//     ...itemWithURL,
//     canEdit: userData ? (userData.role === 'admin' || userData.id === item.owner._id.toString()) : false,
//     canDelete: userData ? (userData.role === 'admin' || userData.id === item.owner._id.toString()) : false
//   }
// });
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
      message: 'Error fetching item', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Create new item with image upload
 */
exports.createItem = async (req, res) => {
  try {
    console.log('📋 POST /items - Creating new item');
    
    const userData = verifyToken(req);
    console.log(`👤 Creating item for user: ${userData.id} (${userData.role})`);
    
    const { title, description, price, category, condition = 'good' } = req.body;
    
    console.log('📦 Request data:', {
      hasFile: !!req.file,
      file: req.file ? req.file.originalname : 'none',
      body: { title, category, price, condition }
    });
    
    // Validate required fields
    const validationErrors = validateItemData({ title, description, price, category, condition });
    if (validationErrors.length > 0) {
      console.log('❌ Validation errors:', validationErrors);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    // Check for uploaded image
    if (!req.file) {
      console.log('❌ No image uploaded');
      return res.status(400).json({ 
        success: false,
        message: 'Please upload an image of the item' 
      });
    }
    
    // Log file details
    const file = req.file;
    console.log('📸 File uploaded:', {
      filename: file.filename,
      originalname: file.originalname,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      mimetype: file.mimetype
    });
    
    // Create image path
    const imagePath = `/uploads/${file.filename}`;
    const isAutoApproved = userData.role === 'admin';
    
    console.log('💾 Creating item with data:', {
      title: title.trim(),
      price: parseFloat(price),
      category,
      condition,
      imagePath,
      owner: userData.id,
      isApproved: isAutoApproved
    });
    
    // Create item in database
    const newItem = await Item.create({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      condition,
      image: imagePath,
      owner: userData.id,
      isApproved: isAutoApproved,
      isFlagged: false,
      approvedAt: isAutoApproved ? new Date() : null
    });
    
    // Add image URL
    const itemWithURL = {
      ...newItem.toObject(),
      imageURL: `${req.protocol}://${req.get('host')}${newItem.image}`
    };
    
    console.log(`✅ Item created: ${newItem._id} - "${newItem.title}"`);
    
    // Send notification if auto-approved (for admins)
    if (isAutoApproved && NotificationService) {
      try {
        await NotificationService.notifyItemApproved(
          userData.id,
          newItem._id,
          newItem.title
        );
        console.log(`📨 Sent approval notification for item ${newItem._id}`);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    } else if (!isAutoApproved) {
      console.log(`📋 Item ${newItem._id} is pending admin approval`);
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
    
    // Handle specific errors
    if (err.message === 'Missing token') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File size must be less than 5MB' 
      });
    }
    
    if (err.message && err.message.includes('Only image files')) {
      return res.status(400).json({ 
        success: false,
        message: 'Only image files (JPG, PNG, GIF, WEBP) are allowed' 
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
 * Update existing item
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 PUT /items/${id} - Updating item`);
    
    const userData = verifyToken(req);
    const { title, description, price, category, condition } = req.body;
    
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
      console.log(`⛔ User ${userData.id} not authorized to update item ${id}`);
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this item' 
      });
    }
    
    console.log(`👤 User ${userData.id} authorized to update (owner: ${isOwner}, admin: ${isAdmin})`);
    
    // Validate data
    const validationErrors = validateItemData({ 
      title: title || item.title, 
      description: description || item.description, 
      price: price || item.price, 
      category: category || item.category,
      condition: condition || item.condition
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    // Handle image update if new file uploaded
    let imagePath = item.image;
    if (req.file) {
      console.log('📸 New image uploaded:', req.file.filename);
      
      // Delete old image
      await deleteImageFile(item.image);
      
      // Set new image path
      imagePath = `/uploads/${req.file.filename}`;
    }
    
    // Update item
    const updatedData = {
      title: title ? title.trim() : item.title,
      description: description ? description.trim() : item.description,
      price: price ? parseFloat(price) : item.price,
      category: category || item.category,
      condition: condition || item.condition,
      image: imagePath,
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
    
    // Add image URL
    const itemWithURL = {
      ...updatedItem.toObject(),
      imageURL: updatedItem.image ? `${req.protocol}://${req.get('host')}${updatedItem.image}` : null
    };
    
    console.log(`✅ Item ${id} updated successfully`);
    
    // Send notification if item needs re-approval
    if (userData.role !== 'admin') {
      console.log(`📋 Item ${id} needs admin re-approval`);
      // You could send a notification to admins here
    }
    
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
      message: 'Error updating item', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Update item status (Available/Sold/Under Negotiation/Unavailable)
 */
exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📋 PATCH /items/${id}/status - Updating status to: ${status}`);
    
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
      console.log(`⛔ User ${userData.id} not authorized to update status of item ${id}`);
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update status of this item' 
      });
    }
    
    console.log(`👤 User ${userData.id} authorized (owner: ${isOwner}, admin: ${isAdmin})`);
    
    // Validate status
    const validStatuses = ['Available', 'Sold', 'Under Negotiation', 'Unavailable'];
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
      console.log(`📝 Item ${id} marked as sold - auto-unapproved`);
    }
    
    // If item becomes available again and is not flagged, keep approval status
    // (admin might need to re-approve if it was sold before)
    if (status === 'Available' && !item.isFlagged) {
      // Keep current approval status
    }
    
    await item.save();
    
    // Populate owner info for response
    const updatedItem = await Item.findById(id).populate('owner', 'name email');
    
    console.log(`✅ Item ${id} status updated to: ${status}`);
    
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
      message: 'Error updating item status', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Delete item
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 DELETE /items/${id} - Deleting item`);
    
    const userData = verifyToken(req);
    console.log(`👤 User: ${userData.id} (${userData.role})`);
    
    // Find item
    const item = await Item.findById(id);
    if (!item) {
      console.log(`❌ Item ${id} not found`);
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }
    
    // Check authorization
    const isOwner = item.owner.toString() === userData.id;
    const isAdmin = userData.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      console.log(`⛔ User ${userData.id} not authorized to delete item ${id}`);
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this item' 
      });
    }
    
    console.log(`👤 Authorization: owner=${isOwner}, admin=${isAdmin}`);
    
    // Delete image file
    const imageDeleted = await deleteImageFile(item.image);
    
    // Delete item from database
    await Item.findByIdAndDelete(id);
    
    console.log(`✅ Item ${id} deleted successfully (image deleted: ${imageDeleted})`);
    
    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: {
        deletedId: id,
        imageDeleted
      }
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
      message: 'Error deleting item', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Search items
 */
exports.searchItems = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, condition, sort = 'relevance' } = req.query;
    
    console.log('🔍 Searching items:', { q, category, minPrice, maxPrice, condition });
    
    // Build search query
    const query = { isApproved: true, isFlagged: false };
    
    // Text search
    if (q) {
      query.$text = { $search: q };
    }
    
    // Filters
    if (category) query.category = category;
    if (condition) query.condition = condition;
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
        sortOption = q ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
    }
    
    // Execute search
    const items = await Item.find(query)
      .populate('owner', 'name email')
      .sort(sortOption)
      .limit(50);
    
    // Add image URLs
    const itemsWithURL = addImageURLs(items, req);
    
    console.log(`✅ Found ${items.length} items matching search`);
    
    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        items: itemsWithURL,
        total: items.length,
        query: { q, category, condition }
      }
    });
    
  } catch (err) {
    console.error('❌ Error searching items:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error searching items', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};