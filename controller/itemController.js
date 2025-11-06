const Item = require('../models/itemModel');
const jwt = require('jsonwebtoken');

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Missing token');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find().populate('owner', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items', error: err.message });
  }
};

// Get single item
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching item', error: err.message });
  }
};

// Create item
exports.createItem = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const { title, description, price, category, image } = req.body;

    const newItem = await Item.create({
      title,
      description,
      price,
      category,
      image,
      owner: userData.id
    });

    res.json({ message: 'Item added successfully', newItem });
  } catch (err) {
    res.status(500).json({ message: 'Error creating item', error: err.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const userData = verifyToken(req);
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.owner.toString() !== userData.id)
      return res.status(403).json({ message: 'Not authorized to delete this item' });

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting item', error: err.message });
  }
};
