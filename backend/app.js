const dotenv = require('dotenv');
dotenv.config(); // Load environment variables FIRST
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit'); // Import ipKeyGenerator
const hpp = require('hpp');

// Import routes
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const barterRoutes = require('./routes/barterRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes'); // ADD THIS LINE

const app = express();
const server = http.createServer(app);

// ======================
// 1. Security Middleware
// ======================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ======================
// 2. CORS Configuration
// ======================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8179',
      'http://localhost:4000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Range'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Retry-After'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight for all routes
app.options('*', cors(corsOptions));

// ======================
// 3. IMPROVED Rate Limiting
// ======================

// Skip rate limiting for certain endpoints
const skipRateLimit = (req) => {
  const skipPaths = [
    '/health',
    '/',
    '/favicon.ico',
    /^\/uploads\/.*/ // Skip for uploads
  ];
  
  return skipPaths.some(path => {
    if (typeof path === 'string') return req.path === path;
    if (path instanceof RegExp) return path.test(req.path);
    return false;
  });
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  // Use ipKeyGenerator for proper IPv6 handling
  keyGenerator: (req) => {
    // Use user ID if available, otherwise use IP
    if (req.user?._id) {
      return req.user._id;
    }
    return ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

// Stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Only 20 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT'
  },
  skip: (req) => req.path !== '/api/users/login' && req.path !== '/api/users/register',
  keyGenerator: (req) => ipKeyGenerator(req) // Use IP for auth
});

// More generous limiter for chat endpoints
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many chat requests, please slow down',
    code: 'CHAT_RATE_LIMIT'
  },
  skip: (req) => !req.path.startsWith('/api/chat'),
  keyGenerator: (req) => {
    // Use user ID for chat, fallback to IP
    if (req.user?._id) {
      return `user:${req.user._id}`;
    }
    return ipKeyGenerator(req);
  }
});

// Order-specific rate limiter
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // 10 order requests per minute
  message: {
    success: false,
    message: 'Too many order requests, please slow down',
    code: 'ORDER_RATE_LIMIT'
  },
  skip: (req) => !req.path.startsWith('/api/orders'),
  keyGenerator: (req) => {
    if (req.user?._id) {
      return `order_user:${req.user._id}`;
    }
    return ipKeyGenerator(req);
  }
});

// Admin endpoints rate limiter (separate for admin panel)
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute for admin
  message: {
    success: false,
    message: 'Too many admin requests, please slow down',
    code: 'ADMIN_RATE_LIMIT'
  },
  skip: (req) => !req.path.startsWith('/api/admin'),
  keyGenerator: (req) => {
    if (req.user?._id) {
      return `admin:${req.user._id}`;
    }
    return ipKeyGenerator(req);
  }
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/chat', chatLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/admin', adminLimiter);

// ======================
// 4. Body Parsers & Security
// ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100
}));

// Security middlewares
app.use(mongoSanitize());
app.use(hpp());

// Compression for production
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
}

// ======================
// 5. Create Uploads Directory
// ======================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Uploads directory created:', uploadsDir);
}

// ======================
// 6. Static Files Configuration
// ======================
// Add CORS headers for static files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Serve static files
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    
    if (ext.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// Test route for uploaded files
app.get('/test-upload/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// ======================
// 7. Request Logging Middleware
// ======================
app.use((req, res, next) => {
  const start = Date.now();
  
  // Skip logging for static files and health checks
  if (req.url === '/favicon.ico' || req.url.startsWith('/uploads/') || 
      req.url === '/health' || req.url === '/') {
    return next();
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    if (statusCode >= 400 || duration > 1000 || process.env.NODE_ENV === 'development') {
      const emoji = statusCode >= 500 ? '💥' : 
                   statusCode >= 400 ? '⚠️' : 
                   duration > 1000 ? '🐌' : '✅';
      
      console.log(`${emoji} ${req.method} ${req.url} - ${statusCode} (${duration}ms)`);
    }
  });
  
  next();
});

// ======================
// 8. Routes
// ======================
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/barter', barterRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// ======================
// 9. Health & Info Routes
// ======================
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus] || 'unknown';
  
  res.json({
    status: dbStatus === 1 ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    database: statusText,
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
    environment: process.env.NODE_ENV || 'development',
    rateLimiting: {
      enabled: true,
      general: '500 requests per 15 minutes',
      auth: '20 requests per 15 minutes',
      chat: '60 requests per minute',
      orders: '10 requests per minute',
      admin: '100 requests per minute'
    },
    routes: {
      users: '/api/users',
      items: '/api/items',
      barter: '/api/barter',
      chat: '/api/chat',
      reviews: '/api/reviews',
      notifications: '/api/notifications',
      admin: '/api/admin',
      orders: '/api/orders'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'StudyReuse Backend API',
    version: '1.0.0',
    endpoints: {
      items: '/api/items',
      users: '/api/users',
      barter: '/api/barter',
      chat: '/api/chat',
      reviews: '/api/reviews',
      notifications: '/api/notifications',
      admin: '/api/admin',
      orders: '/api/orders',
      health: '/health'
    },
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8179']
    },
    rateLimiting: 'Enabled with different tiers',
    documentation: 'https://github.com/prashana14/StudyReuse'
  });
});

