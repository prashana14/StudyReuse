import { useState, useEffect, useContext } from "react"; // ✅ FIXED
import { AuthContext } from "../context/AuthContext"; // ✅ ADDED
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const BarterRequests = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
   // ✅ NOW WORKING
    console.log("USER CONTEXT DEBUG:");
  console.log("User object:", user);
  console.log("User ID:", user?.id);
  console.log("Is user loaded?", !!user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
    sent: 0,
    received: 0
  });

  useEffect(() => {
    fetchBarters();
  }, []);

  const fetchBarters = async () => {
    try {
      setLoading(true);
      const res = await API.get("/barter/my");
      const barters = res.data || [];
      setRequests(barters);
      
      // ✅ FIX: Use proper user comparison
      const userId = user?.id?.toString();
      
      // Calculate stats
      const stats = {
        pending: barters.filter(b => b.status === "pending").length,
        accepted: barters.filter(b => b.status === "accepted").length,
        rejected: barters.filter(b => b.status === "rejected").length,
        sent: barters.filter(b => {
          const requesterId = b.requester?._id?.toString() || b.requester?.toString();
          return requesterId === userId;
        }).length,
        received: barters.filter(b => {
          const ownerId = b.owner?._id?.toString() || b.owner?.toString();
          return ownerId === userId;
        }).length
      };
      setStats(stats);
      
    } catch (err) {
      console.error("Error fetching barters:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
  console.log(`Attempting to update barter ${id} to ${status}`);
  
  try {
    console.log(`Making API call: PUT /barter/${id} with status: ${status}`);
    
    const response = await API.put(`/barter/${id}`, { status });
    
    console.log("API Response:", response.data);
    
    if (response.data && response.data.message) {
      console.log("Server message:", response.data.message);
    }
    
    // Update local state
    setRequests(prev => {
      const updated = prev.map(req => 
        req._id === id ? { ...req, status } : req
      );
      console.log("Updated requests state:", updated);
      return updated;
    });
    
    // Update stats
    setStats(prev => {
      const newStats = {
        ...prev,
        [status]: prev[status] + 1,
        pending: status !== "pending" ? prev.pending - 1 : prev.pending
      };
      console.log("Updated stats:", newStats);
      return newStats;
    });
    
    const statusMessages = {
      accepted: "Barter request accepted!",
      rejected: "Barter request rejected.",
      pending: "Barter request status updated."
    };
    
    alert(statusMessages[status] || "Status updated");
    
    // Refresh to be sure
    setTimeout(() => {
      fetchBarters();
    }, 500);
    
  } catch (err) {
    console.error("ERROR updating barter status:");
    console.error("Error object:", err);
    console.error("Error response:", err.response);
    console.error("Error data:", err.response?.data);
    console.error("Error status:", err.response?.status);
    
    if (err.response?.data?.message) {
      alert(`Error: ${err.response.data.message}`);
    } else if (err.message) {
      alert(`Error: ${err.message}`);
    } else {
      alert("Failed to update status. Please try again.");
    }
  }
};
  const filteredRequests = requests.filter(req => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return req.status === "pending";
    
    const userId = user?.id?.toString();
    const requesterId = req.requester?._id?.toString() || req.requester?.toString();
    const ownerId = req.owner?._id?.toString() || req.owner?.toString();
    
    if (activeFilter === "sent") return requesterId === userId;
    if (activeFilter === "received") return ownerId === userId;
    return req.status === activeFilter;
  });

  const BarterCard = ({ request }) => {
  const userId = user?.id?.toString();
  
  console.log("🔍 BARTER CARD DEBUG:");
  console.log("Request ID:", request._id);
  console.log("Request status:", request.status);
  console.log("Full request object:", request);
  
  // Debug owner field
  console.log("Request.owner:", request.owner);
  console.log("Request.owner type:", typeof request.owner);
  console.log("Request.owner._id:", request.owner?._id);
  console.log("Request.owner.toString():", request.owner?.toString());
  
  const requesterId = request.requester?._id?.toString() || request.requester?.toString();
  const ownerId = request.owner?._id?.toString() || request.owner?.toString();
  
  console.log("Calculated requesterId:", requesterId);
  console.log("Calculated ownerId:", ownerId);
  console.log("Current userId:", userId);
  
  const isOwner = ownerId === userId;
  const isRequester = requesterId === userId;
  
  console.log("Is owner?", isOwner);
  console.log("Is requester?", isRequester);
  console.log("Show accept button?", isOwner && request.status === "pending");
  
  // ... rest of the component
    
    return (
      <div className="card hover-lift" style={{ padding: "25px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
              <div style={{
                padding: "8px 16px",
                background: request.status === "pending" ? "#fff3cd" : 
                          request.status === "accepted" ? "#d1e7dd" : "#f8d7da",
                color: request.status === "pending" ? "#856404" : 
                      request.status === "accepted" ? "#0f5132" : "#721c24",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase"
              }}>
                {request.status}
              </div>
              
              <span style={{ fontSize: "14px", color: "#6c757d" }}>
                {new Date(request.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <h3 style={{ marginBottom: "10px", fontSize: "18px" }}>{request.item?.title || "Study Item"}</h3>
            
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}>
                  {isRequester ? "Y" : request.requester?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p style={{ fontSize: "14px", color: "#6c757d", margin: 0 }}>{isRequester ? "You" : "Requester"}</p>
                  <p style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
                    {isRequester ? "You" : request.requester?.name || "Unknown User"}
                  </p>
                </div>
              </div>
              
              <div style={{ fontSize: "24px", color: "#6c757d" }}>⇄</div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #38b000, #2d9100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}>
                  {isOwner ? "Y" : request.owner?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p style={{ fontSize: "14px", color: "#6c757d", margin: 0 }}>{isOwner ? "You" : "Owner"}</p>
                  <p style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
                    {isOwner ? "You" : request.owner?.name || "Unknown User"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {request.item?.imageURL && (
            <img
              src={request.item.imageURL}
              alt={request.item.title}
              style={{
                width: "120px",
                height: "120px",
                objectFit: "cover",
                borderRadius: "12px",
                marginLeft: "20px"
              }}
            />
          )}
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: "15px", 
          paddingTop: "20px", 
          borderTop: "1px solid #e0e0e0" 
        }}>
          <button 
            onClick={() => navigate(`/item/${request.item?._id}`)}
            className="btn btn-outline"
            style={{ flex: 1, padding: "12px", fontSize: "14px" }}
          >
          View Item
          </button>
          
          {isOwner && request.status === "pending" && (
            <>
              <button 
                onClick={() => updateStatus(request._id, "accepted")}
                className="btn"
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  fontSize: "14px",
                  background: "linear-gradient(135deg, #38b000, #2d9100)",
                  color: "white",
                  border: "none"
                }}
              >
              Accept
              </button>
              
              <button 
                onClick={() => updateStatus(request._id, "rejected")}
                className="btn"
                style={{ 
                  flex: 1, 
                  padding: "12px", 
                  fontSize: "14px",
                  background: "linear-gradient(135deg, #e63946, #d00000)",
                  color: "white",
                  border: "none"
                }}
              >
              Reject
              </button>
            </>
          )}
          
          {!isOwner && request.status === "pending" && (
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to withdraw this barter request?")) {
                  updateStatus(request._id, "rejected");
                }
              }}
              className="btn btn-outline"
              style={{ 
                flex: 1, 
                padding: "12px", 
                fontSize: "14px",
                borderColor: "#e63946",
                color: "#e63946"
              }}
            >
            Withdraw
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: "1200px", margin: "40px auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          marginBottom: "16px",
          background: "linear-gradient(135deg, #4361ee, #7209b7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Barter Management
        </h1>
        <p style={{ color: "#6c757d", fontSize: "1.125rem", maxWidth: "600px" }}>
          Manage your trade requests, negotiate exchanges, and track your barter history.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "20px",
        marginBottom: "40px" 
      }}>
        <div className="card" style={{ textAlign: "center", padding: "25px" }}>
          <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Pending</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: "#ff9e00" }}>{stats.pending}</p>
        </div>
        
        <div className="card" style={{ textAlign: "center", padding: "25px" }}>
          <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Accepted</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: "#38b000" }}>{stats.accepted}</p>
        </div>
        
        <div className="card" style={{ textAlign: "center", padding: "25px" }}>
          <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Rejected</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: "#e63946" }}>{stats.rejected}</p>
        </div>
        
        <div className="card" style={{ textAlign: "center", padding: "25px" }}>
          <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Sent</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: "#4361ee" }}>{stats.sent}</p>
        </div>
        
        <div className="card" style={{ textAlign: "center", padding: "25px" }}>
          <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>Received</p>
          <p style={{ fontSize: "32px", fontWeight: "700", color: "#7209b7" }}>{stats.received}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: "20px", marginBottom: "30px" }}>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All Requests" },
            { key: "pending", label: "Pending"},
            { key: "sent", label: "Sent"},
            { key: "received", label: "Received"},
            { key: "accepted", label: "Accepted"},
            { key: "rejected", label: "Rejected"}
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              style={{
                padding: "12px 24px",
                background: activeFilter === filter.key ? "linear-gradient(135deg, #4361ee, #7209b7)" : "white",
                color: activeFilter === filter.key ? "white" : "#6c757d",
                border: activeFilter === filter.key ? "none" : "1px solid #e0e0e0",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== filter.key) {
                  e.target.style.borderColor = "#4361ee";
                  e.target.style.color = "#4361ee";
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== filter.key) {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.color = "#6c757d";
                }
              }}
            >
              <span>{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barter Requests List */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div className="loading" style={{ 
              margin: "0 auto", 
              width: "50px", 
              height: "50px", 
              borderWidth: "4px",
              borderTopColor: "#4361ee"
            }}></div>
            <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>
              Loading barter requests...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "80px", marginBottom: "30px", opacity: 0.2 }}></div>
            <h3 style={{ marginBottom: "16px", color: "#212529" }}>
              No {activeFilter !== "all" ? activeFilter : ""} barter requests
            </h3>
            <p style={{ color: "#6c757d", marginBottom: "30px", maxWidth: "400px", margin: "0 auto" }}>
              {activeFilter === "sent" 
                ? "You haven't sent any barter requests yet." 
                : activeFilter === "received" 
                ? "No one has sent you barter requests yet." 
                : "You don't have any barter requests yet."}
            </p>
            <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
              <button 
                onClick={() => navigate("/")}
                className="btn btn-primary"
                style={{ padding: "12px 32px" }}
              >
                Browse Items
              </button>
              <button 
                onClick={() => setActiveFilter("all")}
                className="btn btn-outline"
                style={{ padding: "12px 32px" }}
              >
                View All
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <p style={{ color: "#6c757d", fontSize: "14px" }}>
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
              <button 
                onClick={fetchBarters}
                className="btn btn-outline"
                style={{ padding: "10px 20px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
              >
              Refresh
              </button>
            </div>
            
            {filteredRequests.map(request => (
              <BarterCard key={request._id} request={request} />
            ))}
          </div>
        )}
      </div>

      {/* How to Barter Guide */}
      <div className="card" style={{ marginTop: "50px", padding: "30px" }}>
        <h3 style={{ marginBottom: "25px", fontSize: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        How to Barter Successfully
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "25px" }}>
          <div>
            <h4 style={{ fontSize: "16px", marginBottom: "10px", color: "#4361ee" }}>1. Find Items</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Browse study materials and click "Request Barter" on items you're interested in.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "16px", marginBottom: "10px", color: "#4361ee" }}>2. Send Request</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              The item owner will receive your request and can accept, reject, or counter-offer.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "16px", marginBottom: "10px", color: "#4361ee" }}>3. Negotiate</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Use the chat feature to discuss trade details, condition, and exchange methods.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "16px", marginBottom: "10px", color: "#4361ee" }}>4. Complete Trade</h4>
            <p style={{ fontSize: "14px", color: "#6c757d" }}>
              Once accepted, arrange a safe meetup or shipping to complete the exchange.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarterRequests;