// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// ===============================
// Protect routes (logged-in users)
// ===============================
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
        reason: user.blockedReason,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// ===============================
// Admin-only access (UPDATED - since role field removed)
// ===============================
const admin = (req, res, next) => {
  // Since you removed role field, we need another way to identify admins
  // OPTION 1: Check if user exists (any authenticated user can access for now)
  // OPTION 2: Add isAdmin boolean field to your User model
  // OPTION 3: Use email-based admin check
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  
  // For now, allow all authenticated users to access admin analytics
  // OR check specific admin emails
  const adminEmails = ['admin@example.com', 'prashana@example.com']; // Add your admin emails
  
  if (adminEmails.includes(req.user.email)) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }
};

// ===============================
// 🔥 BACKWARD-COMPATIBLE EXPORT
// ===============================

// Allows BOTH of these:
// const authMiddleware = require(...)
// const { protect, admin } = require(...)

module.exports = protect;
module.exports.protect = protect;
module.exports.admin = admin;