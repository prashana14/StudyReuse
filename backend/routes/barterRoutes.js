const express = require("express");
const router = express.Router();
const barterController = require("../controller/barterController");
const authMiddleware = require("../middleware/authMiddleware");

// Create barter request
router.post("/", authMiddleware, barterController.createBarterRequest);

// Update barter status
router.put("/:id", authMiddleware, barterController.updateBarterStatus);

// Get my barter requests
router.get("/my", authMiddleware, barterController.getMyBarters);

// Get single barter request
router.get("/:id", authMiddleware, barterController.getBarterById);

// Cancel/withdraw barter request
router.delete("/:id", authMiddleware, barterController.deleteBarter);

module.exports = router;