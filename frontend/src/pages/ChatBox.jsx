import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

const ChatBox = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [itemDetails, setItemDetails] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Get current user
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      } else {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // Simple poll function
  const startPolling = useCallback(() => {
    if (!chatId || !currentUser) return;

    console.log(`🔁 Starting polling for chat: ${chatId}`);
    
    // Clear existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const poll = async () => {
      try {
        console.log(`📨 Polling chat ${chatId}`);
        const response = await API.get(`/chat/${chatId}`);
        
        if (response?.success && response.data?.messages) {
          setMessages(response.data.messages);
          console.log(`✅ Updated messages: ${response.data.messages.length}`);
        }
      } catch (err) {
        console.log("⚠️ Polling error:", err.message);
      }
    };

    // Initial poll
    poll();
    
    // Set interval for polling every 5 seconds
    pollingRef.current = setInterval(poll, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [chatId, currentUser]);

  // Load chat data
  const loadChatData = useCallback(async () => {
    if (!itemId || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("📦 Step 1: Loading item...");
      // 1. Get item details
      const itemRes = await API.get(`/items/${itemId}`);
      if (itemRes?.success) {
        setItemDetails(itemRes.data);
        console.log("✅ Item loaded:", itemRes.data.title);
      } else {
        setError("Failed to load item");
        return;
      }

      console.log("🔍 Step 2: Looking for existing chat...");
      // 2. Try to find existing chat
      try {
        const chatRes = await API.get(`/chat/item/${itemId}`);
        if (chatRes?.success && chatRes.data && chatRes.data.length > 0) {
          const chat = chatRes.data[0];
          setChatId(chat._id);
          console.log("✅ Found existing chat:", chat._id);
          
          // Load messages
          if (chat.messages && chat.messages.length > 0) {
            setMessages(chat.messages);
            console.log(`✅ Loaded ${chat.messages.length} messages`);
          }
          
          // Find other user
          if (currentUser && chat.participants) {
            const currentUserId = currentUser.id || currentUser._id;
            const other = chat.participants.find(p => {
              const pid = p._id || p;
              return pid.toString() !== currentUserId.toString();
            });
            if (other) {
              setOtherUser(other);
              console.log("✅ Found other user:", other.name);
            }
          }
        } else {
          console.log("🆕 No existing chat found");
        }
      } catch (chatErr) {
        console.log("ℹ️ No chat found or error:", chatErr.message);
        // This is normal if no chat exists yet
      }

      console.log("🎯 Step 3: Setup complete");
    } catch (err) {
      console.error("❌ Error loading chat data:", err);
      setError("Failed to load chat. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [itemId, currentUser]);

  // Load data on mount
  useEffect(() => {
    if (currentUser) {
      loadChatData();
    }
  }, [loadChatData, currentUser]);

  // Start polling when chatId is set
  useEffect(() => {
    if (chatId && currentUser) {
      startPolling();
    }
    
    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [chatId, currentUser, startPolling]);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  // Send message
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    
    const messageText = text.trim();
    if (!messageText || !currentUser || !itemDetails) {
      alert("Cannot send message");
      return;
    }

    // Determine receiver
    let receiverId = null;
    if (otherUser) {
      receiverId = otherUser._id || otherUser.id;
    } else if (itemDetails.owner) {
      const ownerId = itemDetails.owner._id || itemDetails.owner;
      const currentUserId = currentUser.id || currentUser._id;
      
      // Check if user is messaging themselves
      if (ownerId.toString() === currentUserId.toString()) {
        alert("You are the owner. Wait for someone to message you.");
        return;
      }
      receiverId = ownerId;
    }

    if (!receiverId) {
      alert("Cannot identify receiver");
      return;
    }

    // Optimistic update
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      message: messageText,
      sender: { _id: currentUser.id || currentUser._id, name: currentUser.name || "You" },
      createdAt: new Date().toISOString(),
      isTemporary: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setText("");
    setSending(true);

    try {
      console.log("📤 Sending message...");
      const response = await API.post("/chat", {
        itemId: itemId,
        receiverId: receiverId,
        message: messageText
      });

      if (response?.success) {
        console.log("✅ Message sent successfully");
        
        // Update chatId if this created a new chat
        if (response.data?.chat?._id && !chatId) {
          setChatId(response.data.chat._id);
        }
        
        // Update otherUser if not set
        if (!otherUser && itemDetails.owner) {
          setOtherUser(itemDetails.owner);
        }
        
        // Force refresh messages
        setTimeout(() => {
          if (chatId || response.data?.chat?._id) {
            const id = chatId || response.data.chat._id;
            API.get(`/chat/${id}`).then(res => {
              if (res?.success && res.data?.messages) {
                setMessages(res.data.messages);
              }
            });
          }
        }, 500);
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
      alert("Failed to send message");
      
      // Remove optimistic update
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
    } finally {
      setSending(false);
    }
  };

  // Start conversation (for buyers)
  const startConversation = () => {
    if (!itemDetails?.owner || !currentUser) return;
    
    const ownerId = itemDetails.owner._id || itemDetails.owner;
    const currentUserId = currentUser.id || currentUser._id;
    
    if (ownerId.toString() === currentUserId.toString()) {
      alert("You are the owner. You cannot start a conversation with yourself.");
      return;
    }
    
    sendMessage(null); // Send with current text or default
  };

  // Check if user is owner
  const isOwner = itemDetails?.owner && currentUser && 
    (itemDetails.owner._id || itemDetails.owner).toString() === 
    (currentUser.id || currentUser._id).toString();

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

  // Simple loading component
  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "100px auto", textAlign: "center" }}>
        <div style={{ 
          width: "60px", 
          height: "60px", 
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #4361ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px auto"
        }}></div>
        <h3>Loading Chat...</h3>
        <p>Please wait while we load the conversation.</p>
        <button 
          onClick={loadChatData}
          style={{
            padding: "10px 20px",
            background: "#4361ee",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "20px"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "800px", margin: "100px auto", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚠️</div>
        <h3>Error Loading Chat</h3>
        <p>{error}</p>
        <button 
          onClick={loadChatData}
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
          Try Again
        </button>
      </div>
    );
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
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "20px" }}>Chat</h2>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
              {itemDetails?.title || "Item"}
              {otherUser && ` • With ${otherUser.name}`}
              {isOwner && " • 👑 You are the seller"}
            </p>
          </div>
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
              flexDirection: "column"
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", margin: "auto", maxWidth: "400px" }}>
                  <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>💬</div>
                  <h3 style={{ marginBottom: "10px", color: "#212529" }}>No messages yet</h3>
                  <p style={{ color: "#6c757d", marginBottom: "25px" }}>
                    {isOwner 
                      ? "When someone messages you about this item, you'll see their messages here."
                      : `Start a conversation about "${itemDetails?.title}"`}
                  </p>
                  
                  {!isOwner && itemDetails?.owner && (
                    <button
                      onClick={() => {
                        setText("Hi, I'm interested in this item!");
                        setTimeout(() => sendMessage(null), 100);
                      }}
                      disabled={sending}
                      style={{
                        padding: "12px 24px",
                        background: "#4361ee",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        opacity: sending ? 0.7 : 1,
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                    >
                      {sending ? "Starting..." : "Start Conversation"}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isCurrentUser = currentUser && 
                      message.sender?._id?.toString() === (currentUser.id || currentUser._id)?.toString();
                    const isTemporary = message.isTemporary;
                    
                    return (
                      <div 
                        key={message._id || index}
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
                              textAlign: "right"
                            }}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            {(messages.length > 0 || (itemDetails?.owner && !isOwner)) && (
              <div style={{ 
                padding: "15px 20px", 
                borderTop: "1px solid #e0e0e0",
                background: "white"
              }}>
                <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder={
                      isOwner 
                        ? `Reply to ${otherUser?.name || "buyer"}...`
                        : `Message ${itemDetails?.owner?.name || "seller"}...`
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
                  >
                    {sending ? "Sending..." : "Send"}
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
            
            {itemDetails && (
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
                
                <h4 style={{ marginBottom: "8px", fontSize: "16px" }}>
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
                      {isOwner ? "You are the seller" : "Item Owner"}
                    </p>
                    <p style={{ margin: 0, fontWeight: "500" }}>
                      {itemDetails.owner.name || "Unknown"}
                    </p>
                    {itemDetails.owner.email && (
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#6c757d" }}>
                        {itemDetails.owner.email}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ChatBox;