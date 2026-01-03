// src/pages/admin/AdminDashboardPage.jsx
import { useEffect, useState } from 'react';
import { UsersIcon, CubeIcon, UserGroupIcon, CheckCircleIcon, FlagIcon, ShoppingCartIcon, ChartBarIcon } from '@heroicons/react/24/outline';
// CHANGE THIS:
// import { getDashboardStats } from "../../../services/adminService";
// TO THIS:
import apiService from "../../services/api"; // or apiService

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // USE apiService INSTEAD:
      const data = await apiService.admin.getDashboardStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: `${stats?.userGrowth || 0}%`,
    },
    {
      title: 'Total Items',
      value: stats?.totalItems || 0,
      icon: CubeIcon,
      color: 'bg-green-500',
      change: `${stats?.itemGrowth || 0}%`,
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Items',
      value: stats?.pendingItems || 0,
      icon: FlagIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Approved Items',
      value: stats?.verifiedItems || 0,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
    },
    {
      title: 'Blocked Users',
      value: stats?.blockedUsers || 0,
      icon: UserGroupIcon,
      color: 'bg-red-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                {stat.change && (
                  <p className="text-sm text-green-600 mt-1">↑ {stat.change}</p>
                )}
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
              Review Pending Items
            </button>
            <button className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg transition-colors">
              View Flagged Content
            </button>
            <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors">
              Send Notification
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">New user registered</p>
                <p className="text-sm text-gray-600">5 minutes ago</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">User</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">Item approved</p>
                <p className="text-sm text-gray-600">1 hour ago</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Item</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">User blocked</p>
                <p className="text-sm text-gray-600">2 hours ago</p>
              </div>
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Action</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;