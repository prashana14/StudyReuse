import { useState, useEffect } from "react";
import API from "../../services/api";

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
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending Approval</span>;
    }
    if (item.isFlagged) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Flagged</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Approved</span>;
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Item Management</h1>
        <p className="text-gray-600 mt-2">
          Review, approve, reject, or delete items posted by users
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <input
              type="text"
              placeholder="Search items by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
            <button 
              type="button" 
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Items</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Items ({totalItems} total)</h3>
          </div>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
        
        <div className="p-5">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-gray-700 font-medium text-lg mb-2">No Items Found</h3>
              <p className="text-gray-500">
                {search ? "Try a different search term" : "No items posted yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Item Details</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Owner</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Price</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Posted</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-800 mb-1">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {item.description?.length > 100 
                                ? `${item.description.substring(0, 100)}...`
                                : item.description
                              }
                            </div>
                            <div className="text-xs text-purple-600 mt-1">
                              {item.category}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                              {item.owner?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 text-sm">
                                {item.owner?.name || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.owner?.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-800">
                            ₹{item.price}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(item)}
                            {item.flagReason && (
                              <div className="text-xs text-red-600 mt-1">
                                Reason: {item.flagReason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-2">
                            {!item.isApproved && (
                              <button
                                onClick={() => handleApproveItem(item._id, item.title)}
                                disabled={actionLoading === `approve-${item._id}`}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === `approve-${item._id}` ? (
                                  "Approving..."
                                ) : (
                                  "Approve"
                                )}
                              </button>
                            )}
                            
                            {!item.isApproved && (
                              <button
                                onClick={() => handleRejectItem(item._id, item.title)}
                                disabled={actionLoading === `reject-${item._id}`}
                                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === `reject-${item._id}` ? (
                                  "Rejecting..."
                                ) : (
                                  "Reject"
                                )}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteItem(item._id, item.title)}
                              disabled={actionLoading === `delete-${item._id}`}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === `delete-${item._id}` ? (
                                "Deleting..."
                              ) : (
                                "Delete"
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
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum 
                            ? "bg-blue-600 text-white" 
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Item Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">Total Items</div>
            <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Pending Approval</div>
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter(i => !i.isApproved).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(i => i.isApproved && !i.isFlagged).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Flagged/Rejected</div>
            <div className="text-2xl font-bold text-red-600">
              {items.filter(i => i.isFlagged).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemManagement;