// src/pages/admin/AnalyticsPage.jsx
import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CubeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  // Mock data - Replace with actual API data
  const userGrowthData = [
    { month: 'Jan', users: 65 },
    { month: 'Feb', users: 78 },
    { month: 'Mar', users: 90 },
    { month: 'Apr', users: 120 },
    { month: 'May', users: 150 },
    { month: 'Jun', users: 180 },
  ];

  const itemCategoryData = [
    { name: 'Electronics', value: 35 },
    { name: 'Books', value: 25 },
    { name: 'Clothing', value: 20 },
    { name: 'Furniture', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const monthlyStats = [
    { month: 'January', revenue: 4000, users: 40, items: 60 },
    { month: 'February', revenue: 3000, users: 30, items: 45 },
    { month: 'March', revenue: 5000, users: 50, items: 75 },
    { month: 'April', revenue: 4500, users: 45, items: 65 },
    { month: 'May', revenue: 6000, users: 60, items: 90 },
    { month: 'June', revenue: 5500, users: 55, items: 80 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const statsCards = [
    {
      title: 'Total Revenue',
      value: '₹24,500',
      change: '+12.5%',
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+8.2%',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Items Listed',
      value: '456',
      change: '+15.3%',
      icon: CubeIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Avg. Rating',
      value: '4.7',
      change: '+0.2',
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">↑ {stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Item Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Item Categories Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={itemCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {itemCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                <Bar dataKey="users" fill="#3b82f6" name="New Users" />
                <Bar dataKey="items" fill="#8b5cf6" name="Items Listed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Peak Activity</h4>
            <p className="text-sm text-blue-600">
              Most user activity occurs between 6 PM - 9 PM. Consider scheduling promotions during this time.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Popular Categories</h4>
            <p className="text-sm text-green-600">
              Electronics and Books are the most popular categories. Consider featuring these items.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">User Engagement</h4>
            <p className="text-sm text-purple-600">
              User retention rate increased by 15% this month. Current rate is 78%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;