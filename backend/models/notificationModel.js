// backend/models/notificationModel.js
const mongoose = require('mongoose'); // ADD THIS LINE

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
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
        "trade",
        "new_user",       // New user registered
        "new_item",       // New item added (pending)
        "new_order",      // New order placed
        "item_flag",      // Item flagged/reported
        "admin_alert"     // System alert for admin
      ],
      default: "message"
    },
    
    title: {
      type: String,
      default: "New Notification"
    },
    
    message: {
      type: String,
      required: true
    },
    
    // Click Action Fields
    action: {
      type: String,
      enum: [
        "view_item",
        "view_user",
        "view_order",
        "review_item",
        "view_message",
        "system",
        "none"
      ],
      default: "none"
    },
    
    actionData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    link: {
      type: String,
      default: null
    },
    
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    },
    
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    
    isRead: {
      type: Boolean,
      default: false
    },
    
    readAt: {
      type: Date,
      default: null
    },
    
    fromAdmin: {
      type: Boolean,
      default: false
    },
    
    adminAction: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);