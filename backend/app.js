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
    : 'http://localhost:5173',
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
const routesWithJson = [
  { path: '/api/users', router: userRoutes },
  { path: '/api/barter', router: barterRoutes },
  { path: '/api/chat', router: chatRoutes },
  { path: '/api/reviews', router: reviewRoutes },
  { path: '/api/notifications', router: notificationRoutes },
  { path: '/api/admin', router: adminRoutes }
];

applyJsonToRoutes(routesWithJson);
app.use('/api/items', itemRoutes); // No JSON parsing for file uploads

// ======================
// 8. Health & Info Routes
// ======================
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 StudyReuse Backend API',
    version: '1.0.0',
    endpoints: {
      items: '/api/items',
      users: '/api/users',
      notifications: '/api/notifications',
      health: '/health'
    },
    uploads: `http://${req.get('host')}/uploads/`
  });
});

// ======================
// 9. Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Common errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      message: 'File size must be less than 5MB' 
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token' 
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: `Route ${req.originalUrl} not found` 
  });
});

// ======================
// 10. Database Connection
// ======================
const connectDB = async () => {
  try {
    //console.log('🔗 Connecting to MongoDB...');
    
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
      console.warn('⚠️ MongoDB disconnected');
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
    //console.log('\n' + '='.repeat(50));
    console.log('🚀 StudyReuse Backend Server');
    //console.log('='.repeat(50));
    
    // Check required env vars
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing environment variables:', missingEnvVars.join(', '));
      console.error('💡 Create a .env file with these variables');
      process.exit(1);
    }
    
    //console.log('✅ Environment verified');
    
    // Connect to database
    await connectDB();
    
    const PORT = process.env.PORT || 4000;
    
    server.listen(PORT, () => {
      //console.log('\n' + '='.repeat(50));
      console.log('Server Started Successfully!');
      //console.log('='.repeat(50));
      console.log(`📡 Server:  http://localhost:${PORT}`);
      console.log(`🌐 Uploads: http://localhost:${PORT}/uploads/`);
      //console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      //console.log('='.repeat(50));
      // console.log('\n📋 Available Endpoints:');
      // console.log('   GET    /                    - API Info');
      // console.log('   GET    /health             - Health Check');
      // console.log('   GET    /api/items          - List items');
      // console.log('   POST   /api/items          - Create item');
      // console.log('   GET    /api/items/:id      - Get item');
      // console.log('   PUT    /api/items/:id      - Update item');
      // console.log('   DELETE /api/items/:id      - Delete item');
      // console.log('   GET    /api/notifications  - Notifications');
      //console.log('\n🚀 Ready to accept connections!\n');
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error('Try: PORT=4001 npm start');
        process.exit(1);
      }
      console.error('💥 Server error:', err);
    });
    
  } catch (err) {
    console.error('💥 Failed to start server:', err);
    process.exit(1);
  }
};

// ======================
// 12. Graceful Shutdown
// ======================
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down...`);
  
  try {
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('✅ MongoDB connection closed');
    }
    
    console.log('👋 Shutdown complete');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle process events
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});

// ======================
// 13. Start the Server
// ======================
startServer();

module.exports = app;