const express = require("express");
const router = express.Router();
const barterController = require("../controller/barterController");
const authMiddleware = require("../middleware/authMiddleware");

// Create barter request
router.post("/", authMiddleware, barterController.createBarterRequest);

// ✅ NOW YOU CAN UNCOMMENT THESE - they exist in your controller
// Accept barter request
router.put("/:id/accept", authMiddleware, barterController.acceptBarter);

// Reject barter request
router.put("/:id/reject", authMiddleware, barterController.rejectBarter);

// Cancel barter request
router.put("/:id/cancel", authMiddleware, barterController.cancelBarter);

// General update barter status (still works for backward compatibility)
router.put("/:id", authMiddleware, barterController.updateBarterStatus);

// Get my barter requests
router.get("/my", authMiddleware, barterController.getMyBarters);

// Get single barter request
router.get("/:id", authMiddleware, barterController.getBarterById);

// Delete barter request
router.delete("/:id", authMiddleware, barterController.deleteBarter);

module.exports = router;