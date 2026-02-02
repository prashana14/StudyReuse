const express = require("express");
const router = express.Router();
const Barter = require("../models/barterModel");
const Item = require("../models/itemModel");
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/notificationModel");

// Create barter request with offer item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { itemId, offerItemId, message } = req.body;

    // Validate required fields
    if (!itemId || !offerItemId) {
      return res.status(400).json({ 
        message: "Item ID and Offer Item ID are required" 
      });
    }

    // Find the item user wants
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Find the item user is offering
    const offerItem = await Item.findById(offerItemId);
    if (!offerItem) {
      return res.status(404).json({ message: "Offer item not found" });
    }

    // Check if offer item belongs to requester
    if (offerItem.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "You can only offer your own items for barter" 
      });
    }

    // Check if trying to barter with own item
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: "Cannot barter with your own item" 
      });
    }

    // Check if offer item is available for barter
    if (offerItem.status !== "available") {
      return res.status(400).json({ 
        message: "Your offer item is not available for barter" 
      });
    }

    // Check if target item is available
    if (item.status !== "available") {
      return res.status(404).json({ 
        message: "This item is not available for barter" 
      });
    }

    // Check for duplicate pending request for same items
    const existingBarter = await Barter.findOne({
      item: itemId,
      offerItem: offerItemId,
      requester: req.user._id,
      status: "pending"
    });
    
    if (existingBarter) {
      return res.status(400).json({ 
        message: "You already have a pending barter request with these items" 
      });
    }

    // Create new barter request
    const barter = new Barter({
      item: item._id,
      offerItem: offerItem._id,
      requester: req.user._id,
      owner: item.owner,
      message: message || `I'd like to exchange my "${offerItem.title}" for your "${item.title}"`
    });

    await barter.save();

    // Create notification for item owner
    await Notification.create({
      user: item.owner,
      type: "barter",
      title: "New Barter Request",
      message: `${req.user.name} wants to trade "${offerItem.title}" for your "${item.title}"`,
      relatedItem: itemId,
      relatedUser: req.user._id,
      isRead: false
    });

    // Populate the response
    const populatedBarter = await Barter.findById(barter._id)
      .populate("item", "title imageURL category condition price status")
      .populate("offerItem", "title imageURL category condition price status")
      .populate("requester", "name email")
      .populate("owner", "name email");

    res.status(201).json({ 
      success: true,
      message: "Barter request sent successfully",
      barter: populatedBarter
    });

  } catch (error) {
    console.error("❌ Error creating barter:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// Update barter status - COMPLETELY FIXED VERSION
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "accepted", "rejected"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Valid status is required", 
        validStatuses 
      });
    }

    // Find barter with ALL required fields
    const barter = await Barter.findById(req.params.id)
      .select("item offerItem requester owner status")
      .lean(); // Use lean() to get plain JavaScript object
    
    if (!barter) {
      console.log(`❌ Barter not found: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: "Barter request not found" 
      });
    }

    // Check authorization - only owner can update
    const ownerId = barter.owner?.toString();
    const userId = req.user._id.toString();
    
    if (!ownerId || ownerId !== userId) {
      console.log(`❌ Unauthorized: User ${userId} trying to update barter owned by ${ownerId}`);
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this barter request" 
      });
    }

    console.log(`🔄 Updating barter ${req.params.id} to status: ${status}`);
    console.log(`📦 Barter data:`, {
      item: barter.item,
      offerItem: barter.offerItem,
      owner: barter.owner,
      currentStatus: barter.status
    });

    // Validate that all required fields exist
    if (!barter.item || !barter.offerItem) {
      console.error(`❌ Missing required fields in barter:`, barter);
      return res.status(400).json({
        success: false,
        message: "Barter data is incomplete. Missing item or offerItem reference."
      });
    }

    // Update item statuses when barter is accepted
    if (status === "accepted" && barter.status !== "accepted") {
      console.log("📦 Marking items as reserved...");
      
      try {
        // Find and update items
        await Item.findByIdAndUpdate(barter.item, { 
          status: "reserved" 
        }, { new: true });
        
        await Item.findByIdAndUpdate(barter.offerItem, { 
          status: "reserved" 
        }, { new: true });
        
        console.log(`✅ Items ${barter.item} and ${barter.offerItem} marked as reserved`);
      } catch (itemError) {
        console.error("❌ Error updating item statuses:", itemError);
        return res.status(500).json({
          success: false,
          message: "Failed to update item statuses",
          error: itemError.message
        });
      }
    }

    // Revert item statuses if barter is rejected from accepted state
    if (status === "rejected" && barter.status === "accepted") {
      console.log("🔄 Reverting items to available...");
      
      try {
        await Item.findByIdAndUpdate(barter.item, { 
          status: "available" 
        }, { new: true });
        
        await Item.findByIdAndUpdate(barter.offerItem, { 
          status: "available" 
        }, { new: true });
        
        console.log(`✅ Items ${barter.item} and ${barter.offerItem} reverted to available`);
      } catch (itemError) {
        console.error("❌ Error reverting item statuses:", itemError);
        return res.status(500).json({
          success: false,
          message: "Failed to revert item statuses",
          error: itemError.message
        });
      }
    }

    // Update barter status - use findByIdAndUpdate to avoid validation issues
    const updatedBarter = await Barter.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true, runValidators: true }
    );

    if (!updatedBarter) {
      console.error(`❌ Failed to update barter ${req.params.id}`);
      return res.status(500).json({
        success: false,
        message: "Failed to update barter status"
      });
    }

    console.log(`✅ Barter ${req.params.id} updated to ${status}`);

    // Get populated barter for response
    const populatedBarter = await Barter.findById(updatedBarter._id)
      .populate("item", "title imageURL category condition price status")
      .populate("offerItem", "title imageURL category condition price status")
      .populate("requester", "name email")
      .populate("owner", "name email");

    // Create notification for requester
    await Notification.create({
      user: barter.requester,
      type: "barter",
      title: "Barter Request Updated",
      message: `Your barter request was ${status}.`,
      relatedItem: barter.item,
      relatedUser: req.user._id,
      isRead: false
    });

    console.log(`📧 Notification sent to requester`);
    
    res.json({ 
      success: true,
      message: `Barter request ${status}`,
      barter: populatedBarter
    });

  } catch (error) {
    console.error("❌ Error updating barter:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      errors: error.errors,
      stack: error.stack
    });
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Update barter status - Simplified alternative endpoint
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "accepted", "rejected"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Valid status is required", 
        validStatuses 
      });
    }

    // Use findByIdAndUpdate directly to avoid issues
    const updatedBarter = await Barter.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true, runValidators: true }
    );
    
    if (!updatedBarter) {
      return res.status(404).json({ 
        success: false,
        message: "Barter request not found" 
      });
    }

    // Check authorization - only owner can update
    if (updatedBarter.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this barter request" 
      });
    }

    // Update item statuses when barter is accepted
    if (status === "accepted" && updatedBarter.status !== "accepted") {
      try {
        await Item.findByIdAndUpdate(updatedBarter.item, { 
          status: "reserved" 
        });
        
        await Item.findByIdAndUpdate(updatedBarter.offerItem, { 
          status: "reserved" 
        });
      } catch (itemError) {
        console.error("Error updating item statuses:", itemError);
      }
    }

    // Revert item statuses if barter is rejected from accepted state
    if (status === "rejected" && updatedBarter.status === "accepted") {
      try {
        await Item.findByIdAndUpdate(updatedBarter.item, { 
          status: "available" 
        });
        
        await Item.findByIdAndUpdate(updatedBarter.offerItem, { 
          status: "available" 
        });
      } catch (itemError) {
        console.error("Error reverting item statuses:", itemError);
      }
    }

    // Populate response
    const populatedBarter = await Barter.findById(updatedBarter._id)
      .populate("item", "title imageURL category condition price status")
      .populate("offerItem", "title imageURL category condition price status")
      .populate("requester", "name email")
      .populate("owner", "name email");

    // Create notification
    await Notification.create({
      user: updatedBarter.requester,
      type: "barter",
      title: "Barter Request Updated",
      message: `Your barter request was ${status}.`,
      relatedItem: updatedBarter.item,
      relatedUser: req.user._id,
      isRead: false
    });

    res.json({ 
      success: true,
      message: `Barter request ${status}`,
      barter: populatedBarter
    });

  } catch (error) {
    console.error("❌ Error updating barter status:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get my barter requests
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const requests = await Barter.find({
      $or: [
        { requester: req.user._id },
        { owner: req.user._id }
      ]
    })
    .populate("item", "title imageURL category condition price status")
    .populate("offerItem", "title imageURL category condition price status")
    .populate("requester", "name email")
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error("❌ Error fetching barters:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get single barter request
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const barter = await Barter.findById(req.params.id)
      .populate("item", "title imageURL category condition price status")
      .populate("offerItem", "title imageURL category condition price status")
      .populate("requester", "name email")
      .populate("owner", "name email");
    
    if (!barter) {
      return res.status(404).json({ 
        success: false,
        message: "Barter request not found" 
      });
    }

    // Check if user is involved in this barter
    const userId = req.user._id.toString();
    const requesterId = barter.requester._id.toString();
    const ownerId = barter.owner._id.toString();
    
    if (requesterId !== userId && ownerId !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this barter request" 
      });
    }

    res.json({
      success: true,
      data: barter
    });

  } catch (error) {
    console.error("❌ Error fetching barter:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Cancel/withdraw barter request (requester only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const barter = await Barter.findById(req.params.id);
    
    if (!barter) {
      return res.status(404).json({ 
        success: false,
        message: "Barter request not found" 
      });
    }

    // Check if user is the requester
    if (barter.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Only the requester can withdraw this barter request" 
      });
    }

    // Check if barter is already accepted
    if (barter.status === "accepted") {
      return res.status(400).json({ 
        success: false,
        message: "Cannot withdraw an accepted barter request" 
      });
    }

    await barter.deleteOne();

    // Create notification for owner
    await Notification.create({
      user: barter.owner,
      type: "barter",
      title: "Barter Request Withdrawn",
      message: `${req.user.name} has withdrawn their barter request.`,
      relatedItem: barter.item,
      relatedUser: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      message: "Barter request withdrawn successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting barter:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

module.exports = router;