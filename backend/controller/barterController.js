const Barter = require("../models/barterModel");
const Item = require("../models/itemModel");
const Notification = require("../models/notificationModel");

// Create barter request
exports.createBarterRequest = async (req, res) => {
  try {
    const { itemId, offerItemId, message } = req.body;

    // Validate required fields
    if (!itemId || !offerItemId) {
      return res.status(400).json({ 
        success: false,
        message: "Item ID and Offer Item ID are required" 
      });
    }

    // Find the item user wants
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: "Item not found" 
      });
    }

    // Find the item user is offering
    const offerItem = await Item.findById(offerItemId);
    if (!offerItem) {
      return res.status(404).json({ 
        success: false,
        message: "Offer item not found" 
      });
    }

    // Check if offer item belongs to requester
    if (offerItem.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "You can only offer your own items for barter" 
      });
    }

    // Check if trying to barter with own item
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot barter with your own item" 
      });
    }

    // Check if offer item is available for barter
    if (offerItem.status !== "available" && offerItem.status !== "Available") {
      return res.status(400).json({ 
        success: false,
        message: "Your offer item is not available for barter" 
      });
    }

    // Check if target item is available
    if (item.status !== "available" && item.status !== "Available") {
      return res.status(400).json({ 
        success: false,
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
        success: false,
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
};

// ✅ ADD THIS: Accept barter request (for /:id/accept endpoint)
exports.acceptBarter = async (req, res) => {
  try {
    const barter = await Barter.findById(req.params.id)
      .populate("item", "title")
      .populate("offerItem", "title")
      .populate("requester", "name")
      .populate("owner", "name");
    
    if (!barter) {
      return res.status(404).json({ 
        success: false,
        message: "Barter request not found" 
      });
    }

    // Check authorization - only owner can accept
    if (barter.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to accept this barter request" 
      });
    }

    // Check if barter is pending
    if (barter.status !== "pending") {
      return res.status(400).json({ 
        success: false,
        message: `Cannot accept. Barter is already ${barter.status}` 
      });
    }

    // Update both items to reserved
    await Item.findByIdAndUpdate(barter.item._id, { 
      status: "reserved",
      updatedAt: Date.now()
    });

    await Item.findByIdAndUpdate(barter.offerItem._id, { 
      status: "reserved",
      updatedAt: Date.now()
    });

    // Update barter status
    barter.status = "accepted";
    await barter.save();

    // Create notification for requester
    await Notification.create({
      user: barter.requester._id,
      type: "barter",
      title: "Barter Request Accepted! 🎉",
      message: `Great news! ${req.user.name} has accepted your barter request for "${barter.item.title}". Both items are now reserved.`,
      relatedItem: barter.item._id,
      relatedUser: req.user._id,
      isRead: false
    });

    res.json({ 
      success: true,
      message: "Barter request accepted successfully. Both items are now reserved.",
      barter: await Barter.findById(barter._id)
        .populate("item", "title imageURL category condition price status")
        .populate("offerItem", "title imageURL category condition price status")
        .populate("requester", "name email")
        .populate("owner", "name email")
    });

  } catch (error) {
    console.error("❌ Error accepting barter:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// ✅ ADD THIS: Reject barter request (for /:id/reject endpoint)
exports.rejectBarter = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const barter = await Barter.findById(req.params.id)
      .populate("item", "title")
      .populate("offerItem", "title")
      .populate("requester", "name")
      .populate("owner", "name");
    
    if (!barter) {
      return res.status(404).json({ 
        success: false,
        message: "Barter request not found" 
      });
    }

    // Check authorization - only owner can reject
    if (barter.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to reject this barter request" 
      });
    }

    // Check if barter is pending
    if (barter.status !== "pending") {
      return res.status(400).json({ 
        success: false,
        message: `Cannot reject. Barter is already ${barter.status}` 
      });
    }

    // Update barter status
    barter.status = "rejected";
    barter.rejectionReason = reason;
    await barter.save();

    // Create notification for requester
    await Notification.create({
      user: barter.requester._id,
      type: "barter",
      title: "Barter Request Rejected",
      message: `${req.user.name} has rejected your barter request for "${barter.item.title}"${reason ? `: ${reason}` : ''}`,
      relatedItem: barter.item._id,
      relatedUser: req.user._id,
      isRead: false
    });

    res.json({ 
      success: true,
      message: "Barter request rejected",
      barter: await Barter.findById(barter._id)
        .populate("item", "title imageURL category condition price status")
        .populate("offerItem", "title imageURL category condition price status")
        .populate("requester", "name email")
        .populate("owner", "name email")
    });

  } catch (error) {
    console.error("❌ Error rejecting barter:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// ✅ ADD THIS: Cancel barter request (for /:id/cancel endpoint)
exports.cancelBarter = async (req, res) => {
  try {
    const barter = await Barter.findById(req.params.id)
      .populate("item", "title")
      .populate("owner", "name");
    
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
        message: "Only the requester can cancel this barter request" 
      });
    }

    // Check if barter is pending
    if (barter.status !== "pending") {
      return res.status(400).json({ 
        success: false,
        message: `Cannot cancel. Barter is already ${barter.status}` 
      });
    }

    await barter.deleteOne();

    // Create notification for owner
    await Notification.create({
      user: barter.owner._id,
      type: "barter",
      title: "Barter Request Cancelled",
      message: `${req.user.name} has cancelled their barter request for "${barter.item.title}"`,
      relatedItem: barter.item._id,
      relatedUser: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      message: "Barter request cancelled successfully"
    });

  } catch (error) {
    console.error("❌ Error cancelling barter:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// Update barter status (general update endpoint - PUT /:id)
exports.updateBarterStatus = async (req, res) => {
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

    const barter = await Barter.findById(req.params.id)
      .populate("item", "title")
      .populate("offerItem", "title")
      .populate("requester", "name")
      .populate("owner", "name");
    
    if (!barter) {
      return res.status(404).json({ 
        success: false,
        message: "Barter request not found" 
      });
    }

    // Check authorization - only owner can update
    if (barter.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this barter request" 
      });
    }

    // Update item statuses when barter is accepted
    if (status === "accepted" && barter.status !== "accepted") {
      const item = await Item.findById(barter.item._id);
      const offerItem = await Item.findById(barter.offerItem._id);
      
      if (item) {
        item.status = "reserved";
        await item.save();
      }
      
      if (offerItem) {
        offerItem.status = "reserved";
        await offerItem.save();
      }
    }

    // Revert item statuses if barter is rejected from accepted state
    if (status === "rejected" && barter.status === "accepted") {
      const item = await Item.findById(barter.item._id);
      const offerItem = await Item.findById(barter.offerItem._id);
      
      if (item && item.status === "reserved") {
        item.status = "available";
        await item.save();
      }
      
      if (offerItem && offerItem.status === "reserved") {
        offerItem.status = "available";
        await offerItem.save();
      }
    }

    barter.status = status;
    await barter.save();

    // Create notification for requester
    await Notification.create({
      user: barter.requester._id,
      type: "barter",
      title: "Barter Request Updated",
      message: `Your barter request for "${barter.item.title}" was ${status} by ${req.user.name}.`,
      relatedItem: barter.item._id,
      relatedUser: req.user._id,
      isRead: false
    });

    res.json({ 
      success: true,
      message: `Barter request ${status}`,
      barter: await Barter.findById(barter._id)
        .populate("item", "title imageURL category condition price status")
        .populate("offerItem", "title imageURL category condition price status")
        .populate("requester", "name email")
        .populate("owner", "name email")
    });

  } catch (error) {
    console.error("❌ Error updating barter:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// Get my barter requests
exports.getMyBarters = async (req, res) => {
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
};

// Get single barter request
exports.getBarterById = async (req, res) => {
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
    if (barter.requester._id.toString() !== userId && 
        barter.owner._id.toString() !== userId) {
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
};

// Cancel/withdraw barter request (DELETE endpoint)
exports.deleteBarter = async (req, res) => {
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
};