import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";
import { useNavigate } from "react-router-dom";

const BarterRequests = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
    sent: 0,
    received: 0
  });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedItemForBarter, setSelectedItemForBarter] = useState(null);
  const [selectedOfferItem, setSelectedOfferItem] = useState(null);
  const [barterMessage, setBarterMessage] = useState("");

  useEffect(() => {
    fetchBarters();
    fetchUserItems();
  }, [user]);

  const fetchBarters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.barter.getMyBarters();
      console.log("Barter API response:", response); // Debug log
      
      // Handle different possible response structures
      let barterArray = [];
      
      if (Array.isArray(response)) {
        barterArray = response;
      } else if (response && Array.isArray(response.data)) {
        barterArray = response.data;
      } else if (response && Array.isArray(response.barters)) {
        barterArray = response.barters;
      } else if (response && typeof response === 'object') {
        // If it's an object, try to extract barters array
        const data = response;
        if (data.data && Array.isArray(data.data)) {
          barterArray = data.data;
        } else if (data.results && Array.isArray(data.results)) {
          barterArray = data.results;
        } else if (data.barters && Array.isArray(data.barters)) {
          barterArray = data.barters;
        } else if (data.items && Array.isArray(data.items)) {
          barterArray = data.items;
        }
      }
      
      console.log("Extracted barters:", barterArray); // Debug log
      setRequests(barterArray);
      
      // Calculate stats
      const userId = user?.id?.toString() || user?._id?.toString();
      const stats = {
        pending: barterArray.filter(b => b.status === "pending").length,
        accepted: barterArray.filter(b => b.status === "accepted").length,
        rejected: barterArray.filter(b => b.status === "rejected").length,
        sent: barterArray.filter(b => {
          const requesterId = b.requester?._id?.toString() || b.requester?.id?.toString();
          return requesterId === userId;
        }).length,
        received: barterArray.filter(b => {
          const ownerId = b.owner?._id?.toString() || b.owner?.id?.toString();
          return ownerId === userId;
        }).length
      };
      
      setStats(stats);
      
    } catch (err) {
      console.error("Error fetching barters:", err);
      setError(err.response?.data?.message || "Failed to load barter requests");
      
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItems = async () => {
    try {
      setItemsLoading(true);
      const response = await apiService.items.getMyItems();
      console.log("User items API response:", response); // Debug log
      
      // Handle different possible response structures
      let items = [];
      
      if (Array.isArray(response)) {
        items = response;
      } else if (response && Array.isArray(response.data)) {
        items = response.data;
      } else if (response && Array.isArray(response.items)) {
        items = response.items;
      } else if (response && typeof response === 'object') {
        // If it's an object, try to extract items array
        const data = response;
        if (data.data && Array.isArray(data.data)) {
          items = data.data;
        } else if (data.results && Array.isArray(data.results)) {
          items = data.results;
        } else if (data.items && Array.isArray(data.items)) {
          items = data.items;
        }
      }
      
      console.log("Extracted user items:", items.length, "items");
      
      // Now filter the items
      const availableItems = items.filter(item => 
        item && item.status === "available"
      );
      
      setUserItems(availableItems);
      
    } catch (err) {
      console.error("Error fetching user items:", err);
      console.error("Error response:", err.response?.data);
      
      // Set empty array as fallback
      setUserItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const openBarterModal = (item) => {
    setSelectedItemForBarter(item);
    setSelectedOfferItem(null);
    setBarterMessage("");
    setShowOfferModal(true);
  };

  const sendBarterRequest = async () => {
    if (!selectedOfferItem) {
      alert("⚠️ Please select an item to offer in exchange");
      return;
    }

    try {
      const barterData = {
        itemId: selectedItemForBarter._id || selectedItemForBarter.id,
        offerItemId: selectedOfferItem._id || selectedOfferItem.id,
        message: barterMessage
      };

      await apiService.barter.create(barterData);
      
      alert("✅ Barter request sent successfully!");
      setShowOfferModal(false);
      fetchBarters();
      
    } catch (err) {
      console.error("Error sending barter request:", err);
      alert(err.response?.data?.message || "Failed to send barter request");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      if (status === "accepted") {
        await apiService.barter.acceptBarter(id);
      } else if (status === "rejected") {
        await apiService.barter.rejectBarter(id);
      } else {
        // For other status updates if needed
        await apiService.put(`/barter/${id}`, { status });
      }
      
      setRequests(prev => prev.map(req => 
        req._id === id ? { ...req, status } : req
      ));
      
      fetchBarters();
      
      const statusMessages = {
        accepted: "✅ Barter request accepted! Both items are now reserved.",
        rejected: "❌ Barter request rejected.",
        pending: "🔄 Barter request updated."
      };
      
      alert(statusMessages[status] || "Status updated");
      
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const withdrawBarter = async (id) => {
    if (!window.confirm("Are you sure you want to withdraw this barter request?")) {
      return;
    }

    try {
      await apiService.barter.cancelBarter(id);
      
      setRequests(prev => prev.filter(req => req._id !== id));
      fetchBarters();
      
      alert("✅ Barter request withdrawn successfully!");
      
    } catch (err) {
      console.error("Error withdrawing barter:", err);
      alert(err.response?.data?.message || "Failed to withdraw barter request");
    }
  };

  const filteredRequests = Array.isArray(requests) ? requests.filter(req => {
    if (!req) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return req.status === "pending";
    if (activeFilter === "accepted") return req.status === "accepted";
    if (activeFilter === "rejected") return req.status === "rejected";
    
    const userId = user?.id?.toString() || user?._id?.toString();
    const requesterId = req.requester?._id?.toString() || req.requester?.id?.toString();
    const ownerId = req.owner?._id?.toString() || req.owner?.id?.toString();
    
    if (activeFilter === "sent") return requesterId === userId;
    if (activeFilter === "received") return ownerId === userId;
    
    return true;
  }) : [];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "#F59E0B", bg: "#FEF3C7", emoji: "⏳" },
      accepted: { color: "#10B981", bg: "#D1FAE5", emoji: "✅" },
      rejected: { color: "#EF4444", bg: "#FEE2E2", emoji: "❌" }
    };
    
    const config = statusConfig[status] || { color: "#6B7280", bg: "#F3F4F6", emoji: "📄" };
    
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "uppercase",
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}20`
      }}>
        {config.emoji} {status}
      </span>
    );
  };

  const getFilterIcon = (filter) => {
    const icons = {
      all: "📋",
      pending: "⏳",
      sent: "📤",
      received: "📥",
      accepted: "✅",
      rejected: "❌"
    };
    return icons[filter] || "📋";
  };

  const getStatIcon = (key) => {
    const icons = {
      pending: "⏳",
      accepted: "✅",
      rejected: "❌",
      sent: "📤",
      received: "📥"
    };
    return icons[key] || "📊";
  };

  const BarterCard = ({ request }) => {
    if (!request) return null;
    
    const userId = user?.id?.toString() || user?._id?.toString();
    const requesterId = request.requester?._id?.toString() || request.requester?.id?.toString();
    const ownerId = request.owner?._id?.toString() || request.owner?.id?.toString();
    
    const isOwner = ownerId === userId;
    const isRequester = requesterId === userId;
    
    const formatDate = (dateString) => {
      if (!dateString) return "Unknown date";
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Status indicator */}
        <div style={{
          position: "absolute",
          top: "0",
          right: "0",
          width: "60px",
          height: "60px",
          background: request.status === "pending" ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" :
                    request.status === "accepted" ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" :
                    "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
          borderRadius: "0 16px 0 60px",
          opacity: "0.1"
        }}></div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", position: "relative" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
              {getStatusBadge(request.status)}
              
              <span style={{ 
                fontSize: "13px", 
                color: "#6B7280",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                📅 {formatDate(request.createdAt || request.createdDate)}
              </span>
            </div>
            
            {/* Trade Exchange Section */}
            <div style={{ 
              backgroundColor: "#F9FAFB", 
              padding: "20px", 
              borderRadius: "12px",
              marginBottom: "20px",
              border: "1px solid #E5E7EB"
            }}>
              <h4 style={{ 
                fontSize: "16px", 
                color: "#111827", 
                margin: "0 0 16px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                🔄 Trade Proposal
              </h4>
              
              <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
                {/* Offered Item */}
                <div style={{ flex: 1, minWidth: "250px" }}>
                  <div style={{ 
                    backgroundColor: "white", 
                    padding: "16px", 
                    borderRadius: "8px",
                    border: "2px solid #10B981",
                    height: "100%"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        backgroundColor: "#D1FAE5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#10B981",
                        fontSize: "20px",
                        flexShrink: 0
                      }}>
                        📤
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px 0" }}>
                          {isRequester ? "You offer" : `${request.requester?.name || request.requester?.username || "User"} offers`}
                        </p>
                        <p style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>
                          {request.offerItem?.title || "Unknown Item"}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: "12px" }}>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0" }}>
                        <strong>Value:</strong> Rs. {request.offerItem?.price || "N/A"}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0" }}>
                        <strong>Condition:</strong> {request.offerItem?.condition || "N/A"}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0" }}>
                        <strong>Status:</strong> 
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "500",
                          marginLeft: "8px",
                          backgroundColor: request.offerItem?.status === "available" ? "#D1FAE5" : 
                                        request.offerItem?.status === "reserved" ? "#FEF3C7" : "#FEE2E2",
                          color: request.offerItem?.status === "available" ? "#065F46" : 
                                request.offerItem?.status === "reserved" ? "#92400E" : "#991B1B"
                        }}>
                          {request.offerItem?.status || "unknown"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Exchange Arrow */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  padding: "0 10px"
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#6366F1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "18px",
                    transform: "rotate(90deg)"
                  }}>
                    ⇄
                  </div>
                </div>
                
                {/* Requested Item */}
                <div style={{ flex: 1, minWidth: "250px" }}>
                  <div style={{ 
                    backgroundColor: "white", 
                    padding: "16px", 
                    borderRadius: "8px",
                    border: "2px solid #6366F1",
                    height: "100%"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        backgroundColor: "#E0E7FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6366F1",
                        fontSize: "20px",
                        flexShrink: 0
                      }}>
                        📥
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px 0" }}>
                          {isRequester ? "You want" : `Wants your item`}
                        </p>
                        <p style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>
                          {request.item?.title || "Unknown Item"}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: "12px" }}>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0" }}>
                        <strong>Value:</strong> Rs. {request.item?.price || "N/A"}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0" }}>
                        <strong>Condition:</strong> {request.item?.condition || "N/A"}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0" }}>
                        <strong>Status:</strong> 
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "500",
                          marginLeft: "8px",
                          backgroundColor: request.item?.status === "available" ? "#D1FAE5" : 
                                        request.item?.status === "reserved" ? "#FEF3C7" : "#FEE2E2",
                          color: request.item?.status === "available" ? "#065F46" : 
                                request.item?.status === "reserved" ? "#92400E" : "#991B1B"
                        }}>
                          {request.item?.status || "unknown"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Barter Message */}
              {request.message && (
                <div style={{ 
                  marginTop: "16px", 
                  padding: "12px", 
                  backgroundColor: "#FEFCE8",
                  borderRadius: "8px",
                  borderLeft: "4px solid #F59E0B"
                }}>
                  <p style={{ fontSize: "14px", color: "#92400E", margin: 0, fontStyle: "italic" }}>
                    💬 "{request.message}"
                  </p>
                </div>
              )}
            </div>
            
            {/* Participants */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              backgroundColor: "#F9FAFB",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #E5E7EB"
            }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0 auto 8px auto"
                }}>
                  {isRequester ? "👤" : (request.requester?.name?.charAt(0) || request.requester?.username?.charAt(0) || "?")}
                </div>
                <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px 0" }}>
                  {isRequester ? "You" : "Requester"}
                </p>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: 0 }}>
                  {isRequester ? "You" : request.requester?.name || request.requester?.username || "Unknown"}
                </p>
              </div>
              
              <div style={{ padding: "0 20px", color: "#6B7280", fontSize: "14px" }}>
                trading with
              </div>
              
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0 auto 8px auto"
                }}>
                  {isOwner ? "👤" : (request.owner?.name?.charAt(0) || request.owner?.username?.charAt(0) || "?")}
                </div>
                <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px 0" }}>
                  {isOwner ? "You" : "Owner"}
                </p>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: 0 }}>
                  {isOwner ? "You" : request.owner?.name || request.owner?.username || "Unknown"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Item Images */}
          <div style={{ marginLeft: "24px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "12px", minWidth: "120px" }}>
            {request.offerItem?.imageURL && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: "0 0 6px 0", fontWeight: "500" }}>Offered</p>
                <img
                  src={request.offerItem.imageURL}
                  alt={request.offerItem.title}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "2px solid #10B981"
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {request.item?.imageURL && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: "0 0 6px 0", fontWeight: "500" }}>Requested</p>
                <img
                  src={request.item.imageURL}
                  alt={request.item.title}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "2px solid #6366F1"
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          paddingTop: "20px", 
          borderTop: "1px solid #E5E7EB" 
        }}>
          <button 
            onClick={() => navigate(`/item/${request.item?._id || request.item?.id}`)}
            style={{ 
              flex: 1, 
              padding: "12px",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor: "transparent",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              color: "#6B7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#6366F1";
              e.target.style.color = "#6366F1";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#E5E7EB";
              e.target.style.color = "#6B7280";
            }}
          >
            👁️ View Item
          </button>
          
          {isOwner && request.status === "pending" && (
            <>
              <button 
                onClick={() => updateStatus(request._id || request.id, "accepted")}
                style={{ 
                  flex: 1, 
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "transform 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                }}
              >
                ✅ Accept Trade
              </button>
              
              <button 
                onClick={() => updateStatus(request._id || request.id, "rejected")}
                style={{ 
                  flex: 1, 
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "transform 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                }}
              >
                ❌ Reject Trade
              </button>
            </>
          )}
          
          {isRequester && request.status === "pending" && (
            <button 
              onClick={() => withdrawBarter(request._id || request.id)}
              style={{ 
                flex: 1, 
                padding: "12px",
                fontSize: "14px",
                fontWeight: "500",
                backgroundColor: "transparent",
                border: "1px solid #EF4444",
                borderRadius: "8px",
                color: "#EF4444",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#FEF2F2";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              ↩️ Withdraw
            </button>
          )}
          
          {request.status === "accepted" && (
            <button 
              onClick={() => navigate(`/chat/${request.owner?._id || request.owner?.id}`)}
              style={{ 
                flex: 1, 
                padding: "12px",
                fontSize: "14px",
                fontWeight: "500",
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
              }}
            >
              💬 Chat Now
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: "1200px", 
        margin: "60px auto", 
        padding: "0 20px",
        textAlign: "center" 
      }}>
        <div style={{ 
          margin: "60px auto", 
          width: "60px", 
          height: "60px", 
          border: "4px solid #F3F4F6",
          borderTop: "4px solid #6366F1",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <h3 style={{ margin: "24px 0 12px 0", color: "#111827", fontSize: "20px" }}>
          Loading Barter Requests
        </h3>
        <p style={{ color: "#6B7280", fontSize: "14px" }}>
          Fetching your trade requests...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: "1200px", 
        margin: "60px auto", 
        padding: "0 20px",
        textAlign: "center" 
      }}>
        <div style={{ 
          width: "80px", 
          height: "80px", 
          borderRadius: "50%",
          backgroundColor: "#FEF2F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "32px"
        }}>
          ⚠️
        </div>
        <h3 style={{ margin: "0 0 12px 0", color: "#111827", fontSize: "20px" }}>
          Something went wrong
        </h3>
        <p style={{ color: "#6B7280", marginBottom: "24px", maxWidth: "400px", margin: "0 auto" }}>
          {error}
        </p>
        <button 
          onClick={fetchBarters}
          style={{ 
            padding: "12px 32px",
            backgroundColor: "#6366F1",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: "0 20px" 
    }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h1 style={{ 
              fontSize: "32px", 
              margin: "0 0 8px 0",
              background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "700"
            }}>
              🔄 Barter Exchange
            </h1>
            <p style={{ 
              color: "#6B7280", 
              fontSize: "16px", 
              maxWidth: "600px",
              lineHeight: "1.5",
              margin: 0
            }}>
              Trade your study materials with fellow students. Send and manage barter requests.
            </p>
          </div>
          
          <button 
            onClick={fetchBarters}
            style={{ 
              padding: "12px 20px",
              backgroundColor: "#F3F4F6",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              color: "#4B5563",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#F3F4F6";
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
        gap: "20px",
        marginBottom: "40px" 
      }}>
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} style={{ 
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: key === "pending" ? "#FEF3C7" : 
                                key === "accepted" ? "#D1FAE5" : 
                                key === "rejected" ? "#FEE2E2" : 
                                key === "sent" ? "#E0E7FF" : "#DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}>
                {getStatIcon(key)}
              </div>
              <div>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#6B7280", 
                  margin: "0 0 4px 0",
                  textTransform: "capitalize"
                }}>
                  {key}
                </p>
                <p style={{ 
                  fontSize: "28px", 
                  fontWeight: "700", 
                  margin: 0,
                  color: key === "pending" ? "#F59E0B" : 
                        key === "accepted" ? "#10B981" : 
                        key === "rejected" ? "#EF4444" : 
                        key === "sent" ? "#6366F1" : "#3B82F6"
                }}>
                  {value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #E5E7EB",
        marginBottom: "30px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "#E0E7FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6366F1",
            fontSize: "16px"
          }}>
            📊
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#111827", fontWeight: "600" }}>
            Filter Requests
          </h3>
        </div>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All Requests" },
            { key: "pending", label: "Pending" },
            { key: "sent", label: "Sent" },
            { key: "received", label: "Received" },
            { key: "accepted", label: "Accepted" },
            { key: "rejected", label: "Rejected" }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              style={{
                padding: "10px 18px",
                background: activeFilter === filter.key ? "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)" : "white",
                color: activeFilter === filter.key ? "white" : "#4B5563",
                border: activeFilter === filter.key ? "none" : "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              {getFilterIcon(filter.key)} {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barter Requests List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ margin: 0, fontSize: "20px", color: "#111827", fontWeight: "600" }}>
            {activeFilter === "all" ? "All Barter Requests" : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Requests`}
            <span style={{ 
              marginLeft: "12px",
              padding: "4px 12px",
              backgroundColor: "#F3F4F6",
              color: "#6B7280",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {Array.isArray(filteredRequests) ? filteredRequests.length : 0} {filteredRequests.length === 1 ? 'request' : 'requests'}
            </span>
          </h3>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button 
              onClick={() => navigate("/items")}
              style={{ 
                padding: "10px 20px",
                backgroundColor: "transparent",
                border: "1px solid #6366F1",
                borderRadius: "8px",
                color: "#6366F1",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#EEF2FF";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              🔍 Browse Items
            </button>
          </div>
        </div>

        {!Array.isArray(filteredRequests) || filteredRequests.length === 0 ? (
          <div style={{ 
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "60px 40px",
            border: "2px dashed #E5E7EB",
            textAlign: "center"
          }}>
            <div style={{ 
              width: "80px", 
              height: "80px", 
              borderRadius: "50%",
              backgroundColor: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "32px"
            }}>
              🔄
            </div>
            <h3 style={{ margin: "0 0 12px 0", color: "#111827", fontSize: "20px" }}>
              {activeFilter === "all" 
                ? "No Barter Requests Yet" 
                : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Requests`}
            </h3>
            <p style={{ 
              color: "#6B7280", 
              marginBottom: "32px", 
              maxWidth: "400px", 
              margin: "0 auto",
              lineHeight: "1.5"
            }}>
              {activeFilter === "sent" 
                ? "You haven't sent any barter requests yet. Browse items and click 'Request Barter' to start trading." 
                : activeFilter === "received" 
                ? "No one has sent you barter requests yet. When someone wants to trade with your items, they'll appear here." 
                : "You don't have any barter requests yet. Start trading with fellow students to exchange study materials!"}
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
              <button 
                onClick={() => navigate("/items")}
                style={{ 
                  padding: "12px 32px",
                  background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🔍 Browse Items
              </button>
              <button 
                onClick={() => setActiveFilter("all")}
                style={{ 
                  padding: "12px 32px",
                  backgroundColor: "transparent",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  color: "#6B7280",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                📋 View All
              </button>
            </div>
          </div>
        ) : (
          <div>
            {filteredRequests.map(request => (
              <BarterCard key={request._id || request.id} request={request} />
            ))}
          </div>
        )}
      </div>

      {/* Barter Offer Modal */}
      {showOfferModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#111827", fontWeight: "600" }}>
                🔄 Make Barter Offer
              </h2>
              <button 
                onClick={() => setShowOfferModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  color: "#6B7280",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                ✕
              </button>
            </div>

            {/* Item to get */}
            <div style={{ 
              backgroundColor: "#F9FAFB", 
              padding: "16px", 
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #E5E7EB"
            }}>
              <h3 style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 12px 0" }}>
                📥 Item You Want
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {selectedItemForBarter?.imageURL && (
                  <img
                    src={selectedItemForBarter.imageURL}
                    alt={selectedItemForBarter.title}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "6px"
                    }}
                  />
                )}
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "#111827", fontSize: "16px" }}>
                    {selectedItemForBarter?.title}
                  </h4>
                  <p style={{ margin: "2px 0", color: "#6B7280", fontSize: "12px" }}>
                    Rs. {selectedItemForBarter?.price || "N/A"} • {selectedItemForBarter?.condition || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Item to offer */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", color: "#111827", margin: "0 0 12px 0" }}>
                📤 Select Your Item to Offer
              </h3>
              
              {itemsLoading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ 
                    width: "30px", 
                    height: "30px", 
                    border: "3px solid #F3F4F6",
                    borderTop: "3px solid #6366F1",
                    borderRadius: "50%",
                    margin: "0 auto",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  <p style={{ color: "#6B7280", marginTop: "8px", fontSize: "12px" }}>Loading your items...</p>
                </div>
              ) : (!Array.isArray(userItems) || userItems.length === 0) ? (
                <div style={{ 
                  backgroundColor: "#F9FAFB", 
                  padding: "24px", 
                  borderRadius: "8px",
                  textAlign: "center",
                  border: "1px dashed #E5E7EB"
                }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "50%",
                    backgroundColor: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    fontSize: "20px"
                  }}>
                    📦
                  </div>
                  <p style={{ color: "#6B7280", marginBottom: "12px", fontSize: "13px" }}>
                    {!Array.isArray(userItems) 
                      ? "Unable to load your items. Please try again." 
                      : "You don't have any available items to offer."}
                  </p>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button 
                      onClick={() => {
                        setShowOfferModal(false);
                        navigate("/add-item");
                      }}
                      style={{ 
                        padding: "8px 16px",
                        backgroundColor: "#6366F1",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer"
                      }}
                    >
                      ➕ Add New Item
                    </button>
                    <button 
                      onClick={fetchUserItems}
                      style={{ 
                        padding: "8px 16px",
                        backgroundColor: "#F3F4F6",
                        color: "#6B7280",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer"
                      }}
                    >
                      🔄 Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  maxHeight: "200px",
                  overflowY: "auto",
                  padding: "4px"
                }}>
                  {userItems.map(item => (
                    <div
                      key={item._id || item.id}
                      onClick={() => setSelectedOfferItem(item)}
                      style={{
                        backgroundColor: selectedOfferItem?._id === item._id ? "#EEF2FF" : "white",
                        border: `1px solid ${selectedOfferItem?._id === item._id ? "#6366F1" : "#E5E7EB"}`,
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      {item.imageURL && (
                        <img
                          src={item.imageURL}
                          alt={item.title}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                            borderRadius: "6px"
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 2px 0", fontSize: "13px", color: "#111827" }}>
                          {item.title}
                        </h4>
                        <p style={{ margin: "0", fontSize: "11px", color: "#6B7280" }}>
                          Rs. {item.price} • {item.condition}
                        </p>
                      </div>
                      {selectedOfferItem?._id === item._id && (
                        <span style={{ 
                          fontSize: "12px", 
                          color: "#6366F1",
                          fontWeight: "500"
                        }}>
                          ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "13px", 
                color: "#111827", 
                marginBottom: "8px",
                fontWeight: "500"
              }}>
                💬 Message (Optional)
              </label>
              <textarea
                value={barterMessage}
                onChange={(e) => setBarterMessage(e.target.value)}
                placeholder="Add a message explaining your trade offer..."
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "13px",
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => setShowOfferModal(false)}
                style={{ 
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "transparent",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  color: "#6B7280",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={sendBarterRequest}
                disabled={!selectedOfferItem}
                style={{ 
                  flex: 2,
                  padding: "12px",
                  background: selectedOfferItem ? "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" : "#E5E7EB",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: selectedOfferItem ? "pointer" : "not-allowed"
                }}
              >
                🔄 Send Barter Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div style={{ 
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #E5E7EB",
        marginTop: "40px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "#F0F9FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0EA5E9",
            fontSize: "18px"
          }}>
            💡
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#111827", fontWeight: "600" }}>
            Barter Tips
          </h3>
        </div>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "16px" 
        }}>
          <div>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#10B981" }}>✓</span> Offer items of similar value
            </p>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#10B981" }}>✓</span> Be clear about item condition
            </p>
          </div>
          <div>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#10B981" }}>✓</span> Respond to requests promptly
            </p>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#10B981" }}>✓</span> Meet in safe, public locations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default BarterRequests;