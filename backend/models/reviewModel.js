const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: String
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
