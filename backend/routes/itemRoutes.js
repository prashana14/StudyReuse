const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getAllItems,
  getItemById,
  createItem,
  deleteItem,
  getMyItems
} = require('../controller/itemController');
const authMiddleware = require('../middleware/authMiddleware');

// ======================
// 1. Ensure uploads directory exists
// ======================
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// ======================
// 2. Enhanced Multer Configuration
// ======================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double-check directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate clean filename
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${originalName}`;
    console.log('📸 Multer saving file as:', uniqueName);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('🔍 File filter checking:', {
    name: file.originalname,
    type: file.mimetype,
    size: `${(file.size / 1024).toFixed(2)}KB`
  });
  
  // Check file extension
  const extname = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // Check MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedExtensions.includes(extname) && allowedMimeTypes.includes(file.mimetype)) {
    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rejected:', file.originalname, 'Type:', file.mimetype);
    cb(new Error('Only image files (JPG, JPEG, PNG, WEBP, GIF) are allowed!'), false);
  }
};

// Create multer instance with enhanced configuration
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Max 1 file
    parts: 50, // Max 50 parts (fields + files)
    headerPairs: 50 // Max 50 header key=>value pairs
  },
  fileFilter: fileFilter,
  preservePath: false
});

// ======================
// 3. Enhanced Multer Error Handler
// ======================
const handleMulterErrors = (err, req, res, next) => {
  console.log('🔍 Multer error handler triggered');
  
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err.code, err.message);
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          maxSize: '5MB',
          code: 'FILE_TOO_LARGE'
        });
        
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file allowed per upload.',
          code: 'TOO_MANY_FILES'
        });
        
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Use "image" as the field name.',
          code: 'INVALID_FIELD_NAME'
        });
        
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many form parts.',
          code: 'TOO_MANY_PARTS'
        });
        
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
          code: 'UPLOAD_ERROR'
        });
    }
  } 
  
  else if (err) {
    console.error('❌ Upload Error:', err.message);
    
    // Handle specific error messages
    if (err.message.includes('Only image files')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images (JPG, PNG, GIF, WEBP) are allowed.',
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    if (err.message.includes('Unexpected end of form')) {
      return res.status(400).json({
        success: false,
        message: 'Upload was interrupted. Please try again.',
        code: 'UPLOAD_INTERRUPTED'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Upload failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: 'UPLOAD_FAILED'
    });
  }
  
  next();
};

// ======================
// 4. Custom JSON Parser for Multipart Forms
// ======================
const parseMultipartJSON = (req, res, next) => {
  // If it's a multipart form, parse JSON fields manually
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    console.log('📋 Parsing multipart form data');
    
    // Express.json() will interfere, so we handle text fields manually
    // The text fields will be available in req.body after multer processes them
    next();
  } else {
    // For non-multipart requests, use standard JSON parser
    express.json({ limit: '10mb' })(req, res, next);
  }
};

// ======================
// 5. Request Debugging Middleware
// ======================
const debugUploadRequest = (req, res, next) => {
  console.log('\n📤 ===== UPLOAD REQUEST STARTED =====');
  console.log('📋 Request Details:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : 'none'
  });
  
  // Add timeout to prevent hanging requests
  req.setTimeout(300000, () => { // 5 minutes
    console.log('⏰ Request timeout after 5 minutes');
  });
  
  // Track upload progress
  let bytesReceived = 0;
  const contentLength = parseInt(req.headers['content-length']) || 0;
  
  req.on('data', (chunk) => {
    bytesReceived += chunk.length;
    if (contentLength > 0) {
      const percent = Math.round((bytesReceived / contentLength) * 100);
      if (percent % 25 === 0) { // Log every 25%
        console.log(`📊 Upload progress: ${percent}% (${bytesReceived}/${contentLength} bytes)`);
      }
    }
  });
  
  req.on('end', () => {
    console.log('✅ Upload request body fully received');
  });
  
  req.on('close', () => {
    console.log('⚠️ Client closed connection during upload');
  });
  
  req.on('error', (err) => {
    console.error('❌ Request stream error:', err.message);
  });
  
  next();
};

// ======================
// 6. Routes
// ======================

// GET Routes (no upload needed)
router.get('/', getAllItems);
router.get('/my', authMiddleware, getMyItems);
router.get('/:id', getItemById);

// POST Route with file upload - CRITICAL: Proper middleware order
router.post('/',
  // Step 1: Authentication
  authMiddleware,
  
  // Step 2: Debug logging
  debugUploadRequest,
  
  // Step 3: Parse JSON fields (for multipart forms)
  parseMultipartJSON,
  
  // Step 4: Multer file upload
  upload.single('image'),
  
  // Step 5: Handle multer errors
  handleMulterErrors,
  
  // Step 6: Log successful upload
  (req, res, next) => {
    console.log('✅ Multer processed file successfully');
    console.log('📁 File details:', req.file ? {
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      size: `${(req.file.size / 1024).toFixed(2)}KB`,
      path: req.file.path,
      mimetype: req.file.mimetype
    } : 'No file');
    console.log('📋 Body fields:', req.body);
    next();
  },
  
  // Step 7: Controller
  createItem
);

// DELETE Route
router.delete('/:id', authMiddleware, deleteItem);

// ======================
// 7. Export Router
// ======================
module.exports = router;

console.log('✅ Item routes loaded with enhanced upload handling');