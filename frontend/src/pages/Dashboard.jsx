import { useEffect, useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's items
        const itemsRes = await API.get("/items/my");
        const userItems = itemsRes.data || [];
        
        // Fetch barter requests
        const barterRes = await API.get("/barter/my");
        const barters = barterRes.data || [];
        
        // Calculate stats
        const totalValue = userItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        const activeBarters = barters.filter(b => b.status === "pending").length;
        const pendingRequests = barters.filter(b => b.status === "pending" && b.owner === user._id).length;
        
        // Get current month items (example)
        const currentMonth = new Date().getMonth();
        const itemsThisMonth = userItems.filter(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate.getMonth() === currentMonth;
        }).length;
        
        setStats({
          totalItems: userItems.length,
          totalValue: totalValue,
          activeBarters: activeBarters,
          pendingRequests: pendingRequests,
          itemsThisMonth: itemsThisMonth,
          totalViews: userItems.reduce((sum, item) => sum + (item.views || 0), 0)
        });
        
        // Set recent items (last 3)
        setRecentItems(userItems.slice(0, 3));
        
        // Set recent barters (last 3)
        setRecentBarters(barters.slice(0, 3));
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        cursor: onClick ? "pointer" : "default"
      }}
      onClick={onClick}
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

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1400px", margin: "40px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div className="loading" style={{ 
              margin: "0 auto", 
              width: "60px", 
              height: "60px", 
              borderWidth: "4px",
              borderTopColor: "#4361ee"
            }}></div>
            <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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
              backgroundClip: "text"
            }}>
              {getGreeting()}!
            </h1>
            <p style={{ color: "#6c757d", fontSize: "1.125rem", maxWidth: "600px" }}>
              Welcome back to your StudyReuse dashboard. Here's your activity summary.
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <Link to="/add-item" className="btn btn-primary" style={{ padding: "12px 28px", fontSize: "16px" }}>
              + Add New Item
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "30px"
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
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
          onClick={() => navigate("/my-items")}
        />
        
        <StatCard 
          title="TOTAL VALUE"
          value={stats.totalValue.toLocaleString()}
          icon="💰"
          color={{ start: "#38b000", end: "#2d9100" }}
          suffix=" Rs."
        />
        
        <StatCard 
          title="ACTIVE BARTERS"
          value={stats.activeBarters}
          icon="🔄"
          color={{ start: "#ff9e00", end: "#e68900" }}
          onClick={() => navigate("/barter")}
        />
        
        <StatCard 
          title="PENDING REQUESTS"
          value={stats.pendingRequests}
          icon="⏳"
          color={{ start: "#f72585", end: "#b5179e" }}
          onClick={() => navigate("/barter")}
        />
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        {/* Left Column - Recent Items */}
        <div className="card" style={{ padding: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ margin: 0, fontSize: "24px" }}>Recent Items</h2>
            <Link to="/my-items" style={{ color: "#4361ee", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
              View All →
            </Link>
          </div>
          
          {recentItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.3 }}>📚</div>
              <p style={{ color: "#6c757d", marginBottom: "20px" }}>No items added yet</p>
              <Link to="/add-item" className="btn btn-primary">
                Add Your First Item
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {recentItems.map((item) => (
                <div key={item._id} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "20px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  {item.imageURL ? (
                    <img
                      src={item.imageURL}
                      alt={item.title}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginRight: "20px"
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
                    <h4 style={{ marginBottom: "8px", fontSize: "16px" }}>{item.title}</h4>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                      <span style={{ 
                        fontSize: "18px", 
                        fontWeight: "700", 
                        color: "#4361ee"
                      }}>
                        Rs. {item.price}
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
                    style={{ padding: "8px 20px", fontSize: "14px" }}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Quick Stats & Actions */}
        <div>
          {/* Quick Stats Card */}
          <div className="card" style={{ padding: "30px", marginBottom: "30px" }}>
            <h3 style={{ marginBottom: "24px", fontSize: "20px" }}>Quick Stats</h3>
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
                  Rs. {stats.totalItems > 0 ? Math.round(stats.totalValue / stats.totalItems) : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card" style={{ padding: "30px" }}>
            <h3 style={{ marginBottom: "24px", fontSize: "20px" }}>Quick Actions</h3>
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
                  fontSize: "15px"
                }}
              >
                <span style={{ fontSize: "20px" }}>➕</span> Add New Item
              </button>
              
              <button 
                onClick={() => navigate("/barter")}
                className="btn btn-outline"
                style={{ 
                  textAlign: "left", 
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "15px"
                }}
              >
                <span style={{ fontSize: "20px" }}>🔄</span> Manage Barters
              </button>
              
              <button 
                onClick={() => navigate("/notifications")}
                className="btn btn-outline"
                style={{ 
                  textAlign: "left", 
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "15px"
                }}
              >
                <span style={{ fontSize: "20px" }}>🔔</span> Notifications
                {stats.pendingRequests > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    background: "#e63946",
                    color: "white",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {stats.pendingRequests}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => navigate("/profile")}
                className="btn btn-outline"
                style={{ 
                  textAlign: "left", 
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "15px"
                }}
              >
                <span style={{ fontSize: "20px" }}>👤</span> My Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Barters */}
      {recentBarters.length > 0 && (
        <div className="card" style={{ marginTop: "30px", padding: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ margin: 0, fontSize: "24px" }}>Recent Barter Requests</h2>
            <Link to="/barter" style={{ color: "#4361ee", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
              View All →
            </Link>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {recentBarters.map((barter) => (
              <div key={barter._id} style={{
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
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
                    {barter.status}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6c757d" }}>
                    {new Date(barter.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 style={{ marginBottom: "10px", fontSize: "16px" }}>{barter.item?.title || "Item"}</h4>
                
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
                  onClick={() => navigate(`/barter`)}
                  className="btn btn-outline"
                  style={{ width: "100%", padding: "10px", fontSize: "14px" }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;