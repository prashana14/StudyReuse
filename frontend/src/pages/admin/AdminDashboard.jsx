import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [timeRange, setTimeRange] = useState('today');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [statsRes, usersRes, itemsRes, activitiesRes] = await Promise.all([
        API.get(`/admin/dashboard/stats?range=${timeRange}`),
        API.get("/admin/users?limit=6"),
        API.get("/admin/items?limit=6"),
        API.get("/admin/activities?limit=10")
      ]);
      
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users || []);
      setRecentItems(itemsRes.data.items || []);
      setRecentActivities(activitiesRes.data.activities || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching the latest data</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers || 0, 
      change: stats?.userGrowth || 0,
      color: "from-blue-500 to-blue-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-4.201V21M3 13.5V21m6-7.5V21m6-7.5V21"/>
        </svg>
      ),
      link: "/admin/users"
    },
    { 
      title: "Active Items", 
      value: stats?.activeItems || 0,  
      change: stats?.itemGrowth || 0,
      color: "from-purple-500 to-purple-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ),
      link: "/admin/items"
    },
    { 
      title: "Pending Approvals", 
      value: stats?.pendingItems || 0,  
      change: 0,
      color: "from-yellow-500 to-yellow-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      link: "/admin/items?status=pending"
    },
    { 
      title: "Revenue Today", 
      value: `₹${stats?.revenueToday || 0}`, 
      change: stats?.revenueGrowth || 0,
      color: "from-green-500 to-green-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      link: "/admin/orders"
    },
    { 
      title: "Flagged Content", 
      value: stats?.flaggedItems || 0, 
      change: 0,
      color: "from-red-500 to-red-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
        </svg>
      ),
      link: "/admin/items?status=flagged"
    },
    { 
      title: "Satisfaction", 
      value: `${stats?.satisfaction || 95}%`, 
      change: 2.5,
      color: "from-pink-500 to-pink-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
        </svg>
      ),
      link: "/admin/reviews"
    },
  ];

  const quickActions = [
    { 
      title: "Approve Items", 
      description: "Review pending listings",
      icon: "✓",
      color: "bg-blue-100 text-blue-600",
      hoverColor: "bg-blue-600 text-white",
      link: "/admin/items?status=pending"
    },
    { 
      title: "Manage Users", 
      description: "View and manage users",
      icon: "👥",
      color: "bg-purple-100 text-purple-600",
      hoverColor: "bg-purple-600 text-white",
      link: "/admin/users"
    },
    { 
      title: "Send Notification", 
      description: "Broadcast message",
      icon: "📢",
      color: "bg-green-100 text-green-600",
      hoverColor: "bg-green-600 text-white",
      link: "/admin/notifications"
    },
    { 
      title: "System Settings", 
      description: "Configure platform",
      icon: "⚙️",
      color: "bg-gray-100 text-gray-600",
      hoverColor: "bg-gray-600 text-white",
      link: "/admin/settings"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804l-1.121-1.121a3 3 0 00-3.732 4.154l2.758 2.758A8.963 8.963 0 015.121 17.804zM15 10a3 3 0 11-6 0 3 3 0 016 0zm4 11a9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9 9 9 0 01-9 9z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getGreeting()}, Admin!</h1>
                <p className="text-gray-600">Here's what's happening with your platform today.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
              {['today', 'week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timeRange === range 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
        {statCards.map((card, index) => (
          <div 
            key={index}
            onClick={() => navigate(card.link)}
            className="group relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                 style={{ background: `linear-gradient(135deg, ${card.color.split(' ')[1]}, ${card.color.split(' ')[3]})` }}>
            </div>
            
            <div className="p-5 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center text-white`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change >= 0 ? '↗' : '↘'} {Math.abs(card.change)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">vs last period</div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className="text-sm text-gray-600 font-medium">{card.title}</div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  View details
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Users */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recent Users</h3>
                  <p className="text-sm text-gray-600 mt-1">Newly registered users on your platform</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                >
                  View All
                </button>
              </div>
            </div>
            
            <div className="p-2">
              {recentUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-4.201V21M3 13.5V21m6-7.5V21m6-7.5V21"/>
                    </svg>
                  </div>
                  <h3 className="text-gray-700 font-medium">No Users Yet</h3>
                  <p className="text-gray-500 text-sm mt-1">Users will appear here once they register</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentUsers.map((user) => (
                    <div 
                      key={user._id}
                      onClick={() => navigate(`/admin/users/${user._id}`)}
                      className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          {!user.isBlocked && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">Joined</div>
                        </div>
                        
                        {user.isBlocked ? (
                          <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.link)}
                className="group w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center text-xl group-hover:${action.hoverColor} transition-colors duration-300`}>
                    {action.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">{action.title}</div>
                    <div className="text-sm text-white/70">{action.description}</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-white/60 group-hover:text-white transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between text-white/80">
              <div>
                <div className="text-sm">System Status</div>
                <div className="font-bold text-xl">All Systems Operational</div>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Items</h3>
                <p className="text-sm text-gray-600 mt-1">Latest items posted by users</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                {stats?.totalItems || 0} Total
              </span>
            </div>
          </div>
          
          <div className="p-2">
            {recentItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <h3 className="text-gray-700 font-medium">No Items Posted</h3>
                <p className="text-gray-500 text-sm mt-1">Items will appear here once users post them</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentItems.map((item) => (
                  <div 
                    key={item._id}
                    onClick={() => navigate(`/admin/items/${item._id}`)}
                    className="p-4 hover:bg-blue-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {item.images && item.images[0] ? (
                          <img 
                            src={item.images[0]} 
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-900">₹{item.price}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-600">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {!item.isApproved ? (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                              Pending
                            </span>
                          ) : item.isFlagged ? (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                              Flagged
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                              Active
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            by {item.owner?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
                <p className="text-sm text-gray-600 mt-1">Latest system activities and events</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All Activities →
              </button>
            </div>
          </div>
          
          <div className="p-2">
            {recentActivities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-gray-700 font-medium">No Recent Activities</h3>
                <p className="text-gray-500 text-sm mt-1">Activities will appear here as they happen</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="relative pl-16 pr-4">
                      {/* Timeline dot */}
                      <div className="absolute left-7 top-2 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                      
                      <div className="bg-gray-50 hover:bg-blue-50 rounded-xl p-4 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              {activity.type === 'user' ? '👤' : 
                               activity.type === 'item' ? '📦' : 
                               activity.type === 'order' ? '💰' : '⚡'}
                            </div>
                            <span className="font-medium text-gray-900">{activity.title}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          {activity.action && (
                            <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                              {activity.action}
                            </button>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Last updated:</span> {new Date().toLocaleString()}
            <span className="mx-2">•</span>
            <span>Data refreshes automatically every 30 seconds</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">System Online</span>
            </div>
            <div className="text-sm text-gray-500">
              Admin Dashboard v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;