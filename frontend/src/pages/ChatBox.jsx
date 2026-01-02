import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

  // Fetch all data in one function to prevent loops
  const fetchChatData = useCallback(async () => {
    if (!itemId || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      console.log(`📦 Fetching item: ${itemId}`);
      
      // 1. Fetch item details
      const itemResponse = await API.get(`/items/${itemId}`);
      
      if (itemResponse?.data?.success) {
        const itemData = itemResponse.data.data;
        console.log("✅ Item loaded:", itemData);
        setItemDetails(itemData);
        
        // Set other user from item owner
        if (itemData.owner) {
          const owner = itemData.owner;
          const ownerId = owner._id || owner;
          const currentUserId = currentUser.id || currentUser._id;
          
          if (ownerId.toString() !== currentUserId?.toString()) {
            console.log("👤 Setting other user from item owner:", owner);
            setOtherUser(typeof owner === 'object' ? owner : { _id: owner });
          } else {
            console.log("⚠️ You are the owner of this item");
            setError("You cannot chat with yourself about your own item");
          }
        }
        
        // 2. Try to fetch existing chat
        console.log(`💬 Looking for existing chat for item: ${itemId}`);
        try {
          const chatResponse = await API.get(`/chat/item/${itemId}`);
          
          if (chatResponse.data?.success && chatResponse.data.data) {
            let chats = chatResponse.data.data;
            
            if (Array.isArray(chats) && chats.length > 0) {
              const chat = chats[0];
              setChatId(chat._id);
              console.log(`✅ Found existing chat: ${chat._id}`);
              
              // Load messages if available
              if (chat.messages && Array.isArray(chat.messages)) {
                const validMessages = chat.messages
                  .filter(msg => msg && typeof msg === 'object')
                  .map(msg => ({
                    _id: msg._id,
                    chat: msg.chat,
                    item: msg.item,
                    sender: msg.sender,
                    receiver: msg.receiver,
                    message: msg.message || msg.text || "",
                    isRead: msg.isRead,
                    readAt: msg.readAt,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt
                  }));
                
                setMessages(validMessages);
                console.log(`✅ Loaded ${validMessages.length} messages`);
                
                // Set other user from messages if not already set
                if (validMessages.length > 0 && !otherUser) {
                  const firstMsg = validMessages[0];
                  const currentUserId = currentUser.id || currentUser._id;
                  
                  if (firstMsg.sender?._id?.toString() !== currentUserId?.toString()) {
                    setOtherUser(firstMsg.sender);
                  } else if (firstMsg.receiver?._id?.toString() !== currentUserId?.toString()) {
                    setOtherUser(firstMsg.receiver);
                  }
                }
              }
            } else {
              console.log("🆕 No existing chat found");
              setMessages([]);
            }
          } else {
            console.log("🆕 No chat data received");
            setMessages([]);
          }
        } catch (chatErr) {
          // 404 is expected when no chat exists
          if (chatErr.response?.status === 404) {
            console.log("🔍 No chat found (404) - This is normal");
            setMessages([]);
          } else {
            console.warn("⚠️ Chat fetch issue:", chatErr.message);
          }
        }
      } else {
        setError("Item details not available");
      }
    } catch (err) {
      console.error("❌ Error loading chat data:", err);
      
      if (err.response?.status === 404) {
        setError("Item not found. It may have been removed.");
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError("Failed to load chat. You can still start a conversation.");
      }
    } finally {
      setLoading(false);
    }
  }, [itemId, currentUser, navigate]);

  // Load data once when component mounts
  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]); // Only depends on fetchChatData which is memoized with itemId and currentUser

  // Send first message to create chat
  const sendFirstMessage = useCallback(async (messageText = "Hi, I'm interested in this item!") => {
    if (!currentUser) {
      alert("Please log in to send messages");
      navigate("/login");
      return;
    }

    // Get receiver from item owner
    let receiverId = null;
    let receiverName = "User";
    
    if (itemDetails?.owner) {
      receiverId = itemDetails.owner._id || itemDetails.owner;
      receiverName = itemDetails.owner.name || receiverName;
      
      // Check if user is trying to message themselves
      if (receiverId.toString() === currentUser.id?.toString() || 
          receiverId.toString() === currentUser._id?.toString()) {
        alert("You cannot send messages to yourself about your own item");
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

      console.log("✅ Chat created:", response.data);
      
      if (response.data?.success) {
        // Set chat ID
        setChatId(response.data.data?.chat?._id);
        
        // Add the sent message to state
        const newMessage = response.data.data?.message;
        if (newMessage) {
          setMessages(prev => [...prev, {
            _id: newMessage._id,
            chat: newMessage.chat,
            item: newMessage.item,
            sender: newMessage.sender,
            receiver: newMessage.receiver,
            message: newMessage.message,
            isRead: newMessage.isRead,
            readAt: newMessage.readAt,
            createdAt: newMessage.createdAt,
            updatedAt: newMessage.updatedAt
          }]);
        }
        
        alert("Chat started! You can now continue the conversation.");
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
  }, [itemId, currentUser, itemDetails, navigate]);

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

    // Get receiver
    let receiverId = null;
    let receiverName = "User";
    
    if (otherUser) {
      receiverId = otherUser._id || otherUser.id;
      receiverName = otherUser.name || receiverName;
    } else if (itemDetails?.owner) {
      receiverId = itemDetails.owner._id || itemDetails.owner;
      receiverName = itemDetails.owner.name || receiverName;
      
      // Check if user is trying to message themselves
      if (receiverId.toString() === currentUser.id?.toString() || 
          receiverId.toString() === currentUser._id?.toString()) {
        alert("You cannot send messages to yourself");
        return;
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
        name: receiverName 
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

      console.log("✅ Message sent:", response.data);
      
      if (response.data?.success) {
        // Replace temporary message with real one
        const realMessage = response.data.data?.message;
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
        
        // If we got a chat ID, store it
        if (response.data.data?.chat?._id && !chatId) {
          setChatId(response.data.data.chat._id);
        }
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
  }, [text, itemId, chatId, currentUser, otherUser, itemDetails, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "end"
        });
      }, 100);
    }
  }, [messages]);

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
      return new Date(dateString).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
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
            </p>
          </div>
          {error && !error.includes("Item not found") && (
            <div style={{
              padding: "8px 12px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "6px",
              fontSize: "13px"
            }}>
              ⚠️ {error}
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
              {loading ? (
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
                  <p style={{ color: "#6c757d" }}>Loading chat...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", maxWidth: "400px" }}>
                  <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>💬</div>
                  <h3 style={{ marginBottom: "10px", color: "#212529" }}>No messages yet</h3>
                  <p style={{ color: "#6c757d", marginBottom: "25px" }}>
                    {itemDetails?.owner 
                      ? `Start a conversation with ${itemDetails.owner.name} about "${itemDetails.title}"`
                      : "Be the first to send a message!"}
                  </p>
                  
                  {itemDetails?.owner && currentUser && (
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
                                  textAlign: "right"
                                }}>
                                  {formatTime(message.createdAt)}
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

            {/* Input - Only show if we have messages or otherUser is identified */}
            {(messages.length > 0 || otherUser) && !error && (
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
                        ? "Loading..." 
                        : `Message ${otherUser.name}...`
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
                    disabled={!otherUser || sending}
                    aria-label="Type your message"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || !otherUser || sending}
                    style={{
                      padding: "12px 20px",
                      background: "#4361ee",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      opacity: (otherUser && text.trim() && !sending) ? 1 : 0.5,
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                    aria-label="Send message"
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
                    <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#6c757d" }}>Item Owner</p>
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
      `}</style>
    </div>
  );
};

export default ChatBox;