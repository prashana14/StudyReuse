const express = require("express");
const router = express.Router();
const Barter = require("../models/barterModel");
const Item = require("../models/itemModel");
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/notificationModel");

// Create barter request
router.post("/", authMiddleware, async (req, res) => {
  const { itemId } = req.body;

  const item = await Item.findById(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

 // routes/barterRoutes.js - Line 15
const barter = new Barter({
  item: item._id,
  requester: req.user._id,
  owner: item.owner  // ✅ FIXED (was item.user)
});

  await barter.save();

  // Move Notification creation inside the async function
  await Notification.create({
    user: item.user,
    message: "You received a new barter request."
  });

  res.json({ message: "Barter request sent" });
});

// Get my barter requests
router.get("/my", authMiddleware, async (req, res) => {
  const requests = await Barter.find({
    $or: [
      { requester: req.user._id },
      { owner: req.user._id }
    ]
  }).populate("item requester owner", "title name email");

  // Example: send notification for each request if needed
  // await Notification.create({
  //   user: req.user._id,
  //   message: "Checked your barter requests."
  // });

  res.json(requests);
});

// Update barter status
router.put("/:id", authMiddleware, async (req, res) => {
  const { status } = req.body;

  const barter = await Barter.findById(req.params.id);
  if (!barter) return res.status(404).json({ message: "Request not found" });

  if (barter.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  barter.status = status;
  await barter.save();

  // Move Notification creation inside async function
  await Notification.create({
    user: barter.requester,
    message: `Your barter request was ${status}.`
  });

  res.json({ message: "Barter status updated" });
});

module.exports = router;
