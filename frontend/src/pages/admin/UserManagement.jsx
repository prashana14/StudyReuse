import { useState, useEffect } from "react";
import API from "../../services/api";
import "./admin.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [blockingUserId, setBlockingUserId] = useState(null);
  const [unblockingUserId, setUnblockingUserId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {
        page: currentPage,
        limit: 10,
        search,
        ...(statusFilter && { status: statusFilter })
      };
      
      const res = await API.get("/admin/users", { params });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalUsers(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, statusFilter]);

  const handleBlockUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to block "${userName}"?`)) {
      return;
    }

    const reason = prompt("Please enter the reason for blocking this user:");
    if (!reason) {
      alert("Blocking cancelled. Reason is required.");
      return;
    }

    try {
      setBlockingUserId(userId);
      await API.put(`/admin/users/${userId}/block`, { reason });
      
      setSuccess(`User "${userName}" has been blocked successfully.`);
      setTimeout(() => setSuccess(""), 3000);
      
      fetchUsers();
    } catch (err) {
      console.error("Error blocking user:", err);
      setError(err.response?.data?.message || "Failed to block user.");
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleUnblockUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to unblock "${userName}"?`)) {
      return;
    }

    try {
      setUnblockingUserId(userId);
      await API.put(`/admin/users/${userId}/unblock`);
      
      setSuccess(`User "${userName}" has been unblocked successfully.`);
      setTimeout(() => setSuccess(""), 3000);
      
      fetchUsers();
    } catch (err) {
      console.error("Error unblocking user:", err);
      setError(err.response?.data?.message || "Failed to unblock user.");
    } finally {
      setUnblockingUserId(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  if (loading && users.length === 0) {
    return (
      <div className="loading-container">
        Loading users...
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>User Management</h1>
        <p className="page-description">
          Manage user accounts, view status, and block/unblock users
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-filter-container">
        <form onSubmit={handleSearch} style={{ flex: 1, display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button 
            type="button" 
            onClick={clearFilters}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </form>
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="">All Users</option>
          <option value="blocked">Blocked Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3>Users ({totalUsers} total)</h3>
          <div style={{ fontSize: "14px", color: "#64748b" }}>
            Page {currentPage} of {totalPages}
          </div>
        </div>
        
        <div className="card-content">
          {users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No Users Found</h3>
              <p>{search ? "Try a different search term" : "No users registered yet"}</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
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
                                ID: {user._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#475569" }}>{user.email}</td>
                        <td>
                          {user.isBlocked ? (
                            <span className="badge badge-blocked">
                              <span>🚫</span> Blocked
                            </span>
                          ) : (
                            <span className="badge badge-active">
                              <span>✅</span> Active
                            </span>
                          )}
                          {user.role === "admin" && (
                            <span style={{ 
                              marginLeft: "8px",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              background: "#fef3c7",
                              color: "#92400e",
                              fontWeight: "500"
                            }}>
                              Admin
                            </span>
                          )}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "14px" }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="table-actions">
                            {user.isBlocked ? (
                              <button
                                onClick={() => handleUnblockUser(user._id, user.name)}
                                disabled={unblockingUserId === user._id}
                                className="btn btn-success btn-sm"
                              >
                                {unblockingUserId === user._id ? (
                                  <>Unblocking...</>
                                ) : (
                                  <>Unblock</>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(user._id, user.name)}
                                disabled={blockingUserId === user._id || user.role === "admin"}
                                className="btn btn-danger btn-sm"
                                title={user.role === "admin" ? "Cannot block admin users" : ""}
                              >
                                {blockingUserId === user._id ? (
                                  <>Blocking...</>
                                ) : (
                                  <>Block</>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Statistics Card */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <h3>User Statistics</h3>
        </div>
        <div className="card-content">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Total Users</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{totalUsers}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Active Users</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#10b981" }}>
                {users.filter(u => !u.isBlocked).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Blocked Users</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#ef4444" }}>
                {users.filter(u => u.isBlocked).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Admin Users</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#8b5cf6" }}>
                {users.filter(u => u.role === "admin").length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;