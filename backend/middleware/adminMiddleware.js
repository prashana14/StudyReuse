// 
const jwt = require('jsonwebtoken');

const adminMiddleware = (req, res, next) => {
  try {
    console.log("🔍 Admin Middleware - Headers:", req.headers);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log("🔍 Token received:", token.substring(0, 20) + "...");
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);
    
    // Check if user has admin role in token
    if (decoded.role !== 'admin') {
      console.log("❌ Not admin role. Role is:", decoded.role);
      return res.status(403).json({ message: 'Admin access only' });
    }
    
    console.log("✅ User is admin, proceeding...");
    
    // Attach user info to request for other middleware/routes
    req.user = decoded;
    next();
  } catch (error) {
    console.log("❌ Error in adminMiddleware:", error.message);
    console.log("JWT_SECRET exists?", !!process.env.JWT_SECRET);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = adminMiddleware;