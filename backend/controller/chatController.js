const mongoose = require("mongoose");
const Message = require("../models/messageModel");
const Item = require("../models/itemModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const NotificationService = require("../services/notificationService");

// ======================
// 1. Send Message & Create/Get Chat
// ======================
exports.sendMessage = async (req, res) => {
  try {
    const { itemId, receiverId, message } = req.body;
    const senderId = req.user._id;

    console.log('📩 [CHAT CONTROLLER] Creating message:', {
      itemId,
      senderId,
      receiverId,
      message
    });

    // Validate required fields
    if (!itemId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: "itemId, receiverId, and message are required"
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found"
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Find or create chat
    let chat = await Chat.findOne({
      item: itemId,
      participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
      chat = new Chat({
        item: itemId,
        participants: [senderId, receiverId],
        messages: []
      });
      await chat.save();
    }

    // Create message
    const newMessage = new Message({
      chat: chat._id,
      item: itemId,
      sender: senderId,
      receiver: receiverId,
      message: message
    });

    await newMessage.save();

    // Add message to chat
    chat.messages.push(newMessage._id);
    chat.lastMessage = newMessage._id;
    await chat.save();

    // Populate response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name email profilePicture")
      .populate("receiver", "name email profilePicture")
      .populate("item", "title images price");

    // Send notification
    try {
      await NotificationService.notifyNewMessage(
        receiverId,
        senderId,
        req.user.name || "User",
        message
      );
    } catch (notifError) {
      console.warn("Notification failed:", notifError.message);
    }

    res.status(201).json({
      success: true,
      data: {
        message: populatedMessage,
        chat: chat
      },
      message: "Message sent successfully"
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 2. Get Chat by ID
// ======================
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Check if chatId is valid
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID format"
      });
    }

    // Find chat with populated data
    const chat = await Chat.findById(chatId)
      .populate("item", "title images price")
      .populate("participants", "name email profilePicture")
      .populate({
        path: "messages",
        populate: [
          { path: "sender", select: "name email profilePicture" },
          { path: "receiver", select: "name email profilePicture" },
          { path: "item", select: "title images price" }
        ],
        options: { sort: { createdAt: 1 } }
      });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Calculate unread count
    const unreadCount = await Message.countDocuments({
      _id: { $in: chat.messages },
      receiver: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        ...chat.toObject(),
        unreadCount,
        currentUserId: userId
      }
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error fetching chat:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 3. Get Chat by Item ID (Legacy support)
// ======================
exports.getChatByItemId = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Find all chats for this item where user is a participant
    const chats = await Chat.find({
      item: itemId,
      participants: userId
    })
    .populate("participants", "name email profilePicture")
    .populate({
      path: "messages",
      populate: [
        { path: "sender", select: "name email profilePicture" },
        { path: "receiver", select: "name email profilePicture" }
      ],
      options: { sort: { createdAt: 1 } }
    })
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: chats
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error fetching chats by item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chats",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 4. Get All Chats for Current User
// ======================
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all chats where user is a participant
    const chats = await Chat.find({
      participants: userId
    })
    .populate("item", "title images price status")
    .populate("participants", "name email profilePicture")
    .populate({
      path: "lastMessage",
      populate: [
        { path: "sender", select: "name profilePicture" },
        { path: "receiver", select: "name profilePicture" }
      ]
    })
    .sort({ updatedAt: -1 });

    // Calculate unread counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          _id: { $in: chat.messages },
          receiver: userId,
          isRead: false
        });

        // Find other participant
        const otherParticipant = chat.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        return {
          _id: chat._id,
          item: chat.item,
          otherParticipant,
          lastMessage: chat.lastMessage,
          unreadCount,
          messageCount: chat.messages.length,
          updatedAt: chat.updatedAt
        };
      })
    );

    res.json({
      success: true,
      data: chatsWithUnread
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error fetching user chats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chats",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 5. Create or Get Existing Chat
// ======================
exports.createOrGetChat = async (req, res) => {
  try {
    const { itemId, receiverId } = req.body;
    const senderId = req.user._id;

    // Validate
    if (!itemId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "itemId and receiverId are required"
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found"
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      item: itemId,
      participants: { $all: [senderId, receiverId] }
    })
    .populate("item", "title images price")
    .populate("participants", "name email profilePicture");

    // If no chat exists, create one
    if (!chat) {
      chat = new Chat({
        item: itemId,
        participants: [senderId, receiverId],
        messages: []
      });
      await chat.save();
      
      // Populate after save
      chat = await Chat.findById(chat._id)
        .populate("item", "title images price")
        .populate("participants", "name email profilePicture");
    }

    res.json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error creating/getting chat:", error);
    res.status(500).json({
      success: false,
      message: "Error creating chat",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 6. Mark Messages as Read
// ======================
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Update all unread messages in this chat
    const result = await Message.updateMany(
      {
        chat: chatId,
        receiver: userId,
        isRead: false
      },
      {
        $set: { 
          isRead: true, 
          readAt: new Date() 
        }
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating messages",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 7. Delete Chat
// ======================
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Find chat and check ownership
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied"
      });
    }

    // Delete all messages in this chat
    await Message.deleteMany({ chat: chatId });
    
    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    res.json({
      success: true,
      message: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error deleting chat:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting chat",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 8. Get Unread Count
// ======================
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all chats where user is a participant
    const chats = await Chat.find({ participants: userId });
    const chatIds = chats.map(chat => chat._id);

    // Count unread messages across all chats
    const unreadCount = await Message.countDocuments({
      chat: { $in: chatIds },
      receiver: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error("❌ [CHAT CONTROLLER] Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ======================
// 9. Test Endpoint
// ======================
exports.testConnection = (req, res) => {
  res.json({
    success: true,
    message: "Chat API is working",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
};