// backend/models/userModel.js - SIMPLIFIED UPDATE
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },

    email: { 
      type: String, 
      required: true, 
      unique: true 
    },

    password: { 
      type: String, 
      required: true 
    },

    // REMOVED role field - all users are regular users now
    // role: {
    //   type: String,
    //   enum: ["user", "admin"],
    //   default: "user"
    // },

    isBlocked: {
      type: Boolean,
      default: false
    },
    
    blockedReason: {
      type: String,
      default: null
    },
    
    blockedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔍 Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update the post-save hook - remove role check since all are users
userSchema.post('save', async function(doc, next) {
  try {
    // Notify for ALL new users (no role check needed)
    if (doc.isNew) {
      const adminController = require('../controller/adminController');
      await adminController.notifyNewUser(doc._id);
    }
  } catch (error) {
    console.error('Error in user post-save hook:', error);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);