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

exports.createItem = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const { title, description, price, category } = req.body;

    let imagePath = null;

    if (req.files?.image) {
      const file = req.files.image;

      // Create uploads folder if it doesn't exist
      const uploadDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      // Save file locally
      const fileName = Date.now() + '_' + file.name;
      const filePath = path.join(uploadDir, fileName);
      await file.mv(filePath);

      imagePath = `/uploads/${fileName}`; // relative path to store in DB
    }

    // Create and save item
    const newItem = await Item.create({
      title,
      description,
      price,
      category,
      image: imagePath, // will be null if no image
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
