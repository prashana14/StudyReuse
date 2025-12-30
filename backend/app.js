require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');

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
// 1. Basic Security Headers
// ======================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ======================
// 2. CORS Configuration
// ======================
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://localhost:8179'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ======================
// 3. Create Uploads Directory
// ======================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Uploads directory created');
}

// ======================
// 4. Clean Request Logging
// ======================
app.use((req, res, next) => {
  const start = Date.now();
  
  // Skip favicon and static files
  if (req.url === '/favicon.ico' || req.url.startsWith('/uploads/')) {
    return next();
  }
  
  // Skip logging health checks in production
  if (req.url === '/' && process.env.NODE_ENV === 'production') {
    return next();
  }
  
  // Log only errors and slow requests
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log errors (4xx, 5xx)
    if (statusCode >= 400) {
      const emoji = statusCode >= 500 ? '💥' : '⚠️';
      console.log(`${emoji} ${req.method} ${req.url} - ${statusCode} (${duration}ms)`);
    }
    // Log very slow requests (> 1 second)
    else if (duration > 1000) {
      console.log(`🐌 ${req.method} ${req.url} - ${statusCode} (${duration}ms)`);
    }
    // Log successful API requests in development
    else if (req.url.startsWith('/api/') && process.env.NODE_ENV === 'development') {
      console.log(`✅ ${req.method} ${req.url} - ${statusCode} (${duration}ms)`);
    }
  });
  
  next();
});

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
// 6. Body Parsers
// ======================
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb'
}));

// Helper to apply JSON parsing to specific routes
const applyJsonToRoutes = (routes) => {
  routes.forEach(route => {
    app.use(route.path, express.json({ limit: '10mb' }), route.router);
  });
};

// ======================
// 7. Routes Configuration
// ======================
// Apply JSON middleware first
app.use(express.json({ limit: '10mb' }));

// Then apply routes
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
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage()
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
    uploads: `http://${req.get('host')}/uploads/`,
    status: 'operational'
  });
});

// ======================
// 9. Enhanced Error Handling Middleware
// ======================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:');
  console.error('Message:', err.message);
  console.error('Name:', err.name);
  
  // Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    console.error('🔍 Validation Error Details:');
    Object.keys(err.errors).forEach(field => {
      console.error(`  ${field}:`, err.errors[field].message);
    });
    
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
  
  // Mongoose CastError (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }
  
  // File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size must be less than 5MB'
    });
  }
  
  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
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

// 404 Handler (must be after all routes)
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found` 
  });
});

// ======================
// 10. Database Connection
// ======================
const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    };
    
    await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log('✅ MongoDB Connected');
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected - attempting to reconnect...');
    });
    
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('💡 Check your MONGO_URI in .env file');
    process.exit(1);
  }
};

// ======================
// 11. Server Startup
// ======================
const startServer = async () => {
  try {
    console.log('🚀 StudyReuse Backend Server');
    
    // Check required env vars
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
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
      console.log('\n' + '='.repeat(50));
      console.log('Server Started Successfully!');
      console.log('='.repeat(50));
      console.log(`📡 Server:  http://localhost:${PORT}`);
      console.log(`🌐 Uploads: http://localhost:${PORT}/uploads/`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
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
// Handle graceful shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions - don't crash for non-critical errors
process.on('uncaughtException', (err) => {
  console.error('\n💥 Uncaught Exception:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  // Only shutdown for critical errors
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
    // Log error but don't shutdown
  }
});

// Handle unhandled rejections - don't crash the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️ Unhandled Rejection detected:');
  console.error('Reason:', reason.message || reason);
  
  // Log more details for debugging
  if (reason instanceof Error) {
    console.error('Error name:', reason.name);
    console.error('Error stack:', reason.stack);
    
    // Check if it's a validation error
    if (reason.name === 'ValidationError') {
      console.error('🔍 Validation Error Details:');
      if (reason.errors) {
        Object.keys(reason.errors).forEach(field => {
          console.error(`  ${field}:`, reason.errors[field].message);
        });
      }
      
      // For notification validation errors
      if (reason.message.includes('Notification') || reason.message.includes('user')) {
        console.error('📌 Notification validation error detected');
        console.error('📌 This is likely from notificationService.js');
        console.error('📌 Server will continue running...');
      }
    }
  }
  
  // Don't shutdown for unhandled rejections
  console.error('ℹ️ Server will continue running despite unhandled rejection');
});

// Handle warnings
process.on('warning', (warning) => {
  console.warn('\n⚠️ Node.js Warning:');
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});

// ======================
// 14. Start the Server
// ======================
// Delay start to allow console to clear
setTimeout(() => {
  startServer();
}, 100);

module.exports = { app, server };