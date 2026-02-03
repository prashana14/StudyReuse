const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    items: [{
      item: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Item', 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true, 
        default: 1,
        min: 1
      },
      price: { 
        type: Number, 
        required: true 
      },
      itemSnapshot: {
        title: String,
        price: Number,
        quantity: Number,
        imageURL: String
      }
    }],
    totalAmount: { 
      type: Number, 
      required: true,
      min: 0
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'Nepal' },
      notes: String
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery'], // REMOVED other options, only Cash on Delivery
      default: 'Cash on Delivery'
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    notes: String,
    
    // Additional fields for better tracking
    taxAmount: {
      type: Number,
      default: 0
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    
    // Tracking information
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    
    // Admin notes
    adminNotes: String,
    cancelledReason: String
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted total amount
orderSchema.virtual('formattedTotal').get(function() {
  return `₹${this.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Pre-save hook to calculate total amount with tax
orderSchema.pre('save', function(next) {
  // Calculate subtotal from items
  const subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Calculate total amount
  this.totalAmount = subtotal + (this.shippingFee || 0) - (this.discount || 0);
  
  // Ensure total amount is not negative
  if (this.totalAmount < 0) {
    this.totalAmount = 0;
  }
  
  next();
});

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shippingAddress.city': 1 });

module.exports = mongoose.model('Order', orderSchema);