import { useState, useEffect } from "react";
import API from "../../services/api";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers || 0, 
      color: "bg-blue-500",
      borderColor: "border-l-blue-500",
      textColor: "text-blue-600",
      icon: "👥",
      description: "Registered users"
    },
    { 
      title: "Blocked Users", 
      value: stats?.blockedUsers || 0, 
      color: "bg-red-500",
      borderColor: "border-l-red-500",
      textColor: "text-red-600",
      icon: "🚫",
      description: "Currently blocked"
    },
    { 
      title: "Total Items", 
      value: stats?.totalItems || 0,  
      color: "bg-purple-500",
      borderColor: "border-l-purple-500",
      textColor: "text-purple-600",
      icon: "📦",
      description: "All items posted"
    },
    { 
      title: "Pending Items", 
      value: stats?.pendingItems || 0,  
      color: "bg-yellow-500",
      borderColor: "border-l-yellow-500",
      textColor: "text-yellow-600",
      icon: "⏳",
      description: "Awaiting approval"
    },
    { 
      title: "Flagged Items", 
      value: stats?.flaggedItems || 0, 
      color: "bg-pink-500",
      borderColor: "border-l-pink-500",
      textColor: "text-pink-600",
      icon: "🚩",
      description: "Reported items"
    },
  ];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your platform statistics and recent activity
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-xl shadow-sm border-l-4 ${card.borderColor} p-5`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">{card.title}</div>
                <div className={`text-3xl font-bold ${card.textColor}`}>{card.value}</div>
                <p className="text-xs text-gray-400 mt-2">{card.description}</p>
              </div>
              <div className={`${card.color} text-white w-12 h-12 rounded-full flex items-center justify-center text-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Recent Users</h3>
            <a 
              href="/admin/users" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </a>
          </div>
          <div className="p-5">
            {recentUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-gray-700 font-medium">No Users</h3>
                <p className="text-gray-500 text-sm mt-1">No users registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          {user.isBlocked ? (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                              Blocked
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Recent Items</h3>
            <a 
              href="/admin/items" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </a>
          </div>
          <div className="p-5">
            {recentItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-gray-700 font-medium">No Items</h3>
                <p className="text-gray-500 text-sm mt-1">No items posted yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Item</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Owner</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentItems.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800 mb-1">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            ₹{item.price} • {item.category}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {item.owner?.name || "Unknown"}
                        </td>
                        <td className="py-3 px-4">
                          {!item.isApproved ? (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                              Pending
                            </span>
                          ) : item.isFlagged ? (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                              Flagged
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-5">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <p className="text-sm opacity-90 mb-4">Manage your platform quickly</p>
          <div className="space-y-2">
            <a 
              href="/admin/items?status=pending" 
              className="block bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Review Pending Items
            </a>
            <a 
              href="/admin/users?status=blocked" 
              className="block bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg text-sm transition-colors"
            >
              View Blocked Users
            </a>
            <a 
              href="/admin/notifications" 
              className="block bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Send Notification
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Admin Count</span>
              <span className="font-medium">{stats?.totalAdmins || 0} / 2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Status</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                Operational
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-gray-500 text-sm">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;