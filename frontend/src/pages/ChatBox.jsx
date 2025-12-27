import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

const ChatBox = () => {
  const { itemId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [itemDetails, setItemDetails] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

 // pages/ChatBox.jsx - Lines 22-23
const fetchMessages = async () => {
  try {
    const res = await API.get(`/chat/${itemId}`);
    setMessages(res.data || []);
    
    // ✅ FIX: Use consistent property names
    if (res.data && res.data.length > 0) {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const firstMessage = res.data[0];
      
      // Compare string representations
      const senderId = firstMessage.sender?._id?.toString();
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
      
      const otherUserId = senderId === currentUserId 
        ? firstMessage.receiver?._id || firstMessage.receiver
        : firstMessage.sender?._id || firstMessage.sender;
      // ... rest of code
    }
  } catch (err) {
    console.error("Error fetching messages:", err);
  } finally {
    setLoading(false);
  }
};

  const fetchItemDetails = async () => {
    try {
      const res = await API.get(`/items/${itemId}`);
      setItemDetails(res.data);
    } catch (err) {
      console.error("Error fetching item details:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const newMessage = {
      _id: Date.now().toString(), // Temporary ID
      item: itemId,
      sender: { _id: currentUser.id, name: currentUser.name },
      receiver: otherUser?._id || null,
      message: text,
      createdAt: new Date().toISOString(),
      isTemporary: true
    };

    // Optimistically update UI
    setMessages(prev => [...prev, newMessage]);
    setText("");

    try {
      await API.post("/chat", {
        itemId,
        receiverId: otherUser?._id,
        message: text
      });
      
      // Refresh messages to get actual ID from server
      fetchMessages();
      
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
      alert("Failed to send message. Please try again.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchItemDetails();
    fetchMessages();
    
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [itemId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const currentUser = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Chat Header */}
        <div style={{ 
          padding: "24px 30px", 
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px"
            }}>
              💬
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "24px" }}>Chat</h2>
              <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
                {itemDetails?.title || "Item Discussion"}
              </p>
            </div>
          </div>
          
          {itemDetails && (
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Item Price</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700" }}>
                Rs. {itemDetails.price}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", minHeight: "600px" }}>
          {/* Main Chat Area */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* User Info Bar */}
            <div style={{ 
              padding: "20px 30px", 
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: "15px"
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #38b000, #2d9100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "20px",
                fontWeight: "bold"
              }}>
                {otherUser?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px" }}>{otherUser?.name || "User"}</h3>
                <p style={{ margin: "4px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
                  {otherUser ? "Online" : "Connecting..."}
                </p>
              </div>
            </div>

            {/* Messages Container */}
            <div style={{ 
              flex: 1, 
              padding: "30px", 
              overflowY: "auto",
              background: "#f8f9fa",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div className="loading" style={{ 
                    margin: "0 auto", 
                    width: "40px", 
                    height: "40px", 
                    borderWidth: "3px",
                    borderTopColor: "#4361ee"
                  }}></div>
                  <p style={{ marginTop: "20px", color: "#6c757d" }}>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "60px 20px",
                  background: "white",
                  borderRadius: "12px",
                  margin: "auto",
                  maxWidth: "400px"
                }}>
                  <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>💬</div>
                  <h3 style={{ marginBottom: "12px", color: "#212529" }}>No messages yet</h3>
                  <p style={{ color: "#6c757d", marginBottom: "0" }}>
                    Start the conversation about this item
                  </p>
                </div>
              ) : (
                <>
                  {/* Date Separator */}
                  {messages.length > 0 && (
                    <div style={{ textAlign: "center", marginBottom: "10px" }}>
                      <span style={{
                        background: "white",
                        padding: "8px 20px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        color: "#6c757d",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}>
                        {formatDate(messages[0].createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Messages */}
                  {messages.map((message, index) => {
                    const isCurrentUser = message.sender._id === currentUser.id;
                    const showDate = index === 0 || 
                      formatDate(messages[index].createdAt) !== formatDate(messages[index-1].createdAt);
                    
                    return (
                      <div key={message._id || index}>
                        {showDate && index > 0 && (
                          <div style={{ textAlign: "center", margin: "20px 0" }}>
                            <span style={{
                              background: "white",
                              padding: "8px 20px",
                              borderRadius: "20px",
                              fontSize: "14px",
                              color: "#6c757d",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                            }}>
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <div style={{ 
                          display: "flex", 
                          justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                          alignItems: "flex-end",
                          gap: "10px"
                        }}>
                          {!isCurrentUser && (
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #38b000, #2d9100)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "16px",
                              fontWeight: "bold",
                              flexShrink: 0
                            }}>
                              {message.sender?.name?.charAt(0) || "U"}
                            </div>
                          )}
                          
                          <div style={{
                            maxWidth: "70%",
                            position: "relative"
                          }}>
                            <div style={{
                              background: isCurrentUser 
                                ? "linear-gradient(135deg, #4361ee, #7209b7)" 
                                : "white",
                              color: isCurrentUser ? "white" : "#212529",
                              padding: "14px 18px",
                              borderRadius: isCurrentUser 
                                ? "18px 18px 4px 18px" 
                                : "18px 18px 18px 4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              position: "relative"
                            }}>
                              <p style={{ margin: 0, lineHeight: 1.5, fontSize: "15px" }}>
                                {message.message}
                              </p>
                              
                              {/* Temporary message indicator */}
                              {message.isTemporary && (
                                <div style={{
                                  position: "absolute",
                                  top: "-20px",
                                  right: "0",
                                  fontSize: "12px",
                                  color: "#6c757d"
                                }}>
                                  Sending...
                                </div>
                              )}
                            </div>
                            
                            <div style={{
                              fontSize: "12px",
                              color: "#6c757d",
                              marginTop: "6px",
                              textAlign: isCurrentUser ? "right" : "left",
                              padding: "0 8px"
                            }}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                          
                          {isCurrentUser && (
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #4361ee, #7209b7)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "16px",
                              fontWeight: "bold",
                              flexShrink: 0
                            }}>
                              {currentUser.name?.charAt(0) || "Y"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: "20px 30px", 
              borderTop: "1px solid #e0e0e0",
              background: "white"
            }}>
              <form onSubmit={sendMessage} style={{ display: "flex", gap: "15px" }}>
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4361ee"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="btn btn-primary"
                  style={{ 
                    padding: "14px 28px",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: !text.trim() ? 0.5 : 1
                  }}
                >
                  <span>📤</span> Send
                </button>
              </form>
              
              <div style={{ 
                display: "flex", 
                gap: "15px", 
                marginTop: "15px",
                fontSize: "14px",
                color: "#6c757d"
              }}>
                <span>💡</span>
                <span>Discuss price, condition, and exchange details</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Item Details */}
          <div style={{ 
            borderLeft: "1px solid #e0e0e0",
            padding: "30px",
            background: "white"
          }}>
            <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>Item Details</h3>
            
            {itemDetails ? (
              <>
                {itemDetails.imageURL ? (
                  <img
                    src={itemDetails.imageURL}
                    alt={itemDetails.title}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      marginBottom: "20px"
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "180px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "48px"
                  }}>
                    📚
                  </div>
                )}
                
                <h4 style={{ marginBottom: "10px", fontSize: "18px" }}>{itemDetails.title}</h4>
                <p style={{ color: "#6c757d", marginBottom: "20px", fontSize: "14px" }}>
                  {itemDetails.description?.substring(0, 100)}...
                </p>
                
                <div style={{ marginBottom: "25px" }}>
                  <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Price</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#4361ee" }}>
                    Rs. {itemDetails.price}
                  </p>
                </div>
                
                {itemDetails.category && (
                  <div style={{ marginBottom: "25px" }}>
                    <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Category</p>
                    <span style={{
                      display: "inline-block",
                      background: "#eef2ff",
                      color: "#4361ee",
                      padding: "6px 16px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}>
                      {itemDetails.category}
                    </span>
                  </div>
                )}
                
                <div style={{ 
                  padding: "20px", 
                  background: "#f8f9fa", 
                  borderRadius: "12px",
                  marginTop: "30px"
                }}>
                  <h4 style={{ marginBottom: "12px", fontSize: "16px" }}>💡 Chat Tips</h4>
                  <ul style={{ 
                    paddingLeft: "20px", 
                    margin: 0, 
                    fontSize: "14px",
                    color: "#6c757d",
                    lineHeight: 1.6
                  }}>
                    <li>Be clear about your offer</li>
                    <li>Discuss item condition</li>
                    <li>Agree on exchange method</li>
                    <li>Set a meeting time/place</li>
                  </ul>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div className="loading" style={{ 
                  margin: "0 auto", 
                  width: "40px", 
                  height: "40px", 
                  borderWidth: "3px",
                  borderTopColor: "#4361ee"
                }}></div>
                <p style={{ marginTop: "20px", color: "#6c757d" }}>Loading item details...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;