import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import chatPollingService from "../services/chatPollingService";

const ChatBox = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [itemLoading, setItemLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);
  const [itemDetails, setItemDetails] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Safe get current user
  const getCurrentUser = useCallback(() => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }, []);

  const currentUser = useMemo(() => getCurrentUser(), [getCurrentUser]);

  // Function to fetch messages for a specific chat
  const fetchChatMessages = useCallback(async (specificChatId = null) => {
    const targetChatId = specificChatId || chatId;
    if (!targetChatId) {
      console.log("⚠️ No chat ID for polling");
      return;
    }

    try {
      console.log(`📨 Polling messages for chat: ${targetChatId}`);
      const response = await API.get(`/chat/${targetChatId}`);
      
      // Since API interceptor returns response.data directly
      if (response?.success && response.data?.messages) {
        const newMessages = response.data.messages;
        setMessages(newMessages);
        console.log(`🔄 Received ${newMessages.length} messages`);
        
        // Mark messages as read
        API.patch(`/chat/${targetChatId}/read`).catch(err => 
          console.log("⚠️ Could not mark as read:", err.message)
        );
        
        // Reset retry count on success
        setRetryCount(0);
      }
    } catch (err) {
      console.log(`⚠️ Polling error for chat ${targetChatId}:`, err.message);
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // If too many retries, stop polling
      if (retryCount > 5) {
        chatPollingService.stopPolling(targetChatId);
        setPollingActive(false);
        console.log("🛑 Too many polling errors, stopping");
      }
    }
  }, [chatId, retryCount]);

  // Find or create chat
  const findOrCreateChat = useCallback(async () => {
    if (!itemId || !currentUser) return null;

    try {
      // First try to get existing chat
      console.log(`🔍 Looking for existing chat for item: ${itemId}`);
      const response = await API.get(`/chat/item/${itemId}`);
      
      // response is already the data object from interceptor
      if (response?.success && response.data) {
        let chats = response.data;
        
        if (Array.isArray(chats) && chats.length > 0) {
          const chat = chats[0];
          console.log(`✅ Found existing chat: ${chat._id}`);
          return chat._id;
        }
      }
      
      // No existing chat found
      console.log("🆕 No existing chat found");
      return null;
    } catch (chatErr) {
      if (chatErr.response?.status === 404) {
        console.log("🔍 No chat found (404) - This is normal");
        return null;
      }
      console.error("❌ Error finding chat:", chatErr);
      return null;
    }
  }, [itemId, currentUser]);

  // Load initial messages for a chat
  const loadInitialMessages = useCallback(async (targetChatId) => {
    if (!targetChatId) return;
    
    try {
      setChatLoading(true);
      console.log(`📂 Loading initial messages for chat: ${targetChatId}`);
      const response = await API.get(`/chat/${targetChatId}`);
      
      if (response?.success) {
        const chatData = response.data;
        
        // Set messages
        if (chatData.messages && Array.isArray(chatData.messages)) {
          setMessages(chatData.messages);
          console.log(`✅ Loaded ${chatData.messages.length} messages`);
        }
        
        // Find other participant
        if (currentUser && chatData.participants) {
          const currentUserId = currentUser.id || currentUser._id;
          const otherParticipant = chatData.participants.find(p => {
            const participantId = p._id || p;
            return participantId?.toString() !== currentUserId?.toString();
          });
          
          if (otherParticipant) {
            console.log("👤 Found other participant:", otherParticipant);
            setOtherUser(otherParticipant);
          }
        }
      }
    } catch (err) {
      console.error("❌ Error loading messages:", err);
    } finally {
      setChatLoading(false);
    }
  }, [currentUser]);

  // Fetch item details
  const fetchItemDetails = useCallback(async () => {
    if (!itemId) return;
    
    try {
      setItemLoading(true);
      console.log(`📦 Fetching item: ${itemId}`);
      const itemResponse = await API.get(`/items/${itemId}`);
      
      if (itemResponse?.success) {
        const itemData = itemResponse.data;
        console.log("✅ Item loaded:", itemData);
        setItemDetails(itemData);
      } else {
        setError("Item details not available");
      }
    } catch (err) {
      console.error("❌ Error loading item:", err);
      if (err.response?.status === 404) {
        setError("Item not found. It may have been removed.");
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setItemLoading(false);
    }
  }, [itemId, navigate]);

  // Initialize chat
  const initializeChat = useCallback(async () => {
    if (!itemId || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // 1. Fetch item details
      await fetchItemDetails();
      
      // 2. Find or create chat
      const foundChatId = await findOrCreateChat();
      
      if (foundChatId) {
        setChatId(foundChatId);
        
        // 3. Load initial messages
        await loadInitialMessages(foundChatId);
        
        // 4. Start polling
        console.log(`🎯 Starting polling for chat: ${foundChatId}`);
        chatPollingService.startPolling(foundChatId, () => fetchChatMessages(foundChatId), 5000); // 5 seconds
        setPollingActive(true);
        
        // 5. Mark as read
        API.patch(`/chat/${foundChatId}/read`).catch(err => 
          console.log("⚠️ Could not mark as read:", err.message)
        );
      }
      
    } catch (err) {
      console.error("❌ Error initializing chat:", err);
      setError("Failed to load chat. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [itemId, currentUser, fetchItemDetails, findOrCreateChat, loadInitialMessages, fetchChatMessages]);

  // Load data when component mounts
  useEffect(() => {
    initializeChat();
    
    // Clean up on unmount
    return () => {
      console.log('🧹 ChatBox unmounting - stopping polling');
      if (chatId) {
        chatPollingService.stopPolling(chatId);
      }
    };
  }, [initializeChat, chatId]);

  // Start/stop polling when chatId changes
  useEffect(() => {
    if (chatId) {
      console.log(`🎯 Setting up polling for chat: ${chatId}`);
      chatPollingService.startPolling(chatId, () => fetchChatMessages(chatId), 5000);
      setPollingActive(true);
      
      return () => {
        console.log(`🧹 Cleaning up polling for chat: ${chatId}`);
        chatPollingService.stopPolling(chatId);
        setPollingActive(false);
      };
    }
  }, [chatId, fetchChatMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !chatLoading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "end"
        });
      }, 100);
    }
  }, [messages, chatLoading]);

  // Check if user is item owner
  const isItemOwner = useMemo(() => {
    if (!currentUser || !itemDetails?.owner) return false;
    const ownerId = itemDetails.owner._id || itemDetails.owner;
    const currentUserId = currentUser.id || currentUser._id;
    return ownerId.toString() === currentUserId.toString();
  }, [currentUser, itemDetails]);

  // Send first message to create chat
  const sendFirstMessage = useCallback(async (messageText = "Hi, I'm interested in this item!") => {
    if (!currentUser) {
      alert("Please log in to send messages");
      navigate("/login");
      return;
    }

    // If you're the owner, you can't start a new chat with yourself
    if (isItemOwner) {
      alert("You are the item owner. Wait for someone to message you first.");
      return;
    }

    // Get receiver from item owner
    let receiverId = null;
    
    if (itemDetails?.owner) {
      receiverId = itemDetails.owner._id || itemDetails.owner;
      
      // Check if user is trying to message themselves
      if (receiverId.toString() === currentUser.id?.toString() || 
          receiverId.toString() === currentUser._id?.toString()) {
        alert("You cannot send messages to yourself");
        return;
      }
    }
    
    if (!receiverId) {
      alert("Cannot identify item owner");
      return;
    }

    setSending(true);
    
    try {
      console.log("📤 Sending first message to create chat...");
      
      const response = await API.post("/chat", {
        itemId: itemId,
        receiverId: receiverId,
        message: messageText
      });

      console.log("✅ Chat created:", response);
      
      if (response?.success) {
        // Get the new chat ID
        const newChatId = response.data?.chat?._id;
        if (newChatId) {
          setChatId(newChatId);
          setOtherUser(itemDetails.owner);
          
          // Add the sent message to state
          const newMessage = response.data?.message;
          if (newMessage) {
            setMessages([newMessage]);
          }
          
          // Start polling for the new chat
          setTimeout(() => {
            chatPollingService.startPolling(newChatId, () => fetchChatMessages(newChatId), 5000);
            setPollingActive(true);
          }, 1000);
        }
      }
      
    } catch (err) {
      console.error("❌ Error creating chat:", err);
      
      if (err.response?.status === 404) {
        alert("Item not found. It may have been removed.");
      } else if (err.response?.status === 400) {
        alert("Invalid request. Please check the details.");
      } else {
        alert(err.response?.data?.message || "Failed to start chat");
      }
    } finally {
      setSending(false);
    }
  }, [itemId, currentUser, itemDetails, navigate, fetchChatMessages, isItemOwner]);

  // Send message
  const sendMessage = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    const messageText = text.trim();
    if (!messageText) {
      console.warn("Cannot send empty message");
      return;
    }

    if (!currentUser) {
      alert("Please log in to send messages");
      navigate("/login");
      return;
    }

    // Determine receiver
    let receiverId = null;
    
    if (otherUser) {
      receiverId = otherUser._id || otherUser.id;
    } else if (itemDetails?.owner && !isItemOwner) {
      // If you're NOT the owner, receiver is the owner
      receiverId = itemDetails.owner._id || itemDetails.owner;
    } else if (isItemOwner && messages.length > 0) {
      // If you're the owner, find receiver from messages
      const currentUserId = currentUser.id || currentUser._id;
      const otherMessage = messages.find(msg => {
        const senderId = msg.sender?._id || msg.sender;
        return senderId?.toString() !== currentUserId?.toString();
      });
      
      if (otherMessage) {
        receiverId = otherMessage.sender?._id || otherMessage.sender;
      }
    }
    
    if (!receiverId) {
      alert("Cannot identify who to send message to");
      return;
    }

    // Create temporary message
    const tempId = `temp_${Date.now()}`;
    const newMessage = {
      _id: tempId,
      chat: chatId,
      item: itemId,
      sender: { 
        _id: currentUser.id || currentUser._id, 
        name: currentUser.name || "You" 
      },
      receiver: { 
        _id: receiverId, 
        name: otherUser?.name || itemDetails?.owner?.name || "User" 
      },
      message: messageText,
      createdAt: new Date().toISOString(),
      isRead: false,
      isTemporary: true
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    setText("");
    setSending(true);

    try {
      console.log("📤 Sending message...");
      
      const response = await API.post("/chat", {
        itemId: itemId,
        receiverId: receiverId,
        message: messageText
      });

      console.log("✅ Message sent:", response);
      
      if (response?.success) {
        // Replace temporary message with real one
        const realMessage = response.data?.message;
        if (realMessage) {
          setMessages(prev => prev.map(msg => 
            msg._id === tempId 
              ? { 
                  ...realMessage,
                  message: realMessage.message
                }
              : msg
          ));
        }
        
        // Force immediate refresh
        setTimeout(() => {
          if (chatId) {
            fetchChatMessages(chatId);
          }
        }, 500);
      }

    } catch (err) {
      console.error("❌ Error sending message:", err);
      
      // Remove temporary message
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      
      if (err.response?.status === 404) {
        alert("Item not found. It may have been removed.");
      } else if (err.response?.status === 429) {
        alert("Too many messages. Please wait a moment.");
      } else {
        alert(err.response?.data?.message || "Failed to send message");
      }
    } finally {
      setSending(false);
    }
  }, [text, itemId, chatId, currentUser, otherUser, itemDetails, navigate, fetchChatMessages, messages, isItemOwner]);

  // Format time
  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
        });
      }
    } catch {
      return "";
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Retry loading chat
  const retryLoading = () => {
    setRetryCount(0);
    initializeChat();
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        {/* Header skeleton */}
        <div style={{ 
          padding: "20px 25px", 
          background: "linear-gradient(135deg, #f6f7f9, #e9ecef)",
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#dee2e6",
          }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              width: "150px", 
              height: "20px", 
              background: "#dee2e6",
              borderRadius: "4px",
              marginBottom: "8px"
            }}></div>
            <div style={{ 
              width: "200px", 
              height: "14px", 
              background: "#e9ecef",
              borderRadius: "4px"
            }}></div>
          </div>
        </div>

        <div style={{ display: "flex", minHeight: "500px" }}>
          {/* Chat area skeleton */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ 
              flex: 1, 
              padding: "20px", 
              background: "#f8f9fa",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <div style={{ 
                width: "60px", 
                height: "60px", 
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #4361ee",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px auto"
              }}></div>
              <div style={{ 
                width: "200px", 
                height: "20px", 
                background: "#e9ecef",
                borderRadius: "4px",
                marginBottom: "10px"
              }}></div>
              <div style={{ 
                width: "150px", 
                height: "16px", 
                background: "#e9ecef",
                borderRadius: "4px"
              }}></div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div style={{ 
            width: "300px", 
            borderLeft: "1px solid #e0e0e0",
            padding: "20px",
            background: "white",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ 
              width: "120px", 
              height: "20px", 
              background: "#e9ecef",
              borderRadius: "4px",
              marginBottom: "15px"
            }}></div>
            
            <div style={{ 
              width: "100%", 
              height: "150px", 
              background: "#e9ecef",
              borderRadius: "8px",
              marginBottom: "15px"
            }}></div>
            
            <div style={{ 
              width: "180px", 
              height: "20px", 
              background: "#e9ecef",
              borderRadius: "4px",
              marginBottom: "8px"
            }}></div>
            
            <div style={{ 
              width: "100%", 
              height: "60px", 
              background: "#e9ecef",
              borderRadius: "4px",
              marginBottom: "15px"
            }}></div>
            
            <div style={{ 
              width: "80px", 
              height: "20px", 
              background: "#e9ecef",
              borderRadius: "4px",
              marginBottom: "5px"
            }}></div>
            
            <div style={{ 
              width: "120px", 
              height: "30px", 
              background: "#e9ecef",
              borderRadius: "4px"
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // If item not found, show error message
  if (error && error.includes("Item not found")) {
    return (
      <div style={{ maxWidth: "800px", margin: "100px auto", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>❌</div>
        <h2>Item Not Found</h2>
        <p>The item you're trying to chat about doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: "12px 24px",
            background: "#4361ee",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "20px"
          }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Show loading skeleton while loading
  if (loading || itemLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        {/* Header */}
        <div style={{ 
          padding: "20px 25px", 
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            aria-label="Go back"
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "20px" }}>Chat</h2>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
              {itemDetails?.title || "Loading..."}
              {otherUser && ` • With ${otherUser.name}`}
              {isItemOwner && " • 👑 You are the seller"}
              {pollingActive && " • 🔄 Live"}
              {!pollingActive && chatId && " • ⏸️ Updates paused"}
            </p>
          </div>
          {error && !error.includes("Item not found") && (
            <div style={{
              padding: "8px 12px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "6px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ⚠️ {error}
              <button
                onClick={retryLoading}
                style={{
                  background: "rgba(255,255,255,0.3)",
                  border: "none",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", minHeight: "500px" }}>
          {/* Chat Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Messages */}
            <div style={{ 
              flex: 1, 
              padding: "20px", 
              overflowY: "auto",
              background: "#f8f9fa",
              display: "flex",
              flexDirection: "column",
              justifyContent: messages.length === 0 ? "center" : "flex-start",
              alignItems: messages.length === 0 ? "center" : "stretch"
            }}>
              {chatLoading ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    border: "3px solid #f3f3f3",
                    borderTop: "3px solid #4361ee",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 15px auto"
                  }}></div>
                  <p style={{ color: "#6c757d" }}>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", maxWidth: "400px" }}>
                  <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>💬</div>
                  <h3 style={{ marginBottom: "10px", color: "#212529" }}>No messages yet</h3>
                  <p style={{ color: "#6c757d", marginBottom: "25px" }}>
                    {isItemOwner 
                      ? "When someone messages you about this item, you'll see their messages here."
                      : itemDetails?.owner 
                        ? `Start a conversation with ${itemDetails.owner.name} about "${itemDetails.title}"`
                        : "Be the first to send a message!"}
                  </p>
                  
                  {!isItemOwner && itemDetails?.owner && currentUser && (
                    <button
                      onClick={() => sendFirstMessage("Hi, I'm interested in this item!")}
                      disabled={sending || !itemDetails?.owner}
                      style={{
                        padding: "12px 24px",
                        background: "#4361ee",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        opacity: (itemDetails?.owner && !sending) ? 1 : 0.5,
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                    >
                      {sending ? "Starting chat..." : "Start Conversation"}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {Object.entries(messageGroups).map(([date, dateMessages]) => (
                    <div key={date}>
                      <div style={{
                        textAlign: "center",
                        margin: "15px 0",
                        position: "relative"
                      }}>
                        <div style={{
                          display: "inline-block",
                          padding: "5px 15px",
                          background: "#e9ecef",
                          borderRadius: "20px",
                          fontSize: "12px",
                          color: "#6c757d",
                          fontWeight: "500"
                        }}>
                          {date}
                        </div>
                      </div>
                      {dateMessages.map((message) => {
                        const isCurrentUser = currentUser && 
                          message.sender?._id?.toString() === (currentUser.id || currentUser._id)?.toString();
                        const isTemporary = message.isTemporary;
                        
                        return (
                          <div 
                            key={message._id}
                            style={{ 
                              marginBottom: "10px",
                              opacity: isTemporary ? 0.7 : 1
                            }}
                          >
                            <div style={{ 
                              display: "flex", 
                              justifyContent: isCurrentUser ? "flex-end" : "flex-start"
                            }}>
                              <div style={{
                                maxWidth: "70%",
                                background: isCurrentUser ? "#4361ee" : "white",
                                color: isCurrentUser ? "white" : "#212529",
                                padding: "10px 15px",
                                borderRadius: isCurrentUser 
                                  ? "15px 15px 5px 15px" 
                                  : "15px 15px 15px 5px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                              }}>
                                {!isCurrentUser && message.sender?.name && (
                                  <div style={{
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    marginBottom: "4px",
                                    opacity: 0.8
                                  }}>
                                    {message.sender.name}
                                  </div>
                                )}
                                
                                <p style={{ 
                                  margin: 0, 
                                  lineHeight: 1.4, 
                                  fontSize: "14px",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word"
                                }}>
                                  {message.message || ""}
                                  {isTemporary && (
                                    <span style={{ 
                                      marginLeft: "8px", 
                                      fontSize: "11px", 
                                      opacity: 0.7 
                                    }}>
                                      (sending...)
                                    </span>
                                  )}
                                </p>
                                <div style={{
                                  fontSize: "11px",
                                  opacity: 0.8,
                                  marginTop: "5px",
                                  textAlign: "right",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  gap: "4px"
                                }}>
                                  {formatTime(message.createdAt)}
                                  {message.isRead && (
                                    <span title="Read">✓</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input - Show if we have messages OR if we're the item owner and have otherUser */}
            {(messages.length > 0 || (otherUser && isItemOwner)) && !error && !chatLoading && (
              <div style={{ 
                padding: "15px 20px", 
                borderTop: "1px solid #e0e0e0",
                background: "white"
              }}>
                <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder={
                      !otherUser 
                        ? "Type your message..." 
                        : isItemOwner
                          ? `Reply to ${otherUser?.name || "buyer"}...`
                          : `Message ${otherUser?.name || "seller"}...`
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 15px",
                      border: "1px solid #dee2e6",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                    disabled={sending}
                    aria-label="Type your message"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    style={{
                      padding: "12px 20px",
                      background: "#4361ee",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      opacity: (text.trim() && !sending) ? 1 : 0.5,
                      fontSize: "14px",
                      fontWeight: "500",
                      minWidth: "80px"
                    }}
                    aria-label="Send message"
                  >
                    {sending ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ 
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          border: "2px solid transparent",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite"
                        }}></span>
                        Send
                      </span>
                    ) : "Send"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ 
            width: "300px", 
            borderLeft: "1px solid #e0e0e0",
            padding: "20px",
            background: "white",
            display: "flex",
            flexDirection: "column"
          }}>
            <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Item Details</h3>
            
            {itemDetails ? (
              <>
                {itemDetails.images?.[0] && (
                  <img
                    src={itemDetails.images[0]}
                    alt={itemDetails.title}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "15px"
                    }}
                  />
                )}
                
                <h4 style={{ 
                  marginBottom: "8px", 
                  fontSize: "16px"
                }}>
                  {itemDetails.title}
                </h4>
                <p style={{ 
                  color: "#6c757d", 
                  fontSize: "14px", 
                  marginBottom: "15px",
                  lineHeight: 1.5
                }}>
                  {itemDetails.description?.substring(0, 100)}
                  {itemDetails.description?.length > 100 && "..."}
                </p>
                
                <div style={{ marginBottom: "15px" }}>
                  <p style={{ margin: 0, color: "#6c757d", fontSize: "13px" }}>Price</p>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4361ee", margin: "5px 0" }}>
                    Rs. {itemDetails.price?.toLocaleString() || "0"}
                  </p>
                </div>
                
                {itemDetails.owner && (
                  <div style={{ 
                    padding: "12px",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    marginTop: "auto"
                  }}>
                    <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#6c757d" }}>
                      {isItemOwner ? "You are the seller" : "Item Owner"}
                    </p>
                    <p style={{ margin: 0, fontWeight: "500" }}>
                      {itemDetails.owner.name || "Unknown"}
                    </p>
                    {itemDetails.owner.email && (
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#6c757d" }}>
                        {itemDetails.owner.email}
                      </p>
                    )}
                    {otherUser && (
                      <p style={{ margin: "10px 0 0 0", fontSize: "12px", color: "#4361ee" }}>
                        💬 Chatting with: {otherUser.name}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : !error ? (
              <div style={{ textAlign: "center", padding: "30px 20px" }}>
                <div style={{ 
                  width: "30px", 
                  height: "30px", 
                  border: "3px solid #f3f3f3",
                  borderTop: "3px solid #4361ee",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 10px auto"
                }}></div>
                <p style={{ margin: 0, fontSize: "13px", color: "#6c757d" }}>
                  Loading item...
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatBox;