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
    
    // QUANTITY FIELD - ADDED
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    
    // Category
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['books', 'notes', 'electronics', 'stationery', 'labreports', 'other'],
      default: 'books'
    },
    
    // Condition field
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
      default: 'good'
    },
    
    // Faculty field
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

    // Status field - UPDATED ENUM
    status: {
      type: String,
      enum: ['Available', 'Sold', 'Sold Out', 'Under Negotiation', 'Unavailable'],
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
  return this.image;
});

// Add virtual for availability - ADDED
itemSchema.virtual('isAvailable').get(function() {
  return this.status === 'Available' && this.quantity > 0;
});

// Add virtual for low stock warning - ADDED
itemSchema.virtual('isLowStock').get(function() {
  return this.quantity <= 3 && this.quantity > 0;
});

// Pre-save hook to update status based on quantity
itemSchema.pre('save', function(next) {
  // Update status based on quantity
  if (this.quantity <= 0 && this.status !== 'Sold Out') {
    this.status = 'Sold Out';
  } else if (this.quantity > 0 && this.status === 'Sold Out') {
    this.status = 'Available';
  }
  next();
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