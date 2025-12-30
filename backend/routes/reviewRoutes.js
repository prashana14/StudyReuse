const express = require("express");
const router = express.Router();
const Review = require("../models/reviewModel");
const Notification = require("../models/notificationModel");
const Item = require("../models/itemModel");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

console.log("✅ Review routes loaded");

// ==================== TEST ROUTE ====================
router.get("/test", (req, res) => {
  res.json({ 
    success: true,
    message: "Review API is working!",
    timestamp: new Date().toISOString()
  });
});

// ==================== DEBUG ROUTE ====================
router.get("/check/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.json({
        success: false,
        message: "Item not found in database"
      });
    }
    
    // Check if any reviews exist for this item
    const reviewCount = await Review.countDocuments({ item: itemId });
    
    res.json({
      success: true,
      itemExists: true,
      itemTitle: item.title,
      itemOwner: item.owner,
      reviewCountForItem: reviewCount,
      totalReviewsInDB: await Review.countDocuments({}),
      message: reviewCount === 0 
        ? "No reviews yet for this item. Submit one first!"
        : `Found ${reviewCount} reviews for this item`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== GET ROUTES ====================

// GET reviews for a specific item
router.get("/item/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    //console.log(`📡 GET /api/reviews/item/${itemId}`);

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    // Find reviews for this item
    const reviews = await Review.find({ item: itemId })
      .populate("reviewer", "name email profilePicture")
      .populate("reviewedUser", "name email")
      .sort({ createdAt: -1 });

    //console.log(`✅ Found ${reviews.length} reviews for item ${itemId}`);

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error("❌ Error fetching item reviews:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching item reviews",
      error: error.message
    });
  }
});

// GET reviews of a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
   // console.log(`📡 GET /api/reviews/${userId}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const reviews = await Review.find({
      reviewedUser: userId
    })
    .populate("reviewer", "name email profilePicture")
    .populate("item", "title imageURL")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error("❌ Error fetching user reviews:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching user reviews",
      error: error.message
    });
  }
});

// ==================== POST ROUTE ====================

// Add review
router.post("/", authMiddleware, async (req, res) => {
  try {
    //console.log("📡 POST /api/reviews", req.body);
    
    const { itemId, rating, comment } = req.body;

    // Validate required fields
    if (!itemId || !rating) {
      return res.status(400).json({
        success: false,
        message: "itemId and rating are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    // Get item details to find owner
    const item = await Item.findById(itemId).select('owner title');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    const reviewedUser = item.owner;

    // VALIDATION: Cannot review yourself
    if (reviewedUser.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot review your own item"
      });
    }

    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      item: itemId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this item"
      });
    }

    // Create review
    const review = new Review({
      reviewer: req.user._id,
      reviewedUser,
      item: itemId,
      rating,
      comment
    });

    await review.save();
    console.log(`✅ Review created: ${review._id}`);

    // Create notification
    await Notification.create({
      user: reviewedUser,
      type: 'system',
      title: 'New Review Received ⭐',
      message: `${req.user.name} reviewed your item "${item.title}" with ${rating} stars`,
      relatedUser: req.user._id,
      relatedItem: itemId,
      isRead: false
    });

    console.log(`✅ Notification created for user ${reviewedUser}`);

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review
    });
  } catch (error) {
    console.error("❌ Error adding review:", error.message);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this item"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message
    });
  }
});

module.exports = router;