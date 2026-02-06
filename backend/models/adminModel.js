// backend/models/adminModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // === BASIC INFO ===
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        // Must end with @sdc.edu.np
        return email.endsWith('@sdc.edu.np');
      },
      message: 'Only @sdc.edu.np email addresses are allowed for admin registration'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include in queries
  },
  
  // === ADMIN ROLE ===
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  
  // === ADMIN STATUS ===
  isActive: {
    type: Boolean,
    default: true
  },
  
  // === LOGIN TRACKING ===
  lastLogin: {
    type: Date,
    default: null
  },
  
  loginCount: {
    type: Number,
    default: 0
  },
  
  // === SECURITY ===
  resetPasswordToken: String,
  resetPasswordExpire: Date
  
}, {
  timestamps: true
});

// === INDEXES ===
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

// === PRE-SAVE MIDDLEWARE ===
adminSchema.pre('save', async function(next) {
  // Only hash password if modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// === INSTANCE METHODS ===
// Compare password
adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update login info
adminSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
};

// Check if super admin
adminSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

// === STATIC METHODS ===
// Find active admins
adminSchema.statics.findActiveAdmins = function() {
  return this.find({ isActive: true });
};

// Find by email
adminSchema.statics.findByEmail = function(email) {
  return this.findOne({ email, isActive: true });
};

// Get all admins count
adminSchema.statics.getAdminsCount = function() {
  return this.countDocuments({ isActive: true });
};

module.exports = mongoose.model('Admin', adminSchema);