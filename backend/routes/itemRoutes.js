const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getAllItems,
  getItemById,
  createItem,
  deleteItem
} = require('../controller/itemController');

// --------------------
// Multer setup
// --------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder to save images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb("Error: Only images are allowed!");
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// --------------------
// Routes
// --------------------
router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', upload.single("image"), createItem); // add upload middleware here
router.delete('/:id', deleteItem);

module.exports = router;

