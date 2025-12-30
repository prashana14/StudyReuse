const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const chatController = require("../controller/chatController");

// ======================
// 1. Message & Chat Routes
// ======================

// Send message (creates chat if doesn't exist)
router.post("/", authMiddleware, chatController.sendMessage);

// Create or get existing chat
router.post("/create", authMiddleware, chatController.createOrGetChat);

// Get chat by ID
router.get("/:chatId", authMiddleware, chatController.getChatById);

// Get chats by item ID (legacy support)
router.get("/item/:itemId", authMiddleware, chatController.getChatByItemId);

// Get all chats for current user
router.get("/user/chats", authMiddleware, chatController.getUserChats);

// Mark messages as read in a chat
router.patch("/:chatId/read", authMiddleware, chatController.markMessagesAsRead);

// Get total unread messages count
router.get("/user/unread", authMiddleware, chatController.getUnreadCount);

// Delete a chat
router.delete("/:chatId", authMiddleware, chatController.deleteChat);

// Test endpoint
router.get("/test/connection", chatController.testConnection);

module.exports = router;