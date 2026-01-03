import { useState, useEffect } from "react";
import API from "../../services/api";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user accounts, view status, and block/unblock users
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
              placeholder="Search users by name or email..."
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
            <option value="">All Users</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Users ({totalUsers} total)</h3>
          </div>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
        
        <div className="p-5">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-gray-700 font-medium text-lg mb-2">No Users Found</h3>
              <p className="text-gray-500">
                {search ? "Try a different search term" : "No users registered yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Joined</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {user._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {user.isBlocked ? (
                              <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                Blocked
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                Active
                              </span>
                            )}
                            {user.role === "admin" && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            {user.isBlocked ? (
                              <button
                                onClick={() => handleUnblockUser(user._id, user.name)}
                                disabled={unblockingUserId === user._id}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {unblockingUserId === user._id ? (
                                  "Unblocking..."
                                ) : (
                                  "Unblock"
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(user._id, user.name)}
                                disabled={blockingUserId === user._id || user.role === "admin"}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={user.role === "admin" ? "Cannot block admin users" : ""}
                              >
                                {blockingUserId === user._id ? (
                                  "Blocking..."
                                ) : (
                                  "Block"
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">User Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">Total Users</div>
            <div className="text-2xl font-bold text-gray-800">{totalUsers}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Active Users</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => !u.isBlocked).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Blocked Users</div>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.isBlocked).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Admin Users</div>
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === "admin").length}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Safety Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-3 text-xl">⚠️</div>
          <div>
            <h4 className="font-semibold text-yellow-800">Important Notice</h4>
            <p className="text-yellow-700 text-sm mt-1">
              Admin users cannot be blocked from this interface for security reasons. 
              Admin accounts must be managed through direct database access or by another admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;