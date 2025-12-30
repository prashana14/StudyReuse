const mongoose = require("mongoose");
require("dotenv").config();
const Message = require("./models/messageModel");
const Chat = require("./models/chatModel");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    
    // Get all messages
    const messages = await Message.find()
      .populate("sender receiver item");
    
    console.log(`Found ${messages.length} messages to migrate`);
    
    // Group messages by item and participants
    const chatMap = new Map();
    
    for (const msg of messages) {
      const participants = [msg.sender._id, msg.receiver._id].sort().join("-");
      const key = `${msg.item._id}-${participants}`;
      
      if (!chatMap.has(key)) {
        const chat = new Chat({
          item: msg.item._id,
          participants: [msg.sender._id, msg.receiver._id],
          messages: [msg._id],
          lastMessage: msg._id
        });
        chatMap.set(key, chat);
      } else {
        const chat = chatMap.get(key);
        chat.messages.push(msg._id);
        chat.lastMessage = msg._id;
      }
    }
    
    // Save all chats
    console.log(`Creating ${chatMap.size} chats...`);
    const chats = Array.from(chatMap.values());
    for (const chat of chats) {
      await chat.save();
    }
    
    // Update messages with chat references
    console.log("Updating messages with chat references...");
    for (const chat of chats) {
      await Message.updateMany(
        { _id: { $in: chat.messages } },
        { $set: { chat: chat._id } }
      );
    }
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();