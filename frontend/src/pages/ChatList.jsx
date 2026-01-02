import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../services/api";

const ChatList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedChatId, setHighlightedChatId] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await API.get("/chat/user/chats");
      
      if (response.data?.success) {
        setChats(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} chats`);
      } else {
        setError("Failed to load chats");
      }
    } catch (err) {
      console.error("❌ Error fetching chats:", err);
      setError("Failed to load your conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    
    // Check if we came from a notification
    if (location.state?.itemId) {
      console.log("🎯 Came from notification with itemId:", location.state.itemId);
      setHighlightedChatId(location.state.itemId);
    }
    
    // Refresh chats every 30 seconds
    const interval = setInterval(fetchChats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchChats, location.state]);

  // Scroll to highlighted chat after loading
  useEffect(() => {
    if (highlightedChatId && chats.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`chat-${highlightedChatId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.background = '#eef2ff';
          element.style.borderLeft = '4px solid #4361ee';
        }
      }, 500);
    }
  }, [highlightedChatId, chats]);

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return "";
    }
  };

  const formatMessagePreview = (message) => {
    if (!message) return "No messages yet";
    const text = message.message || message.text || "";
    return text.length > 40 ? `${text.substring(0, 40)}...` : text;
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      chat.item?.title?.toLowerCase().includes(searchLower) ||
      chat.otherParticipant?.name?.toLowerCase().includes(searchLower) ||
      chat.lastMessage?.message?.toLowerCase().includes(searchLower)
    );
  });

  // Group chats by date
  const groupChatsByDate = () => {
    const groups = {};
    filteredChats.forEach(chat => {
      const date = new Date(chat.updatedAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(chat);
    });
    return groups;
  };

  const chatGroups = groupChatsByDate();

  const getChatItemImage = (chat) => {
    if (chat.item?.images?.[0]) return chat.item.images[0];
    if (chat.otherParticipant?.profilePicture) return chat.otherParticipant.profilePicture;
    return "https://ui-avatars.com/api/?name=" + encodeURIComponent(chat.item?.title || "SR") + "&background=4361ee&color=ffffff";
  };

  if (loading && chats.length === 0) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #4361ee",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px auto"
          }}></div>
          <h3 style={{ marginBottom: "10px", color: "#212529" }}>Loading your conversations</h3>
          <p style={{ color: "#6c757d" }}>Fetching your chat history...</p>
        </div>
      </div>
    );
  }

  if (error && chats.length === 0) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px", color: "#dc3545" }}>⚠️</div>
          <h3 style={{ marginBottom: "10px", color: "#212529" }}>Unable to Load Chats</h3>
          <p style={{ color: "#6c757d", marginBottom: "25px" }}>{error}</p>
          <button
            onClick={fetchChats}
            style={{
              padding: "12px 24px",
              background: "#4361ee",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        {/* Header */}
        <div style={{ 
          padding: "20px 25px", 
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          color: "white"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "24px" }}>Messages</h1>
              <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link 
              to="/"
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>←</span> Back to Items
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "15px 20px", borderBottom: "1px solid #e0e0e0" }}>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Chats List */}
        <div style={{ maxHeight: "600px", overflowY: "auto" }}>
          {filteredChats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>💬</div>
              <h3 style={{ marginBottom: "10px", color: "#212529" }}>No conversations yet</h3>
              <p style={{ color: "#6c757d", marginBottom: "25px" }}>
                {searchTerm ? 'No conversations match your search' : 'Start a conversation by messaging an item seller'}
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: "12px 24px",
                  background: "#4361ee",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Browse Items
              </button>
            </div>
          ) : (
            Object.entries(chatGroups).map(([date, dateChats]) => (
              <div key={date}>
                <div style={{
                  padding: "10px 20px",
                  background: "#f8f9fa",
                  color: "#6c757d",
                  fontSize: "12px",
                  fontWeight: "500",
                  borderBottom: "1px solid #e0e0e0"
                }}>
                  {new Date(date).toLocaleDateString([], { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                {dateChats.map((chat) => (
                  <div
                    key={chat._id}
                    id={`chat-${chat.item?._id}`}
                    onClick={() => navigate(`/chat/item/${chat.item?._id}`)}
                    style={{
                      padding: "15px 20px",
                      borderBottom: "1px solid #e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      background: chat.unreadCount > 0 ? "#eef2ff" : 
                                highlightedChatId === chat.item?._id ? "#fff8e1" : "white",
                      borderLeft: highlightedChatId === chat.item?._id ? "4px solid #ff9800" : "none"
                    }}
                    onMouseEnter={(e) => {
                      if (highlightedChatId !== chat.item?._id) {
                        e.target.style.background = "#f8f9fa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (highlightedChatId !== chat.item?._id) {
                        e.target.style.background = chat.unreadCount > 0 ? "#eef2ff" : "white";
                      }
                    }}
                  >
                    {/* Avatar/Image */}
                    <div style={{ position: "relative" }}>
                      <img
                        src={getChatItemImage(chat)}
                        alt={chat.item?.title || "Chat"}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                      />
                      {chat.unreadCount > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-5px",
                          background: "#4361ee",
                          color: "white",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "bold"
                        }}>
                          {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: "15px",
                            color: chat.unreadCount > 0 ? "#212529" : "#6c757d",
                            fontWeight: chat.unreadCount > 0 ? "600" : "400"
                          }}>
                            {chat.item?.title || "Unknown Item"}
                          </h4>
                          <p style={{ 
                            margin: "4px 0 0 0", 
                            fontSize: "13px",
                            color: "#6c757d"
                          }}>
                            {chat.otherParticipant?.name || "Unknown User"}
                          </p>
                        </div>
                        <div style={{ 
                          fontSize: "11px", 
                          color: "#6c757d",
                          textAlign: "right"
                        }}>
                          {formatTime(chat.updatedAt)}
                        </div>
                      </div>

                      {/* Message Preview */}
                      <p style={{ 
                        margin: "8px 0 0 0", 
                        fontSize: "13px",
                        color: chat.unreadCount > 0 ? "#212529" : "#6c757d",
                        fontWeight: chat.unreadCount > 0 ? "500" : "400"
                      }}>
                        {formatMessagePreview(chat.lastMessage)}
                      </p>

                      {/* Item Info */}
                      <div style={{ 
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "11px",
                        color: "#6c757d"
                      }}>
                        {chat.item?.price && (
                          <span style={{
                            background: "#e9ecef",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}>
                            Rs. {chat.item.price.toLocaleString()}
                          </span>
                        )}
                        {chat.item?.category && (
                          <span style={{
                            background: "#e9ecef",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}>
                            {chat.item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Text */}
      <div style={{ 
        background: "#eef2ff", 
        padding: "15px", 
        borderRadius: "8px",
        fontSize: "13px",
        color: "#4361ee",
        textAlign: "center",
        border: "1px solid #d0d7ff"
      }}>
        <strong>💡 Tip:</strong> Click on any conversation to continue chatting. All your messages are saved here.
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

export default ChatList;