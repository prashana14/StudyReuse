import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiService from "../services/api"; // CHANGED: Import apiService

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    activeBarters: 0,
    pendingRequests: 0,
    itemsThisMonth: 0,
    totalViews: 0
  });
  
  const [recentItems, setRecentItems] = useState([]);
  const [recentBarters, setRecentBarters] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allBarters, setAllBarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");

  // Helper Functions
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const StatCard = ({ title, value, icon, color, suffix, onClick }) => (
    <div 
      className="card hover-lift" 
      style={{ 
        background: `linear-gradient(135deg, ${color.start}, ${color.end})`,
        color: "white",
        padding: "24px",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.3s, box-shadow 0.3s",
        borderRadius: "12px"
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px", fontWeight: "500" }}>{title}</p>
          <h3 style={{ fontSize: "32px", fontWeight: "700", margin: 0, lineHeight: 1.2 }}>
            {value}{suffix && <span style={{ fontSize: "20px", opacity: 0.9 }}>{suffix}</span>}
          </h3>
        </div>
        <div style={{ 
          width: "56px", 
          height: "56px", 
          borderRadius: "12px", 
          background: "rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px"
        }}>
          {icon}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // 🔥 CHANGED: Use apiService.items.getMyItems()
        const itemsResponse = await apiService.items.getMyItems();
        console.log("Dashboard Items API Response:", itemsResponse.data);
        
        // Extract items from the new API response structure
        const userItems = itemsResponse.data?.data?.items || 
                         itemsResponse.data?.items || 
                         itemsResponse.data || 
                         [];
        
        console.log("Extracted userItems:", userItems.length, "items");
        setAllItems(userItems);
        
        // 🔥 FIX: Handle Cloudinary URLs
        const itemsWithImageURL = userItems.map(item => ({
          ...item,
          // Ensure we have the Cloudinary URL
          imageURL: item.imageURL || item.image || null
        }));
        
        setAllItems(itemsWithImageURL);
        
        // Fetch barter requests
        try {
          const barterResponse = await apiService.barter.getMyBarters();
          console.log("Barter API Response:", barterResponse.data);
          
          const barters = barterResponse.data?.data || 
                         barterResponse.data || 
                         [];
          
          console.log("Extracted barters:", barters.length, "barters");
          setAllBarters(barters);
          
          // Calculate barter stats
          let activeBarters = 0;
          let pendingRequests = 0;
          
          if (barters.length > 0) {
            activeBarters = barters.filter(b => b?.status === "pending" || b?.status === "negotiating").length;
            
            // Get user info from localStorage
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = user?._id?.toString() || user?.id;
            
            pendingRequests = barters.filter(b => {
              const ownerId = b?.owner?._id?.toString() || b?.owner?.toString() || b?.ownerId;
              return (b?.status === "pending") && (ownerId === userId);
            }).length;
          }
          
          // Update stats with barters
          setStats(prev => ({
            ...prev,
            activeBarters,
            pendingRequests
          }));
          
          // Set recent barters
          setRecentBarters(barters.slice(0, 3));
          
        } catch (barterError) {
          console.warn("Could not fetch barters:", barterError);
          setAllBarters([]);
          setRecentBarters([]);
        }
        
        // Calculate item stats
        let totalValue = 0;
        let itemsThisMonth = 0;
        let totalViews = 0;
        
        if (userItems.length > 0) {
          totalValue = userItems.reduce((sum, item) => {
            const price = parseFloat(item?.price) || 0;
            return sum + price;
          }, 0);
          
          totalViews = userItems.reduce((sum, item) => sum + (item?.views || 0), 0);
          
          // Get current month items
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          itemsThisMonth = userItems.filter(item => {
            if (!item?.createdAt) return false;
            const itemDate = new Date(item.createdAt);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
          }).length;
        }
        
        // Update stats
        setStats({
          totalItems: userItems.length,
          totalValue: totalValue,
          activeBarters: stats.activeBarters, // Keep existing or default
          pendingRequests: stats.pendingRequests,
          itemsThisMonth: itemsThisMonth,
          totalViews: totalViews
        });
        
        // Set recent items (last 3)
        setRecentItems(itemsWithImageURL.slice(0, 3));
        
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data. Please try again.");
        setAllItems([]);
        setAllBarters([]);
        setRecentItems([]);
        setRecentBarters([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1400px", margin: "40px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div className="loading" style={{ 
              margin: "0 auto", 
              width: "60px", 
              height: "60px", 
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #4361ee",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading your dashboard...</p>
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
  }

  // Render error state
  if (error) {
    return (
      <div className="container" style={{ maxWidth: "1400px", margin: "40px auto" }}>
        <div style={{ 
          textAlign: "center", 
          padding: "60px", 
          background: "#ffebee", 
          borderRadius: "12px",
          marginTop: "40px"
        }}>
          <div style={{ fontSize: "60px", marginBottom: "20px", opacity: 0.3 }}>❌</div>
          <h2 style={{ marginBottom: "15px", color: "#d32f2f" }}>Unable to Load Dashboard</h2>
          <p style={{ color: "#6c757d", marginBottom: "30px", maxWidth: "500px", margin: "0 auto" }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ 
              padding: "12px 32px", 
              fontSize: "16px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              border: "none",
              borderRadius: "6px",
              color: "white",
              fontWeight: "500",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Helper to get image URL for display
  const getItemImage = (item) => {
    return item.imageURL || item.image || null;
  };

  // Safe map function for rendering
  const safeMap = (array, renderFunction) => {
    if (!Array.isArray(array)) return null;
    return array.map(renderFunction);
  };

  return (
    <div className="container" style={{ maxWidth: "1400px", margin: "40px auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h1 style={{ 
              fontSize: "2.5rem", 
              marginBottom: "8px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "700"
            }}>
              {getGreeting()}!
            </h1>
            <p style={{ color: "#6c757d", fontSize: "1.125rem", maxWidth: "600px" }}>
              Welcome back to your StudyReuse dashboard. Here's your activity summary.
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <Link to="/add-item" className="btn btn-primary" style={{ 
              padding: "12px 28px", 
              fontSize: "16px",
              background: "linear-gradient(135deg, #4361ee, #7209b7)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              + Add New Item
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "30px",
          gap: "5px"
        }}>
          {["overview", "items", "barters", "analytics"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "16px 24px",
                background: "none",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                color: activeTab === tab ? "#4361ee" : "#6c757d",
                borderBottom: activeTab === tab ? "3px solid #4361ee" : "none",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.3s",
                position: "relative",
                marginBottom: "-2px"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = "#4361ee";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = "#6c757d";
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONDITIONAL TAB CONTENT ===== */}
      
      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* Stats Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "24px",
            marginBottom: "40px" 
          }}>
            <StatCard 
              title="TOTAL ITEMS"
              value={stats.totalItems}
              icon="📚"
              color={{ start: "#4361ee", end: "#7209b7" }}
              onClick={() => setActiveTab("items")}
            />
            
            <StatCard 
              title="TOTAL VALUE"
              value={stats.totalValue.toLocaleString('en-IN')}
              icon="💰"
              color={{ start: "#38b000", end: "#2d9100" }}
              suffix=" Rs."
            />
            
            <StatCard 
              title="ACTIVE BARTERS"
              value={stats.activeBarters}
              icon="🔄"
              color={{ start: "#ff9e00", end: "#e68900" }}
              onClick={() => setActiveTab("barters")}
            />
            
            <StatCard 
              title="PENDING REQUESTS"
              value={stats.pendingRequests}
              icon="⏳"
              color={{ start: "#f72585", end: "#b5179e" }}
              onClick={() => setActiveTab("barters")}
            />
          </div>

          {/* Two Column Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
            {/* Left Column - Recent Items */}
            <div className="card" style={{ 
              padding: "30px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>Recent Items</h2>
                <button 
                  onClick={() => setActiveTab("items")}
                  style={{ 
                    color: "#4361ee", 
                    textDecoration: "none", 
                    fontWeight: "600", 
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All →
                </button>
              </div>
              
              {recentItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>📚</div>
                  <p style={{ color: "#6c757d", marginBottom: "20px" }}>No items added yet</p>
                  <Link to="/add-item" className="btn btn-primary" style={{
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #4361ee, #7209b7)",
                    border: "none",
                    borderRadius: "6px",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "500"
                  }}>
                    Add Your First Item
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {safeMap(recentItems, (item) => {
                    const imageUrl = getItemImage(item);
                    return (
                      <div key={item._id} style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "20px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "12px",
                        transition: "all 0.3s",
                        background: "white"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.title || "Item"}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              marginRight: "20px"
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div style="
                                  width: 80px;
                                  height: 80px;
                                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                  border-radius: 8px;
                                  margin-right: 20px;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  color: white;
                                  font-size: 24px;
                                ">
                                  📚
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "80px",
                            height: "80px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            borderRadius: "8px",
                            marginRight: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "24px"
                          }}>
                            📚
                          </div>
                        )}
                        
                        <div style={{ flex: 1 }}>
                          <h4 style={{ marginBottom: "8px", fontSize: "16px", fontWeight: "600" }}>
                            {item.title || "Untitled Item"}
                          </h4>
                          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <span style={{ 
                              fontSize: "18px", 
                              fontWeight: "700", 
                              color: "#4361ee"
                            }}>
                              ₹ {item.price || 0}
                            </span>
                            {item.category && (
                              <span style={{
                                background: "#eef2ff",
                                color: "#4361ee",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "500"
                              }}>
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Link 
                          to={`/item/${item._id}`} 
                          className="btn btn-outline"
                          style={{ 
                            padding: "8px 20px", 
                            fontSize: "14px",
                            border: "1px solid #4361ee",
                            color: "#4361ee",
                            background: "transparent",
                            borderRadius: "6px",
                            textDecoration: "none",
                            transition: "all 0.3s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#4361ee";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#4361ee";
                          }}
                        >
                          View
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column - Quick Stats & Actions */}
            <div>
              {/* Quick Stats Card */}
              <div className="card" style={{ 
                padding: "30px", 
                marginBottom: "30px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
              }}>
                <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600", color: "#212529" }}>Quick Stats</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#6c757d", fontSize: "14px" }}>Items This Month</span>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#4361ee" }}>{stats.itemsThisMonth}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#6c757d", fontSize: "14px" }}>Total Views</span>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#38b000" }}>{stats.totalViews}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#6c757d", fontSize: "14px" }}>Avg. Item Price</span>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#7209b7" }}>
                      ₹ {stats.totalItems > 0 ? Math.round(stats.totalValue / stats.totalItems) : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="card" style={{ 
                padding: "30px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
              }}>
                <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600", color: "#212529" }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <button 
                    onClick={() => navigate("/add-item")}
                    className="btn btn-primary"
                    style={{ 
                      textAlign: "left", 
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "15px",
                      background: "linear-gradient(135deg, #4361ee, #7209b7)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: "500",
                      transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <span style={{ fontSize: "20px" }}>➕</span> Add New Item
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab("barters")}
                    className="btn btn-outline"
                    style={{ 
                      textAlign: "left", 
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "15px",
                      border: "1px solid #4361ee",
                      background: "transparent",
                      borderRadius: "8px",
                      color: "#4361ee",
                      fontWeight: "500",
                      transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#4361ee";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#4361ee";
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🔄</span> Manage Barters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Barters */}
          {recentBarters.length > 0 && (
            <div className="card" style={{ 
              marginTop: "30px", 
              padding: "30px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>Recent Barter Requests</h2>
                <button 
                  onClick={() => setActiveTab("barters")}
                  style={{ 
                    color: "#4361ee", 
                    textDecoration: "none", 
                    fontWeight: "600", 
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All →
                </button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                {safeMap(recentBarters, (barter) => (
                  <div key={barter._id} style={{
                    padding: "20px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    transition: "all 0.3s",
                    background: "white"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <span style={{
                        padding: "6px 16px",
                        background: barter.status === "pending" ? "#fff3cd" : 
                                  barter.status === "accepted" ? "#d1e7dd" : "#f8d7da",
                        color: barter.status === "pending" ? "#856404" : 
                              barter.status === "accepted" ? "#0f5132" : "#721c24",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase"
                      }}>
                        {barter.status || "unknown"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#6c757d" }}>
                        {barter.createdAt ? new Date(barter.createdAt).toLocaleDateString() : "Unknown date"}
                      </span>
                    </div>
                    
                    <h4 style={{ marginBottom: "10px", fontSize: "16px", fontWeight: "600" }}>
                      {barter.item?.title || "Item"}
                    </h4>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #4361ee, #7209b7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold"
                        }}>
                          {barter.requester?.name?.charAt(0) || "U"}
                        </div>
                        <span style={{ fontSize: "14px", color: "#212529" }}>
                          {barter.requester?.name || "User"}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/barter/${barter._id}`)}
                      className="btn btn-outline"
                      style={{ 
                        width: "100%", 
                        padding: "10px", 
                        fontSize: "14px",
                        border: "1px solid #4361ee",
                        background: "transparent",
                        borderRadius: "6px",
                        color: "#4361ee",
                        fontWeight: "500",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#4361ee";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#4361ee";
                      }}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ITEMS TAB */}
      {activeTab === "items" && (
        <div className="card" style={{ 
          padding: "30px", 
          minHeight: "400px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>
              Your Items ({Array.isArray(allItems) ? allItems.length : 0})
            </h2>
            <button 
              onClick={() => navigate("/add-item")}
              className="btn btn-primary"
              style={{ 
                padding: "10px 24px", 
                fontSize: "14px",
                background: "linear-gradient(135deg, #4361ee, #7209b7)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontWeight: "500",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              + Add New Item
            </button>
          </div>
          
          {!Array.isArray(allItems) || allItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <div style={{ fontSize: "60px", marginBottom: "20px", opacity: 0.3 }}>📚</div>
              <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px", fontWeight: "600" }}>No items yet</h3>
              <p style={{ color: "#6c757d", marginBottom: "30px", maxWidth: "400px", margin: "0 auto" }}>
                Start by adding your study materials to share or trade with others.
              </p>
              <button 
                onClick={() => navigate("/add-item")}
                className="btn btn-primary"
                style={{ 
                  padding: "12px 32px", 
                  fontSize: "16px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontWeight: "500",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                Add Your First Item
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {safeMap(allItems, (item) => {
                const imageUrl = getItemImage(item);
                return (
                  <div key={item._id} className="card" style={{ 
                    padding: "20px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    transition: "all 0.3s",
                    background: "white"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title || "Item"}
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginBottom: "15px"
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div style="
                              width: 100%;
                              height: 180px;
                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              border-radius: 8px;
                              margin-bottom: 15px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              color: white;
                              font-size: 36px;
                            ">
                              📚
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "180px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "8px",
                        marginBottom: "15px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "36px"
                      }}>
                        📚
                      </div>
                    )}
                    
                    <h4 style={{ marginBottom: "8px", fontSize: "16px", fontWeight: "600" }}>
                      {item.title || "Untitled Item"}
                    </h4>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <span style={{ 
                        fontSize: "18px", 
                        fontWeight: "700", 
                        color: "#4361ee"
                      }}>
                        ₹ {item.price || 0}
                      </span>
                      {item.category && (
                        <span style={{
                          background: "#eef2ff",
                          color: "#4361ee",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}>
                          {item.category}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                      <button 
                        onClick={() => navigate(`/item/${item._id}`)}
                        className="btn btn-outline"
                        style={{ 
                          flex: 1, 
                          padding: "8px", 
                          fontSize: "14px",
                          border: "1px solid #4361ee",
                          background: "transparent",
                          borderRadius: "6px",
                          color: "#4361ee",
                          fontWeight: "500",
                          transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#4361ee";
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#4361ee";
                        }}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => navigate(`/edit-item/${item._id}`)}
                        className="btn btn-outline"
                        style={{ 
                          flex: 1, 
                          padding: "8px", 
                          fontSize: "14px",
                          border: "1px solid #38b000",
                          background: "transparent",
                          borderRadius: "6px",
                          color: "#38b000",
                          fontWeight: "500",
                          transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#38b000";
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#38b000";
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BARTERS TAB */}
      {activeTab === "barters" && (
        <div className="card" style={{ 
          padding: "30px", 
          minHeight: "400px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>
              Your Barters ({Array.isArray(allBarters) ? allBarters.length : 0})
            </h2>
          </div>
          
          {!Array.isArray(allBarters) || allBarters.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <div style={{ fontSize: "60px", marginBottom: "20px", opacity: 0.3 }}>🔄</div>
              <h3 style={{ marginBottom: "15px", color: "#212529", fontSize: "20px", fontWeight: "600" }}>No barters yet</h3>
              <p style={{ color: "#6c757d", marginBottom: "30px", maxWidth: "400px", margin: "0 auto" }}>
                Start trading your study materials with others by initiating a barter.
              </p>
              <button 
                onClick={() => setActiveTab("items")}
                className="btn btn-primary"
                style={{ 
                  padding: "12px 32px", 
                  fontSize: "16px",
                  background: "linear-gradient(135deg, #4361ee, #7209b7)",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontWeight: "500",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                Browse Items to Trade
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {safeMap(allBarters, (barter) => (
                <div key={barter._id} style={{
                  padding: "24px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "20px",
                  alignItems: "center",
                  transition: "all 0.3s",
                  background: "white"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
                        {barter.item?.title || "Untitled Item"}
                      </h4>
                      <span style={{
                        padding: "6px 16px",
                        background: barter.status === "pending" ? "#fff3cd" : 
                                  barter.status === "accepted" ? "#d1e7dd" : "#f8d7da",
                        color: barter.status === "pending" ? "#856404" : 
                              barter.status === "accepted" ? "#0f5132" : "#721c24",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase"
                      }}>
                        {barter.status || "unknown"}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #4361ee, #7209b7)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold"
                        }}>
                          {barter.requester?.name?.charAt(0) || "U"}
                        </div>
                        <span style={{ fontSize: "14px", color: "#212529" }}>
                          {barter.requester?.name || "User"}
                        </span>
                      </div>
                      
                      <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        {barter.createdAt ? new Date(barter.createdAt).toLocaleDateString() : "Unknown date"}
                      </span>
                    </div>
                    
                    {barter.message && (
                      <p style={{ color: "#6c757d", fontSize: "14px", margin: 0, fontStyle: "italic" }}>
                        "{barter.message}"
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/barter/${barter._id}`)}
                    className="btn btn-outline"
                    style={{ 
                      padding: "10px 24px", 
                      fontSize: "14px",
                      border: "1px solid #4361ee",
                      background: "transparent",
                      borderRadius: "6px",
                      color: "#4361ee",
                      fontWeight: "500",
                      transition: "all 0.3s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#4361ee";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#4361ee";
                    }}
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="card" style={{ 
          padding: "30px", 
          minHeight: "400px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <h2 style={{ marginBottom: "30px", fontSize: "24px", fontWeight: "600", color: "#212529" }}>Analytics Dashboard</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
            <div style={{ 
              textAlign: "center", 
              padding: "40px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
              <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>📊</div>
              <h3 style={{ marginBottom: "10px", color: "#212529", fontWeight: "600" }}>Analytics Coming Soon</h3>
              <p style={{ color: "#6c757d" }}>
                Detailed analytics and insights are under development.
              </p>
            </div>
            
            <div style={{ 
              textAlign: "center", 
              padding: "40px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
              <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>📈</div>
              <h3 style={{ marginBottom: "10px", color: "#212529", fontWeight: "600" }}>Activity Trends</h3>
              <p style={{ color: "#6c757d" }}>
                View your monthly performance and engagement metrics.
              </p>
            </div>
            
            <div style={{ 
              textAlign: "center", 
              padding: "40px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
              <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>🏆</div>
              <h3 style={{ marginBottom: "10px", color: "#212529", fontWeight: "600" }}>Leaderboard</h3>
              <p style={{ color: "#6c757d" }}>
                See how you rank among other users in the community.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;