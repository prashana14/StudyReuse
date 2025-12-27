const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'User already exists' });

    // Create user with plain password - pre-save hook will hash it
    const user = await User.create({ name, email, password });

    // Generate token WITH ROLE
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.json({
      message: 'Registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      },
      token
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error registering user',
      error: err.message
    });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'User not found' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Account is blocked',
        reason: user.blockedReason 
      });
    }

    // Generate token WITH ROLE
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      },
      token
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error logging in',
      error: err.message
    });
  }
};
// ✅ STEP 2: ADD THIS FUNCTION AT THE END OF userController.js

// Refresh JWT token
exports.refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.json({ 
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    
    res.status(500).json({ 
      message: 'Error refreshing token', 
      error: err.message 
    });
  }
};