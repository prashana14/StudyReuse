const express = require("express");
const router = express.Router();
const Barter = require("../models/barterModel");
const Item = require("../models/itemModel");
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/notificationModel");

// Create barter request - FIXED
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Check if trying to barter with own item
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot barter with your own item" });
    }

    // Check for duplicate pending request
    const existingBarter = await Barter.findOne({
      item: itemId,
      requester: req.user._id,
      status: "pending"
    });
    
    if (existingBarter) {
      return res.status(400).json({ message: "You already have a pending request for this item" });
    }
    
    const barter = new Barter({
      item: item._id,
      requester: req.user._id,
      owner: item.owner
    });

    await barter.save();

    // ✅ FIXED: Create COMPLETE notification with all required fields
    await Notification.create({
      user: item.owner,  // Who receives the notification
      type: "barter",    // Required by schema
      title: "New Barter Request",  // Required by schema
      message: `${req.user.name} wants to barter for your "${item.title}"`,
      relatedItem: itemId,  // Link to the item
      relatedUser: req.user._id,  // Who sent the request
      isRead: false  // Explicitly set as unread
    });

    console.log(`✅ Created notification for user ${item.owner} about barter request`);

    res.json({ 
      message: "Barter request sent successfully",
      barter: await Barter.findById(barter._id)
        .populate("item", "title")
        .populate("requester", "name")
        .populate("owner", "name")
    });
  } catch (error) {
    console.error("Error creating barter:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update barter status - FIXED
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "accepted", "rejected"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Valid status is required", 
        validStatuses 
      });
    }

    const barter = await Barter.findById(req.params.id);
    if (!barter) return res.status(404).json({ message: "Request not found" });

    // Check authorization - only owner can update
    if (barter.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    barter.status = status;
    await barter.save();

    // ✅ FIXED: Create complete notification for status change
    await Notification.create({
      user: barter.requester,
      type: "barter",
      title: "Barter Request Updated",
      message: `Your barter request was ${status} by ${req.user.name}.`,
      relatedItem: barter.item,
      relatedUser: req.user._id,
      isRead: false
    });

    res.json({ 
      message: `Barter request ${status}`,
      barter: await Barter.findById(barter._id)
        .populate("item", "title")
        .populate("requester", "name")
    });
  } catch (error) {
    console.error("Error updating barter:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get my barter requests (unchanged)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const requests = await Barter.find({
      $or: [
        { requester: req.user._id },
        { owner: req.user._id }
      ]
    })
    .populate("item", "title imageURL category condition price")
    .populate("requester", "name email")
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching barters:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;