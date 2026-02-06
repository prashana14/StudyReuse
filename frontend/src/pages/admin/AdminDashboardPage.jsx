// src/pages/admin/AdminDashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from "../../services/api";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [activeTab, setActiveTab] = useState("overview");

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get admin name from localStorage or API
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("adminData") || localStorage.getItem("user") || "{}");
    setAdminName(user?.name || user?.username || "Admin");
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Using the correct endpoint from your API service
      const data = await apiService.admin.getDashboardStats();
      console.log("Dashboard stats:", data);
      setStats(data?.stats || data || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError("Failed to load dashboard data");
      // Set default stats on error
      setStats({
        totalUsers: 0,
        totalItems: 0,
        activeUsers: 0,
        pendingItems: 0,
        verifiedItems: 0,
        blockedUsers: 0,
        totalOrders: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon, color, suffix, onClick, description }) => (
    <div 
      className="card hover-lift" 
      style={{ 
        background: `linear-gradient(135deg, ${color.start}, ${color.end})`,
        color: "white",
        padding: "20px",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.3s, box-shadow 0.3s",
        borderRadius: "12px",
        minHeight: "120px"
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
          <h3 style={{ fontSize: "28px", fontWeight: "700", margin: 0, lineHeight: 1.2 }}>
            {value}{suffix && <span style={{ fontSize: "16px", opacity: 0.9 }}>{suffix}</span>}
          </h3>
          {description && (
            <p style={{ fontSize: "12px", opacity: 0.8, marginTop: "5px", marginBottom: 0 }}>
              {description}
            </p>
          )}
        </div>
        <div style={{ 
          width: "48px", 
          height: "48px", 
          borderRadius: "10px", 
          background: "rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px"
        }}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Handle navigation
  const handleStatCardClick = (type) => {
    switch(type) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'items':
        navigate('/admin/items');
        break;
      case 'pending':
        navigate('/admin/items?status=pending');
        break;
      case 'orders':
        navigate('/admin/orders');
        break;
      default:
        break;
    }
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'review-pending':
        navigate('/admin/items?status=pending');
        break;
      case 'view-users':
        navigate('/admin/users');
        break;
      case 'send-notification':
        navigate('/admin/notifications');
        break;
      case 'view-analytics':
        navigate('/admin/analytics');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: "1400px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div className="loading" style={{ 
              margin: "0 auto", 
              width: "60px", 
              height: "60px", 
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <p style={{ marginTop: "20px", color: "#6c757d", fontSize: "16px" }}>Loading admin dashboard...</p>
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

  const statCards = [
    {
      id: 'users',
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: { start: "#3b82f6", end: "#1d4ed8" },
      description: 'Registered users',
      onClick: () => handleStatCardClick('users')
    },
    {
      id: 'items',
      title: 'Total Items',
      value: stats?.totalItems || 0,
      icon: '📦',
      color: { start: "#10b981", end: "#059669" },
      description: 'Listed items',
      onClick: () => handleStatCardClick('items')
    },
    {
      id: 'pending',
      title: 'Pending Review',
      value: stats?.pendingItems || 0,
      icon: '⏳',
      color: { start: "#f59e0b", end: "#d97706" },
      description: 'Awaiting approval',
      onClick: () => handleStatCardClick('pending')
    },
    {
      id: 'verified',
      title: 'Verified Items',
      value: stats?.verifiedItems || 0,
      icon: '✅',
      color: { start: "#059669", end: "#047857" },
      description: 'Approved items'
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: '📊',
      color: { start: "#8b5cf6", end: "#7c3aed" },
      description: 'Completed transactions',
      onClick: () => handleStatCardClick('orders')
    }
  ];

  const quickActions = [
    {
      id: 'review-pending',
      title: 'Review Pending Items',
      icon: '🔍',
      color: 'bg-blue-100 hover:bg-blue-200',
      textColor: 'text-blue-800'
    },
    {
      id: 'view-users',
      title: 'Manage Users',
      icon: '👤',
      color: 'bg-purple-100 hover:bg-purple-200',
      textColor: 'text-purple-800'
    },
    {
      id: 'send-notification',
      title: 'Send Notification',
      icon: '📢',
      color: 'bg-amber-100 hover:bg-amber-200',
      textColor: 'text-amber-800'
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      icon: '📈',
      color: 'bg-green-100 hover:bg-green-200',
      textColor: 'text-green-800'
    }
  ];

  return (
    <div className="container" style={{ maxWidth: "1400px", margin: "40px auto", padding: "0 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h1 style={{ 
              fontSize: "2.5rem", 
              marginBottom: "8px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "700"
            }}>
              {getGreeting()}, {adminName}!
            </h1>
            <p style={{ color: "#6c757d", fontSize: "1.125rem", maxWidth: "600px" }}>
              Welcome to the Admin Dashboard. Here's your system overview.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "30px",
          gap: "5px",
          overflowX: "auto",
          paddingBottom: "5px"
        }}>
          {["overview", "users", "items", "orders", "analytics"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "16px 24px",
                background: "none",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                color: activeTab === tab ? "#3b82f6" : "#6c757d",
                borderBottom: activeTab === tab ? "3px solid #3b82f6" : "none",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.3s",
                position: "relative",
                marginBottom: "-2px",
                whiteSpace: "nowrap",
                minWidth: "120px",
                textAlign: "center"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = "#3b82f6";
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

      {/* Error Message */}
      {error && (
        <div style={{
          background: "#fee2e2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px", color: "#dc2626" }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: "500", color: "#dc2626" }}>
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={() => setError("")}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              color: "#dc2626",
              cursor: "pointer",
              padding: "5px"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* Stats Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
            gap: "20px",
            marginBottom: "40px" 
          }}>
            {statCards.map((stat) => (
              <StatCard 
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                description={stat.description}
                onClick={stat.onClick}
              />
            ))}
          </div>

          {/* Quick Actions Section Only */}
          <div className="card" style={{ 
            padding: "30px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            minHeight: "300px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>Quick Actions</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  style={{ 
                    textAlign: "left", 
                    padding: "16px",
                    fontSize: "15px",
                    border: "1px solid #e5e7eb",
                    background: "white",
                    borderRadius: "8px",
                    color: "#374151",
                    fontWeight: "500",
                    transition: "all 0.3s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "10px",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <span style={{ fontSize: "24px", marginBottom: "5px" }}>{action.icon}</span>
                  <span>{action.title}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="card" style={{ 
          padding: "30px", 
          minHeight: "400px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>
              Users Management ({stats?.totalUsers || 0} users)
            </h2>
            <button 
              onClick={() => navigate('/admin/users')}
              className="btn btn-primary"
              style={{ 
                padding: "10px 24px", 
                fontSize: "14px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontWeight: "500",
                transition: "all 0.3s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Go to Users
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "60px", marginBottom: "20px", opacity: 0.3 }}>👥</div>
            <p style={{ color: "#6c757d" }}>
              Manage all registered users, view profiles, block/unblock users, and monitor user activity.
            </p>
          </div>
        </div>
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
              Items Management ({stats?.totalItems || 0} items)
            </h2>
            <button 
              onClick={() => navigate('/admin/items')}
              className="btn btn-primary"
              style={{ 
                padding: "10px 24px", 
                fontSize: "14px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontWeight: "500",
                transition: "all 0.3s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Go to Items
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "60px", marginBottom: "20px", opacity: 0.3 }}>📦</div>
            <p style={{ color: "#6c757d" }}>
              Review pending items, approve/reject listings, and manage all items on the platform.
            </p>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="card" style={{ 
          padding: "30px", 
          minHeight: "400px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>
              Orders Management ({stats?.totalOrders || 0} orders)
            </h2>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="btn btn-primary"
              style={{ 
                padding: "10px 24px", 
                fontSize: "14px",
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontWeight: "500",
                transition: "all 0.3s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Go to Orders
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "60px", marginBottom: "20px", opacity: 0.3 }}>📊</div>
            <p style={{ color: "#6c757d" }}>
              Monitor all transactions, track order status, and manage platform revenue.
            </p>
          </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#212529" }}>Analytics Dashboard</h2>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="btn btn-primary"
              style={{ 
                padding: "10px 24px", 
                fontSize: "14px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontWeight: "500",
                transition: "all 0.3s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Go to Analytics
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "60px", marginBottom: "20px", opacity: 0.3 }}>📈</div>
            <p style={{ color: "#6c757d" }}>
              View detailed analytics and reports about platform performance and user engagement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;