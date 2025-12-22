const express = require("express");
const router = express.Router();
const Review = require("../models/reviewModel");
const Notification = require("../models/notificationModel"); // add Notification import
const authMiddleware = require("../middleware/authMiddleware");

// Add review
router.post("/", authMiddleware, async (req, res) => {
  const { reviewedUser, rating, comment } = req.body;

  const review = new Review({
    reviewer: req.user._id,
    reviewedUser,
    rating,
    comment
  });

  await review.save();

  // ✅ Move Notification.create inside async route
  await Notification.create({
    user: reviewedUser,
    message: "You received a new review."
  });

  res.json({ message: "Review added" });
});

// Get reviews of a user
router.get("/:userId", async (req, res) => {
  const reviews = await Review.find({
    reviewedUser: req.params.userId
  }).populate("reviewer", "name");

  res.json(reviews);
});

module.exports = router;
