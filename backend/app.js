require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Import routes
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const barterRoutes = require('./routes/barterRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// ======================
// 1. Security Middleware
// ======================
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// ======================
// 2. CORS Configuration
// ======================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8179',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ======================
// 3. Body Parsers & Security
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
// 4. Create Uploads Directory
// ======================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Uploads directory created:', uploadsDir);
}

// ======================
// 5. Static Files
// ======================
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png')) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// ======================
// 6. Request Logging Middleware
// ======================
app.use((req, res, next) => {
  const start = Date.now();
  
  if (req.url === '/favicon.ico' || req.url.startsWith('/uploads/')) {
    return next();
  }
  
  if (req.url === '/health' || req.url === '/') {
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
// 7. Routes - ✅ FIXED: COMPLETE ROUTE MOUNTING
// ======================
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/barter', barterRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ======================
// 8. Health & Info Routes
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
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 StudyReuse Backend API',
    version: '1.0.0',
    endpoints: {
      items: '/api/items',
      users: '/api/users',
      barter: '/api/barter',
      chat: '/api/chat',
      reviews: '/api/reviews',
      notifications: '/api/notifications',
      admin: '/api/admin',
      health: '/health'
    },
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'https://github.com/prashana14/StudyReuse'
  });
});

// ======================
// 9. Error Handling Middleware
// ======================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id || 'anonymous'
  });
  
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
      admin: '/api/admin'
    }
  });
});

// ======================
// 10. Database Connection
// ======================
const connectDB = async () => {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    
    // Check if MONGO_URI is set
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
    console.error('Current URI format:', process.env.MONGO_URI ? 'Present (check if correct)' : 'MISSING');
    
    // Exit the process if DB connection fails
    console.error('💥 Application cannot start without database connection. Exiting...');
    process.exit(1);
  }
};

// ======================
// 11. Server Startup
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
    
    // console.log('📋 Environment Check:');
    // console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    // console.log(`   - PORT: ${process.env.PORT}`);
    // console.log(`   - MONGO_URI: ${process.env.MONGO_URI ? 'Present' : 'MISSING'}`);
    // console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'Present' : 'MISSING'}`);
    // console.log('='.repeat(50));
    
    // Connect to database
    await connectDB();
    
    const PORT = process.env.PORT || 4000;
    
    server.listen(PORT, '0.0.0.0', () => {
      //console.log('\n' + '='.repeat(50));
      console.log('🚀 Server Started Successfully!');
      //console.log('='.repeat(50));
      console.log(`📡 Server:  http://localhost:${PORT}`);
      console.log(`📡 Network: http://${require('os').networkInterfaces().eth0?.[0]?.address || 'localhost'}:${PORT}`);
      console.log(`🌐 Uploads: http://localhost:${PORT}/uploads/`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      // console.log('='.repeat(50));
      // console.log('\n📋 Available Routes:');
      // console.log('   GET  /health          - Health check');
      // console.log('   GET  /                - API info');
      // console.log('   POST /api/users/login - User login');
      // console.log('   POST /api/users/register - User registration');
      // console.log('   GET  /api/items       - Get all items');
      // console.log('   GET  /api/items/my    - Get user items');
      // console.log('   POST /api/items       - Create item');
      // console.log('   GET  /api/barter/my   - Get barter requests');
      // console.log('   GET  /api/notifications - Get notifications');
      // console.log('='.repeat(50));
      console.log('\n🚀 Ready to accept connections!\n');
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error('Try: PORT=4001 npm start');
        process.exit(1);
      }
      console.error('💥 Server error:', err.message);
    });
    
  } catch (err) {
    console.error('💥 Failed to start server:', err.message);
    process.exit(1);
  }
};

// ======================
// 12. Graceful Shutdown
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
    
    console.log('👋 Shutdown complete');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error during shutdown:', err.message);
    process.exit(1);
  }
};

// ======================
// 13. Process Event Handlers
// ======================
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('\n💥 Uncaught Exception:');
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
    console.error('💥 Critical error detected - shutting down');
    shutdown('UNCAUGHT_EXCEPTION');
  } else {
    console.error('⚠️ Non-critical error - server will continue running');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️ Unhandled Rejection detected:');
  console.error('Reason:', reason.message || reason);
  
  if (reason instanceof Error) {
    console.error('Error name:', reason.name);
    
    if (reason.name === 'ValidationError') {
      console.error('🔍 Validation Error Details:');
      if (reason.errors) {
        Object.keys(reason.errors).forEach(field => {
          console.error(`  ${field}:`, reason.errors[field].message);
        });
      }
    }
  }
  
  console.error('ℹ️ Server will continue running despite unhandled rejection');
});

// ======================
// 14. Start the Server
// ======================
setTimeout(() => {
  startServer();
}, 100);

module.exports = { app, server };