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
      zipCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      notes: String
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Credit Card', 'PayPal'],
      default: 'Cash on Delivery'
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    notes: String
  },
  {
    timestamps: true,
  }
);

// Update item status when order is placed
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Item = mongoose.model('Item');
      
      // Update each item's status to 'Sold'
      for (const orderItem of this.items) {
        await Item.findByIdAndUpdate(orderItem.item, {
          status: 'Sold',
          $set: { updatedAt: new Date() }
        });
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);