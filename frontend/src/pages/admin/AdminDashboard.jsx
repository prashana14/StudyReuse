import { useState, useEffect } from "react";
import API from "../../services/api";
import "./admin.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [statsRes, usersRes, itemsRes] = await Promise.all([
        API.get("/admin/dashboard/stats"),
        API.get("/admin/users?limit=5"),
        API.get("/admin/items?limit=5")
      ]);
      
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users || []);
      setRecentItems(itemsRes.data.items || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers || 0, 
      icon: "👥", 
      color: "#3b82f6",
      description: "Registered users"
    },
    { 
      title: "Blocked Users", 
      value: stats?.blockedUsers || 0, 
      icon: "🚫", 
      color: "#ef4444",
      description: "Currently blocked"
    },
    { 
      title: "Total Items", 
      value: stats?.totalItems || 0, 
      icon: "📦", 
      color: "#8b5cf6",
      description: "All items posted"
    },
    { 
      title: "Pending Items", 
      value: stats?.pendingItems || 0, 
      icon: "⏳", 
      color: "#f59e0b",
      description: "Awaiting approval"
    },
    { 
      title: "Flagged Items", 
      value: stats?.flaggedItems || 0, 
      icon: "🚩", 
      color: "#ec4899",
      description: "Reported items"
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="page-description">
          Overview of your platform statistics and recent activity
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="stat-card"
            style={{ borderLeftColor: card.color }}
          >
            <div className="stat-card-content">
              <div className="stat-info">
                <div className="stat-title">{card.title}</div>
                <div className="stat-value">{card.value}</div>
                <p className="stat-footer">{card.description}</p>
              </div>
              <div className="stat-icon">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Users</h3>
            <a href="/admin/users" className="btn btn-outline btn-sm">
              View All →
            </a>
          </div>
          <div className="card-content">
            {recentUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No Users</h3>
                <p>No users registered yet</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "500", color: "#1e293b" }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "#475569" }}>{user.email}</td>
                      <td>
                        {user.isBlocked ? (
                          <span className="badge badge-blocked">Blocked</span>
                        ) : (
                          <span className="badge badge-active">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Items */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Items</h3>
            <a href="/admin/items" className="btn btn-outline btn-sm">
              View All →
            </a>
          </div>
          <div className="card-content">
            {recentItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>No Items</h3>
                <p>No items posted yet</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Owner</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentItems.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ fontWeight: "500", color: "#1e293b", marginBottom: "4px" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          ₹{item.price} • {item.category}
                        </div>
                      </td>
                      <td style={{ color: "#475569" }}>
                        {item.owner?.name || "Unknown"}
                      </td>
                      <td>
                        {!item.isApproved ? (
                          <span className="badge badge-pending">Pending</span>
                        ) : item.isFlagged ? (
                          <span className="badge badge-flagged">Flagged</span>
                        ) : (
                          <span className="badge badge-approved">Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;