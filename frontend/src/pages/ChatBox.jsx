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

  // Fetch item details
  const fetchItemDetails = useCallback(async () => {
    if (!itemId) return;

    try {
      console.log(`📦 Fetching item: ${itemId}`);
      
      const response = await API.get(`/items/${itemId}`);
      
      if (response?.data) {
        console.log("✅ Item loaded:", response.data);
        setItemDetails(response.data.data);
        
        // Set other user from item owner
        const currentUser = getCurrentUser();
        if (currentUser && response.data.owner) {
          const owner = response.data.owner;
          const ownerId = owner._id || owner;
          const currentUserId = currentUser.id || currentUser.id;
          
          if (ownerId.toString() !== currentUserId?.toString()) {
            console.log("👤 Setting other user from item owner:", owner);
            setOtherUser(typeof owner === 'object' ? owner : { _id: owner });
          } else {
            console.log("⚠️ You are the owner of this item");
            setError("You cannot chat with yourself about your own item");
          }
        }
      }
    } catch (err) {
      console.error("❌ Error fetching item:", err);
      setError("Failed to load item details");
    }
  }, [itemId, getCurrentUser]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!itemId) return;

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.warn("No user logged in");
        return;
      }

      console.log(`💬 Fetching messages for item: ${itemId}`);
      
      const response = await API.get(`/chat/item/${itemId}`);
      console.log("📨 Messages response:", response.data);
      
      if (response.data?.success) {
        const messagesData = response.data.data[0].messages || [];
        setMessages(Array.isArray(messagesData) ? messagesData : []);
        
        // If we have messages, extract other user from them
        if (messagesData.length > 0) {
          const firstMsg = messagesData[0];
          const currentUserId = currentUser.id || currentUser.id;
          
          if (firstMsg.sender?._id?.toString() !== currentUserId?.toString()) {
            setOtherUser(firstMsg.sender);
          } else if (firstMsg.receiver?._id?.toString() !== currentUserId?.toString()) {
            setOtherUser(firstMsg.receiver);
          }
        }
        
        console.log(`📊 Loaded ${messagesData.length} messages`);
      }
      
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [itemId, getCurrentUser]);

  // Send first message to create chat
  const sendFirstMessage = useCallback(async (messageText = "Hi, I'm interested in this item!") => {
    const currentUser = getCurrentUser();
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
      if (receiverId.toString() === currentUser.id?.toString()) {
        alert("You cannot send messages to yourself about your own item");
        return;
      }
      
      // Set other user
      if (!otherUser) {
        setOtherUser(itemDetails.owner);
      }
    }
    
    if (!receiverId) {
      alert("Cannot identify item owner");
      return;
    }

    setSending(true);
    
    try {
      console.log("🚀 Sending first message to create chat...");
      
      const response = await API.post("/chat", {
        itemId: itemId,
        receiverId: receiverId,
        message: messageText
      });

      console.log("✅ Chat created:", response.data);
      
      // Set the text input to the sent message
      setText(messageText);
      
      // Refresh messages to show the new chat
      setTimeout(fetchMessages, 1000);
      
      alert("Chat started! You can now continue the conversation.");
      
    } catch (err) {
      console.error("❌ Error creating chat:", err);
      alert(err.response?.data?.message || "Failed to start chat");
    } finally {
      setSending(false);
    }
  }, [itemId, getCurrentUser, itemDetails, otherUser, navigate, fetchMessages]);

  // Send message
  const sendMessage = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    const messageText = text.trim();
    if (!messageText) {
      console.warn("⚠️ Cannot send empty message");
      return;
    }

    const currentUser = getCurrentUser();
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
      if (receiverId.toString() === currentUser.id?.toString()) {
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
      item: itemId,
      sender: { 
        _id: currentUser.id || currentUser.id, 
        name: currentUser.name || "You" 
      },
      receiver: { 
        _id: receiverId, 
        name: receiverName 
      },
      message: messageText,
      createdAt: new Date().toISOString(),
      isTemporary: true
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    setText("");
    setSending(true);

    try {
      console.log("🚀 Sending message...");
      
      const response = await API.post("/chat", {
        itemId: itemId,
        receiverId: receiverId,
        message: messageText
      });

      console.log("✅ Message sent:", response.data);
      
      // Replace temporary message with real one
      setMessages(prev => prev.map(msg => 
        msg._id === tempId 
          ? { 
              ...msg, 
              isTemporary: false,
              _id: response.data.data?._id || msg._id,
              ...(response.data.data || {})
            }
          : msg
      ));

      // Refresh messages
      setTimeout(fetchMessages, 500);

    } catch (err) {
      console.error("❌ Error sending message:", err);
      
      // Remove temporary message
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }, [text, itemId, getCurrentUser, otherUser, itemDetails, navigate, fetchMessages]);

  // Load data
  useEffect(() => {
    if (!itemId) {
      setError("No item selected");
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        await fetchItemDetails();
        await fetchMessages();
      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };

    loadData();

    // Poll for new messages
    const interval = setInterval(fetchMessages, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [itemId, fetchItemDetails, fetchMessages]);

  // Scroll to bottom
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

  const currentUser = getCurrentUser();

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
              fontSize: "18px"
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>Chat</h2>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
              {itemDetails?.title || "Loading..."}
              {otherUser && ` • With ${otherUser.name}`}
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
                  
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button
                      onClick={() => sendFirstMessage("Hi, I'm interested in this item!")}
                      disabled={sending || !itemDetails?.owner}
                      style={{
                        padding: "12px 24px",
                        background: "#4361ee",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        opacity: (itemDetails?.owner && !sending) ? 1 : 0.5
                      }}
                    >
                      {sending ? "Starting chat..." : "Say Hello 👋"}
                    </button>
                    
                    <button
                      onClick={() => sendFirstMessage("Is this item still available?")}
                      disabled={sending || !itemDetails?.owner}
                      style={{
                        padding: "12px 24px",
                        background: "#e9ecef",
                        color: "#495057",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        opacity: (itemDetails?.owner && !sending) ? 1 : 0.5
                      }}
                    >
                      Ask Availability
                    </button>
                  </div>
                  
                  {itemDetails?.owner && (
                    <div style={{ 
                      marginTop: "20px", 
                      padding: "12px",
                      background: "#eef2ff",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}>
                      <p style={{ margin: "0 0 5px 0", fontWeight: "500" }}>Chatting with:</p>
                      <p style={{ margin: 0 }}>
                        <strong>{itemDetails.owner.name}</strong>
                        {itemDetails.owner.email && ` (${itemDetails.owner.email})`}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    {console.log("Message object:", message)}
                    const isCurrentUser = currentUser && 
                      message.sender?._id?.toString() === currentUser.id?.toString();
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
                            
                            <p style={{ margin: 0, lineHeight: 1.4, fontSize: "14px" }}>
                              {message.message}
                              {isTemporary && (
                                <span style={{ marginLeft: "8px", fontSize: "11px", opacity: 0.7 }}>
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

            {/* Input - Only show if we have messages or otherUser is identified */}
            {(messages.length > 0 || otherUser) && (
              <div style={{ 
                padding: "15px 20px", 
                borderTop: "1px solid #e0e0e0",
                background: "white"
              }}>
                <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px" }}>
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
                      opacity: (otherUser && text.trim() && !sending) ? 1 : 0.5
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
            background: "white"
          }}>
            <h3 style={{ marginBottom: "15px" }}>Item Details</h3>
            
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
                
                <h4 style={{ marginBottom: "8px" }}>{itemDetails.title}</h4>
                <p style={{ color: "#6c757d", fontSize: "14px", marginBottom: "15px" }}>
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
                    marginTop: "20px"
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
            ) : (
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