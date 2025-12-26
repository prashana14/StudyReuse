import { useState, useEffect } from "react";
import API from "../../services/api";
import "./admin.css";

const ItemManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {
        page: currentPage,
        limit: 10,
        search,
        ...(statusFilter && { status: statusFilter })
      };
      
      const res = await API.get("/admin/items", { params });
      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, search, statusFilter]);

  const handleApproveItem = async (itemId, itemTitle) => {
    if (!window.confirm(`Are you sure you want to approve "${itemTitle}"?`)) {
      return;
    }

    try {
      setActionLoading(`approve-${itemId}`);
      await API.put(`/admin/items/${itemId}/approve`);
      
      setSuccess(`Item "${itemTitle}" has been approved successfully.`);
      setTimeout(() => setSuccess(""), 3000);
      
      fetchItems();
    } catch (err) {
      console.error("Error approving item:", err);
      setError(err.response?.data?.message || "Failed to approve item.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectItem = async (itemId, itemTitle) => {
    const reason = prompt(`Please enter the reason for rejecting "${itemTitle}":`);
    if (!reason) {
      alert("Rejection cancelled. Reason is required.");
      return;
    }

    try {
      setActionLoading(`reject-${itemId}`);
      await API.put(`/admin/items/${itemId}/reject`, { reason });
      
      setSuccess(`Item "${itemTitle}" has been rejected.`);
      setTimeout(() => setSuccess(""), 3000);
      
      fetchItems();
    } catch (err) {
      console.error("Error rejecting item:", err);
      setError(err.response?.data?.message || "Failed to reject item.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async (itemId, itemTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(`delete-${itemId}`);
      await API.delete(`/admin/items/${itemId}`);
      
      setSuccess(`Item "${itemTitle}" has been deleted successfully.`);
      setTimeout(() => setSuccess(""), 3000);
      
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err.response?.data?.message || "Failed to delete item.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchItems();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const getStatusBadge = (item) => {
    if (!item.isApproved) {
      return <span className="badge badge-pending">Pending Approval</span>;
    }
    if (item.isFlagged) {
      return <span className="badge badge-flagged">Flagged</span>;
    }
    return <span className="badge badge-approved">Approved</span>;
  };

  if (loading && items.length === 0) {
    return (
      <div className="loading-container">
        Loading items...
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Item Management</h1>
        <p className="page-description">
          Review, approve, reject, or delete items posted by users
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
            placeholder="Search items by title or description..."
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
          <option value="">All Items</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Items Table */}
      <div className="card">
        <div className="card-header">
          <h3>Items ({totalItems} total)</h3>
          <div style={{ fontSize: "14px", color: "#64748b" }}>
            Page {currentPage} of {totalPages}
          </div>
        </div>
        
        <div className="card-content">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No Items Found</h3>
              <p>{search ? "Try a different search term" : "No items posted yet"}</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Details</th>
                      <th>Owner</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Posted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ maxWidth: "300px" }}>
                            <div style={{ fontWeight: "500", color: "#1e293b", marginBottom: "4px" }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
                              {item.description?.length > 100 
                                ? `${item.description.substring(0, 100)}...`
                                : item.description
                              }
                            </div>
                            <div style={{ fontSize: "12px", color: "#8b5cf6", marginTop: "4px" }}>
                              {item.category}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div className="user-avatar" style={{ width: "28px", height: "28px", fontSize: "12px" }}>
                              {item.owner?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "13px" }}>
                                {item.owner?.name || "Unknown"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {item.owner?.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: "600", color: "#1e293b" }}>
                          ₹{item.price}
                        </td>
                        <td>
                          {getStatusBadge(item)}
                          {item.flagReason && (
                            <div style={{ fontSize: "11px", color: "#991b1b", marginTop: "4px" }}>
                              Reason: {item.flagReason}
                            </div>
                          )}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "14px" }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="table-actions">
                            {!item.isApproved && (
                              <button
                                onClick={() => handleApproveItem(item._id, item.title)}
                                disabled={actionLoading === `approve-${item._id}`}
                                className="btn btn-success btn-sm"
                              >
                                {actionLoading === `approve-${item._id}` ? (
                                  <>Approving...</>
                                ) : (
                                  <>Approve</>
                                )}
                              </button>
                            )}
                            
                            {!item.isApproved && (
                              <button
                                onClick={() => handleRejectItem(item._id, item.title)}
                                disabled={actionLoading === `reject-${item._id}`}
                                className="btn btn-warning btn-sm"
                              >
                                {actionLoading === `reject-${item._id}` ? (
                                  <>Rejecting...</>
                                ) : (
                                  <>Reject</>
                                )}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteItem(item._id, item.title)}
                              disabled={actionLoading === `delete-${item._id}`}
                              className="btn btn-danger btn-sm"
                            >
                              {actionLoading === `delete-${item._id}` ? (
                                <>Deleting...</>
                              ) : (
                                <>Delete</>
                              )}
                            </button>
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
          <h3>Item Statistics</h3>
        </div>
        <div className="card-content">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Total Items</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{totalItems}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Pending Approval</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#f59e0b" }}>
                {items.filter(i => !i.isApproved).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Approved</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#10b981" }}>
                {items.filter(i => i.isApproved && !i.isFlagged).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Flagged/Rejected</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#ef4444" }}>
                {items.filter(i => i.isFlagged).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemManagement;