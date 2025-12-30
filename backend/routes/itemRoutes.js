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
const Item = require('../models/itemModel');

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
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
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
  
  const extname = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedExtensions.includes(extname) && allowedMimeTypes.includes(file.mimetype)) {
    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rejected:', file.originalname, 'Type:', file.mimetype);
    cb(new Error('Only image files (JPG, JPEG, PNG, WEBP, GIF) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 1,
    parts: 50,
    headerPairs: 50
  },
  fileFilter: fileFilter,
  preservePath: false
});

// ======================
// 3. Enhanced Multer Error Handler
// ======================
const handleMulterErrors = (err, req, res, next) => {
  console.log('Multer error handler triggered');
  
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
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    console.log('📋 Parsing multipart form data');
    next();
  } else {
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
    contentLength: req.headers['content-length']
  });
  next();
};

// ======================
// 6. Routes - FIXED ORDER (IMPORTANT!)
// ======================

// GET Routes - SPECIFIC routes FIRST
router.get('/my', authMiddleware, getMyItems);

// Debug route to see all items
// router.get('/debug/all-items', async (req, res) => {
//   try {
//     console.log("🔍 Debug: Fetching ALL items from database");
    
//     const allItems = await Item.find({})
//       .populate("owner", "name email")
//       .limit(50)
//       .sort({ createdAt: -1 });
    
//     console.log(`📊 Total items in database: ${allItems.length}`);
    
//     // Log sample items
//     allItems.slice(0, 5).forEach((item, index) => {
//       console.log(`\nItem ${index + 1}:`);
//       console.log(`  Title: ${item.title}`);
//       console.log(`  Category: ${item.category}`);
//       console.log(`  Status: ${item.status}`);
//       console.log(`  Description: ${item.description?.substring(0, 50)}...`);
//     });
    
//     res.json({
//       total: allItems.length,
//       items: allItems
//     });
    
//   } catch (error) {
//     console.error("❌ Debug error:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// Test item creation (REMOVE IN PRODUCTION)
router.post('/test-create', authMiddleware, async (req, res) => {
  try {
    console.log("🧪 Creating test item...");
    
    const testItem = new Item({
      title: "Scientific Calculator Texas Instruments",
      description: "Like new scientific calculator for engineering students. Includes case and manual.",
      price: 1200,
      category: "Electronics",
      condition: "Like New",
      status: "approved",
      owner: req.user._id,
      imageURL: "/uploads/calculator.jpg"
    });
    
    await testItem.save();
    
    console.log("✅ Test item created:", testItem.title);
    
    res.json({
      success: true,
      message: "Test item created",
      item: testItem
    });
    
  } catch (error) {
    console.error("❌ Test creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Search route - MUST come before /:id
router.get('/search', async (req, res) => {
  try {
    //console.log("=".repeat(60));
    //console.log("🔍 SEARCH REQUEST:", req.query);
    
    const { q } = req.query;
    
    // If no search term, return all approved items
    if (!q || q.trim() === "") {
      console.log("No search term, returning all approved items");
      const allItems = await Item.find({ status: "approved" })
        .populate("owner", "name email profilePicture")
        .limit(20)
        .sort({ createdAt: -1 });
      
      console.log(`✅ Returning ${allItems.length} approved items`);
      return res.json(allItems);
    }
    
    const searchTerm = q.trim().toLowerCase();
    //console.log(`🔍 Searching for: "${searchTerm}"`);
    
    // TEMPORARY: Remove status filter to test if items exist
    // Change this back to { status: "approved" } later
    const searchQuery = {
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
        { condition: { $regex: searchTerm, $options: "i" } }
      ]
    };
    
    //console.log("🔍 Search query (NO STATUS FILTER):", JSON.stringify(searchQuery, null, 2));
    
    // Execute search
    const items = await Item.find(searchQuery)
      .populate("owner", "name email profilePicture")
      .limit(20)
      .sort({ createdAt: -1 });
    
    //console.log(`✅ Found ${items.length} items for "${searchTerm}"`);
    
    // If no items found, try searching ALL items without any filter
    if (items.length === 0) {
      console.log("⚠️ No matches found, searching ALL items...");
      const allItems = await Item.find({})
        .populate("owner", "name email profilePicture")
        .limit(10)
        .sort({ createdAt: -1 });
      
      console.log(`📊 There are ${allItems.length} total items in database`);
      
      if (allItems.length > 0) {
        console.log("Sample items in database:");
        allItems.slice(0, 3).forEach(item => {
          console.log(`  - "${item.title}" (${item.category}) - Status: ${item.status}`);
        });
      }
    }
    
    //console.log("=".repeat(60));
    res.json(items);
    
  } catch (error) {
    console.error("❌ Search error:", error);
    // Return empty array instead of error
    res.json([]);
  }
});

// General routes
router.get('/', getAllItems);

// PARAMETERIZED routes LAST
router.get('/:id', getItemById);

// POST Route with file upload
router.post('/',
  authMiddleware,
  debugUploadRequest,
  parseMultipartJSON,
  upload.single('image'),
  handleMulterErrors,
  createItem
);

// DELETE Route
router.delete('/:id', authMiddleware, deleteItem);

// ======================
// 7. Export Router
// ======================
module.exports = router;