// ======================
// 10. Error Handling Middleware
// ======================
app.use((err, req, res, next) => {
  console.error('🔴 Server Error:', {
    message: err.message,
    name: err.name,
    url: req.url,
    method: req.method,
    user: req.user?._id || 'anonymous',
    ip: req.ip
  });
  
  // Rate Limiting Errors
  if (err.type === 'rate_limit_exceeded') {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900 // 15 minutes in seconds
    });
  }
  
  // Validation Errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // MongoDB Errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Order-specific errors
  if (err.message && err.message.includes('item is not available')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'ITEM_UNAVAILABLE'
    });
  }
  
  if (err.message && err.message.includes('out of stock')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'ITEM_OUT_OF_STOCK'
    });
  }
  
  // Multer/File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size must be less than 5MB'
    });
  }
  
  // CORS Errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed'
    });
  }
  
  // Payment errors
  if (err.message && err.message.includes('payment')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'PAYMENT_ERROR'
    });
  }
  
  // Admin-specific errors
  if (err.message && err.message.includes('Admin only')) {
    return res.status(403).json({
      success: false,
      message: err.message,
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }
  
  // Notification errors
  if (err.message && err.message.includes('notification')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'NOTIFICATION_ERROR'
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      api: '/api',
      health: '/health',
      items: '/api/items',
      users: '/api/users',
      admin: '/api/admin',
      orders: '/api/orders',
      notifications: '/api/notifications',
      chat: '/api/chat',
      barter: '/api/barter',
      reviews: '/api/reviews'
    }
  });
});

// ======================
// 11. Database Connection
// ======================
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not set in .env file');
      process.exit(1);
    }
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };
    
    await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log('✅ MongoDB Connected Successfully!');
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected - attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('💡 Check your MONGO_URI in .env file');
    process.exit(1);
  }
};

// ======================
// 12. Server Startup
// ======================
const startServer = async () => {
  try {
    console.log('🚀 StudyReuse Backend Server Starting...');
    console.log('='.repeat(50));
    
    // Check required env vars
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing environment variables:', missingEnvVars.join(', '));
      console.error('💡 Create a .env file with these variables');
      process.exit(1);
    }
    
    // Connect to database
    await connectDB();
    
    const PORT = process.env.PORT || 4000;
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server Started Successfully');
      console.log(`🌐 Local:    http://localhost:${PORT}`);
      console.log(`📁 Uploads:  http://localhost:${PORT}/uploads/`);
      console.log(`🩺 Health:   http://localhost:${PORT}/health`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🔒 Rate Limiting: Enabled');
      console.log('   - General: 500 requests per 15 minutes');
      console.log('   - Auth: 20 requests per 15 minutes');
      console.log('   - Chat: 60 requests per minute');
      console.log('   - Orders: 10 requests per minute');
      console.log('   - Admin: 100 requests per minute');
      console.log('🌍 CORS: Configured for frontend origins');
      console.log('='.repeat(50));
      console.log('\n✅ Ready to accept connections\n');
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error('💡 Try: PORT=4001 npm start');
        process.exit(1);
      }
      console.error('❌ Server error:', err.message);
    });
    
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

// ======================
// 13. Graceful Shutdown
// ======================
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  try {
    // Close HTTP server
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Close MongoDB connection if connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('✅ MongoDB connection closed');
    }
    
    console.log('✅ Shutdown complete');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error during shutdown:', err.message);
    process.exit(1);
  }
};

// ======================
// 14. Process Event Handlers
// ======================
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('\n❌ Uncaught Exception:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  const criticalErrors = [
    'EADDRINUSE',
    'ECONNREFUSED',
    'MODULE_NOT_FOUND',
    'ENOENT'
  ];
  
  const isCritical = criticalErrors.some(keyword => 
    err.message.includes(keyword) || err.code === keyword
  );
  
  if (isCritical) {
    console.error('🔴 Critical error detected - shutting down');
    shutdown('UNCAUGHT_EXCEPTION');
  } else {
    console.error('🟡 Non-critical error - server will continue running');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️ Unhandled Rejection detected:');
  console.error('Reason:', reason.message || reason);
  
  if (reason instanceof Error) {
    console.error('Error name:', reason.name);
    
    if (reason.name === 'ValidationError') {
      console.error('Validation Error Details:');
      if (reason.errors) {
        Object.keys(reason.errors).forEach(field => {
          console.error(`  ${field}:`, reason.errors[field].message);
        });
      }
    }
  }
});

// ======================
// 15. Start the Server
// ======================
setTimeout(() => {
  startServer();
}, 100);

module.exports = { app, server };