const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const {
  getAllItems,
  getItemById,
  createItem,
  deleteItem,
  getMyItems,
  updateItemStatus,
  updateItem,
  approveItem,
  rejectItem,
  searchItems
} = require('../controller/itemController');
const authMiddleware = require('../middleware/authMiddleware');

// ======================
// 1. Cloudinary Storage Configuration
// ======================

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'study-reuse',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => {
      const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      const originalName = file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '-');
      return `${originalName}-${uniqueId}`;
    }
  }
});

const fileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedExtensions.includes(extname) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, JPEG, PNG, WEBP, GIF) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: fileFilter
});

// ======================
// 2. Multer Error Handler
// ======================
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file allowed per upload.',
          code: 'TOO_MANY_FILES'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
          code: 'UPLOAD_ERROR'
        });
    }
  } else if (err) {
    if (err.message.includes('Only image files')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images (JPG, PNG, GIF, WEBP) are allowed.',
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Upload failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  next();
};

// ======================
// 3. Custom JSON Parser for Multipart Forms
// ======================
const parseMultipartJSON = (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
};

// ======================
// 4. Routes - PROPER ORDER
// ======================

// GET Routes (Non-parameterized FIRST)
router.get('/my', authMiddleware, getMyItems);
router.get('/search', searchItems);
router.get('/', getAllItems);

// POST Route with file upload
router.post('/',
  authMiddleware,
  parseMultipartJSON,
  upload.single('image'),
  handleMulterErrors,
  createItem
);

// PUT Routes (Update operations)
router.put('/:id',
  authMiddleware,
  parseMultipartJSON,
  upload.single('image'),
  handleMulterErrors,
  updateItem
);

router.put('/:id/approve', authMiddleware, approveItem);
router.put('/:id/reject', authMiddleware, rejectItem);

// PATCH Routes
router.patch('/:id/status', authMiddleware, updateItemStatus);

// DELETE Route
router.delete('/:id', authMiddleware, deleteItem);

// Parameterized GET Route (MUST BE LAST)
router.get('/:id', getItemById);

// ======================
// 5. Export Router
// ======================
module.exports = router;