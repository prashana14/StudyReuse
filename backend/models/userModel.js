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

    // ✅ ADD THESE TWO
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    isBlocked: {
      type: Boolean,
      default: false
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

// Add this at the end of backend/models/userModel.js, before the export
userSchema.post('save', async function(doc, next) {
  try {
    // Only notify for new users (not admins) and not when updating
    if (doc.role === 'user' && doc.isNew) {
      const adminController = require('../controller/adminController');
      await adminController.notifyNewUser(doc._id);
    }
  } catch (error) {
    console.error('Error in user post-save hook:', error);
  }
  next();
});
module.exports = mongoose.model("User", userSchema);
