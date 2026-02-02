const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');

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
  searchItems,
  updateItemQuantity,
  checkItemAvailability
} = require('../controller/itemController');

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
// 4. Authentication Middleware
// ======================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ======================
// 5. DEBUG MIDDLEWARE TO SEE WHAT'S HAPPENING
// ======================
router.use((req, res, next) => {
  // console.log(`📡 ${req.method} ${req.originalUrl}`);
  // console.log(`   Path: ${req.path}`);
  // console.log(`   Params:`, req.params);
  // console.log(`   Query:`, req.query);
  next();
});

// ======================
// 6. CORRECT ROUTE ORDER - CRITICAL FIX
// ======================

// ======= PUBLIC ROUTES (NO AUTH NEEDED) =======
router.get('/', getAllItems);
router.get('/search', searchItems);
router.post('/:id/check-availability', checkItemAvailability);

// ======= PROTECTED ROUTES (REQUIRE AUTH) =======
// 🔥 CRITICAL: Specific routes MUST come BEFORE parameterized routes
// The order matters! Express matches routes in the order they're defined.

router.get('/my', authMiddleware, (req, res, next) => {
  //console.log('✅ /my route matched! Calling getMyItems...');
  next();
}, getMyItems);

router.post('/',
  authMiddleware,
  parseMultipartJSON,
  upload.single('image'),
  handleMulterErrors,
  createItem
);

// ======= PARAMETERIZED ROUTES (WITH :id) =======
// ⚠️ These should come AFTER specific routes like /my, /search, etc.

// Quantity management
router.put('/:id/quantity', authMiddleware, updateItemQuantity);

// Update item with image
router.put('/:id',
  authMiddleware,
  parseMultipartJSON,
  upload.single('image'),
  handleMulterErrors,
  updateItem
);

// Status updates
router.patch('/:id/status', authMiddleware, updateItemStatus);
router.delete('/:id', authMiddleware, deleteItem);

// Get single item by ID - THIS MUST BE AFTER /my
router.get('/:id', (req, res, next) => {
  // console.log(`🆔 /:id route matched with id=${req.params.id}`);
  // console.log(`   Is it "my"? ${req.params.id === 'my'}`);
  next();
}, getItemById);

// ======= ADMIN ROUTES =======
router.put('/:id/approve', authMiddleware, adminMiddleware, approveItem);
router.put('/:id/reject', authMiddleware, adminMiddleware, rejectItem);

// ======================
// 7. 404 HANDLER FOR ITEM ROUTES
// ======================
router.use('*', (req, res) => {
  console.log(`❌ No matching route found for: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Item route not found: ${req.method} ${req.originalUrl}`
  });
});

// ======================
// 8. LOG ALL REGISTERED ROUTES
// ======================
//console.log('\n📋 Registered Item Routes:');
router.stack.forEach((middleware) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
    //console.log(`   ${methods} ${middleware.route.path}`);
  }
});

module.exports = router;