const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  message: String
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
