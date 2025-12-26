const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    // ===== ADD TYPE FIELD =====
    type: {
      type: String,
      enum: [
        "message", 
        "item_approved", 
        "item_rejected", 
        "user_blocked", 
        "user_verified", 
        "system", 
        "barter", 
        "trade"
      ],
      default: "message"
    },
    // ==========================
    
    // ===== ADD TITLE FIELD =====
    title: {
      type: String,
      default: "New Notification"
    },
    // ===========================
    
    message: {
      type: String,
      required: true
    },
    
    // ===== ADD THESE OPTIONAL FIELDS =====
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    },
    
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    // =====================================
    
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);