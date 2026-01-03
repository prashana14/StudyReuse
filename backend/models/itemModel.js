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

    // ===== ADD THIS STATUS FIELD =====
    status: {
      type: String,
      enum: ['Available', 'Sold', 'Under Negotiation', 'Unavailable'],
      default: 'Available'
    },
    
    
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
// Add this at the end of backend/models/itemModel.js, before the export
itemSchema.post('save', async function(doc, next) {
  try {
    // Only notify for new pending items (not when updating)
    if (doc.isNew && !doc.isApproved && !doc.isFlagged) {
      const adminController = require('../controller/adminController');
      await adminController.notifyNewItem(doc._id);
    }
  } catch (error) {
    console.error('Error in item post-save hook:', error);
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);