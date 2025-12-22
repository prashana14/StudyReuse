const mongoose = require("mongoose");

const barterSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Barter", barterSchema);
