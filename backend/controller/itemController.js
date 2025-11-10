const cloudinary = require('../config/cloudinary');
const Item = require('../models/itemModel');
const jwt = require('jsonwebtoken');

// ✅ Verify JWT token from request header
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing token');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

// ✅ Get all items (populate owner info)
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find().populate('owner', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items', error: err.message });
  }
};

// ✅ Get single item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching item', error: err.message });
  }
};

// ✅ Create item (with Cloudinary image upload)
exports.createItem = async (req, res) => {
  try {
    const userData = verifyToken(req);

    const { title, description, price, category } = req.body;
    const file = req.files?.image; // image file from frontend

    if (!file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // 📤 Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'studyreuse_items',
    });

    // 💾 Create and save item
    const newItem = await Item.create({
      title,
      description,
      price,
      category,
      image: uploadResult.secure_url, // store uploaded image URL
      owner: userData.id,
    });

    res.status(201).json({ message: 'Item added successfully', newItem });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ message: 'Error creating item', error: err.message });
  }
};

// ✅ Delete item (with owner authorization)
exports.deleteItem = async (req, res) => {
  try {
    const userData = verifyToken(req);

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Ensure the logged-in user is the item owner
    if (item.owner.toString() !== userData.id) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Error deleting item', error: err.message });
  }
};
