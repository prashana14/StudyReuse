// src/pages/admin/UsersPage.jsx
import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api'; // or apiService

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, status]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.admin.getAllUsers({
        page: currentPage,
        limit: 10,
        search,
        status
      });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!blockReason.trim()) {
      alert('Please provide a reason for blocking');
      return;
    }

    try {
      await apiService.admin.blockUser(userId, blockReason);
      fetchUsers();
      setSelectedUser(null);
      setBlockReason('');
      alert('User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await apiService.admin.unblockUser(userId);
      fetchUsers();
      alert('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <div className="text-sm text-gray-600">
          Total: {users.length} users
        </div>
      </div>

      {/* Your UI components here */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
            
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Users table will go here */}
    </div>
  );
};

export default UsersPage;