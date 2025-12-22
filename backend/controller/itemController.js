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
    const items = await Item.find().populate('owner', 'name email');

    const itemsWithURL = items.map(item => ({
      ...item.toObject(),
      imageURL: item.image ? `${req.protocol}://${req.get('host')}${item.image}` : null
    }));

    res.json(itemsWithURL);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items', error: err.message });
  }
};

// ✅ Get single item by ID (with full imageURL)
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });

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
