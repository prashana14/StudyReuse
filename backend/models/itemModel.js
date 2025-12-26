const mongoose = require('mongoose');

const itemSchema = mongoose.Schema(
  {
    // ... your existing fields ...
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    image: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // ===== ADD THESE 5 FIELDS =====
    isApproved: {
      type: Boolean,
      default: false  // Items need admin approval
    },
    isFlagged: {
      type: Boolean,
      default: false  // Marked as inappropriate
    },
    flagReason: String,   // Why item was rejected
    adminNotes: String,   // Admin internal notes
    approvedAt: Date      // When item was approved
    // ==============================
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);