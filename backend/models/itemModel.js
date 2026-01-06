const mongoose = require('mongoose');

const itemSchema = mongoose.Schema(
  {
    // Required fields
    title: { 
      type: String, 
      required: [true, 'Title is required'] 
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'] 
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    
    // Category - add enum if you have specific categories
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['books', 'notes', 'electronics', 'stationery', 'furniture', 'other'],
      default: 'books'
    },
    
    // Condition field - ADD THIS
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
      default: 'good'
    },
    
    // Faculty field - ADD THIS
    faculty: {
      type: String,
      enum: ['BBA', 'BITM', 'BBS', 'BBM', 'BBA-F', 'MBS', 'MBA', 'MITM', 'MBA-F', 'Other'],
      default: 'Other'
    },
    
    // Image field
    image: { 
      type: String, 
      required: [true, 'Image is required'] 
    },
    
    // Owner reference
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },

    // Status field
    status: {
      type: String,
      enum: ['Available', 'Sold', 'Under Negotiation', 'Unavailable'],
      default: 'Available'
    },
    
    // Approval fields
    isApproved: {
      type: Boolean,
      default: false
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    adminNotes: String,
    approvedAt: Date,
    
    // Additional useful fields
    views: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// Add virtual for image URL
itemSchema.virtual('imageURL').get(function() {
  if (this.image && this.image.startsWith('http')) {
    return this.image;
  }
  // If using Cloudinary or similar, add your logic here
  return this.image;
});

// Post-save hook
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

// Ensure virtuals are included in JSON
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);