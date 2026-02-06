// backend/middleware/adminMiddleware.js - UPDATED FOR SEPARATE ADMIN MODEL
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

const adminMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // ✅ UPDATED: Check for admin-specific fields in token
    if (!decoded.isAdmin && !decoded.modelType === 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin only.' 
      });
    }
    
    // ✅ UPDATED: Find admin in Admin model (not User model)
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Admin not found' 
      });
    }
    
    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Admin account is deactivated' 
      });
    }
    
    // ✅ UPDATED: Add admin to request (not user)
    req.admin = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role || 'admin'
    };
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired, please login again' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error in authentication' 
    });
  }
};

module.exports = adminMiddleware;