const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reviewedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: String
}, { 
  timestamps: true,
  // Ensure one review per user per item
  indexes: [
    { 
      fields: { reviewer: 1, item: 1 }, 
      unique: true 
    }
  ]
});

module.exports = mongoose.model("Review", reviewSchema);