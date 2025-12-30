const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  unreadCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Add indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ item: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ "participants.userId": 1, updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);