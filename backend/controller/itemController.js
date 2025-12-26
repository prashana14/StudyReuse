const path = require('path');
const fs = require('fs');
const Item = require('../models/itemModel');
const jwt = require('jsonwebtoken');

// ✅ Verify JWT token from request header
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing token');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

// ✅ Get all items (populate owner info + full imageURL)
exports.getAllItems = async (req, res) => {
  try {
    // ===== ADD THIS CHECK =====
    // Check if user is admin (for special access)
    let isAdmin = false;
    try {
      const userData = verifyToken(req);
      isAdmin = userData.role === 'admin';
    } catch (err) {
      // Not logged in or invalid token - treat as regular user
      isAdmin = false;
    }
    
    // Build query: admins see all items, regular users see only approved items
    const query = isAdmin ? {} : { isApproved: true, isFlagged: false };
    // ==========================
    
    const items = await Item.find(query).populate('owner', 'name email');

    const itemsWithURL = items.map(item => ({
      ...item.toObject(),
      imageURL: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null
    }));

    res.json(itemsWithURL);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items', error: err.message });
  }
};

// ✅ Get current user's items
exports.getMyItems = async (req, res) => {
  try {
    const userData = verifyToken(req);
    
    // Find items where owner matches the logged-in user's ID
    // Users can see ALL their items (including pending/flagged)
    const items = await Item.find({ owner: userData.id }).populate('owner', 'name email');

    const itemsWithURL = items.map(item => ({
      ...item.toObject(),
      imageURL: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null
    }));

    res.json(itemsWithURL);
  } catch (err) {
    console.error('Error fetching user items:', err);
    res.status(500).json({ message: 'Error fetching your items', error: err.message });
  }
};

// ✅ Get single item by ID (with full imageURL)
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // ===== ADD THIS CHECK =====
    // If item is not approved and user is not admin/owner, don't show it
    let canView = true;
    try {
      const userData = verifyToken(req);
      canView = userData.role === 'admin' || userData.id === item.owner._id.toString();
    } catch (err) {
      // Not logged in
      canView = item.isApproved && !item.isFlagged;
    }
    
    if (!canView) {
      return res.status(403).json({ message: 'Item not available or pending approval' });
    }
    // ==========================

    const itemWithURL = {
      ...item.toObject(),
      imageURL: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null
    };

    res.json(itemWithURL);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching item', error: err.message });
  }
};

// ✅ Create new item with optional image upload
exports.createItem = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const { title, description, price, category } = req.body;

    let imagePath = null;

    if (req.files?.image) {
      const file = req.files.image;

      const uploadDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

      const fileName = Date.now() + '_' + file.name;
      const filePath = path.join(uploadDir, fileName);
      await file.mv(filePath);

      imagePath = `/uploads/${fileName}`;
    }

    const newItem = await Item.create({
      title,
      description,
      price,
      category,
      image: imagePath,
      owner: userData.id,
      // ===== ADD THIS =====
      isApproved: userData.role === 'admin', // Admins' items auto-approve
      isFlagged: false
      // ====================
    });

    const imageURL = newItem.image
      ? `${req.protocol}://${req.get('host')}${newItem.image}`
      : null;

    res.status(201).json({
      message: 'Item added successfully',
      newItem: { ...newItem.toObject(), imageURL }
    });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ message: 'Error creating item', error: err.message });
  }
};

// ✅ Delete item (owner only)
exports.deleteItem = async (req, res) => {
  try {
    const userData = verifyToken(req);

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // ===== UPDATE THIS CHECK =====
    // Allow admins OR owners to delete
    const isOwner = item.owner.toString() === userData.id;
    const isAdmin = userData.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    // =============================

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Error deleting item', error: err.message });
  }
};