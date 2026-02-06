// src/pages/admin/UsersPage.jsx
import { useState, useEffect } from 'react';
import apiService from '../../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, search, status]);

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch all users to get accurate counts
      const response = await apiService.admin.getAllUsers({
        page: 1,
        limit: 1000, // Get a large number to count all users
        search,
        status: '' // Get all statuses
      });
      
      let allUsers = [];
      if (Array.isArray(response)) {
        allUsers = response;
      } else if (response && typeof response === 'object') {
        allUsers = response.data?.users || 
                   response.users || 
                   response.data || 
                   [];
      }
      
      // Calculate stats from all users
      const activeUsersCount = allUsers.filter(user => 
        !user.isBlocked && (user.status !== 'blocked')
      ).length;
      
      const blockedUsersCount = allUsers.filter(user => 
        user.isBlocked || user.status === 'blocked'
      ).length;
      
      setStats({
        totalUsers: allUsers.length,
        activeUsers: activeUsersCount,
        blockedUsers: blockedUsersCount
      });
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Keep existing stats or show 0
      setStats(prev => ({ ...prev }));
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.admin.getAllUsers({
        page: currentPage,
        limit: 10,
        search,
        status
      });
      
      console.log('API Response:', response);
      
      let usersData = [];
      let pagesData = 1;
      let totalCount = 0;
      
      if (Array.isArray(response)) {
        usersData = response;
        totalCount = response.length;
      } else if (response && typeof response === 'object') {
        usersData = response.data?.users || 
                   response.users || 
                   response.data || 
                   [];
        
        pagesData = response.pagination?.totalPages || 
                   response.data?.pagination?.totalPages || 
                   1;
        
        totalCount = response.pagination?.total || 
                    response.data?.pagination?.total ||
                    response.total ||
                    usersData.length;
      }
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTotalPages(Number(pagesData) || 1);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      setUserDetails(null);
      setShowUserDetailsModal(true);
      
      // Get basic user info from the already loaded users list
      const user = users.find(u => u.id === userId || u._id === userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Try to get detailed user info from API
      let detailedUser = {};
      try {
        // Use the existing getUser method from admin API
        const response = await apiService.admin.getUser(userId);
        console.log('User details API response:', response);
        
        if (response) {
          // Handle different response structures
          detailedUser = response.data || response.user || response;
        }
      } catch (apiError) {
        console.log('Could not fetch detailed user info:', apiError);
        // Continue with basic user info
      }
      
      // Combine basic user info with detailed info
      const userDetailsData = {
        ...user,
        ...detailedUser
      };
      
      setUserDetails(userDetailsData);
      
    } catch (error) {
      console.error('Error in fetchUserDetails:', error);
      // Show basic user info if we have it
      const user = users.find(u => u.id === userId || u._id === userId);
      if (user) {
        setUserDetails(user);
      } else {
        alert('Could not load user details. Please try again.');
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!blockReason.trim()) {
      alert('Please provide a reason for blocking');
      return;
    }

    try {
      await apiService.admin.blockUser(userId, blockReason);
      // Refresh both users list and stats
      await Promise.all([fetchUsers(), fetchUserStats()]);
      setSelectedUser(null);
      setBlockReason('');
      setShowBlockModal(false);
      alert('User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await apiService.admin.unblockUser(userId);
      // Refresh both users list and stats
      await Promise.all([fetchUsers(), fetchUserStats()]);
      alert('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getUserStatus = (user) => {
    // Check both isBlocked and status fields
    if (user.isBlocked === true || user.status === 'blocked') {
      return 'blocked';
    }
    return 'active';
  };

  const styles = {
    container: {
      padding: '24px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      color: '#1f2937',
      margin: 0,
    },
    // Updated stats container
    statsContainer: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    statBadge: {
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '120px',
      justifyContent: 'center',
    },
    totalUsersStat: {
      backgroundColor: '#e0e7ff',
      color: '#3730a3',
      border: '2px solid #c7d2fe',
    },
    activeUsersStat: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '2px solid #a7f3d0',
    },
    blockedUsersStat: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '2px solid #fecaca',
    },
    filterCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
      padding: '16px',
      marginBottom: '24px',
    },
    searchContainer: {
      position: 'relative',
      flex: 1,
      marginBottom: '12px',
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '20px',
      height: '20px',
      color: '#9ca3af',
    },
    searchInput: {
      width: '100%',
      padding: '8px 8px 8px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    searchInputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
    },
    filterRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    select: {
      padding: '8px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    selectFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
    },
    filterButton: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s ease',
    },
    filterButtonHover: {
      backgroundColor: '#2563eb',
    },
    tableContainer: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
    },
    tableHeaderCell: {
      padding: '16px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: 600,
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    tableRow: {
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s ease',
    },
    tableRowHover: {
      backgroundColor: '#f9fafb',
    },
    tableCell: {
      padding: '16px',
      fontSize: '14px',
      color: '#4b5563',
    },
    statusBadge: {
      padding: '6px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 500,
    },
    statusActive: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
    },
    statusBlocked: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    actionButton: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      marginRight: '8px',
      transition: 'all 0.2s ease',
    },
    viewButton: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
    },
    viewButtonHover: {
      backgroundColor: '#2563eb',
    },
    blockButton: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
    },
    blockButtonHover: {
      backgroundColor: '#fecaca',
    },
    unblockButton: {
      backgroundColor: '#d1fae5',
      color: '#059669',
    },
    unblockButtonHover: {
      backgroundColor: '#a7f3d0',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '48px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #f3f4f6',
      borderTop: '3px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px',
      color: '#6b7280',
      fontSize: '16px',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '32px',
      gap: '8px',
    },
    pageButton: {
      padding: '8px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      color: '#374151',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    pageButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    pageButtonHover: {
      backgroundColor: '#f3f4f6',
    },
    pageInfo: {
      padding: '8px 16px',
      fontSize: '14px',
      color: '#6b7280',
    },
    errorContainer: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    retryButton: {
      padding: '4px 12px',
      backgroundColor: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    // Modal Styles
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '0',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    modalHeader: {
      padding: '24px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#1f2937',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    modalBody: {
      padding: '24px',
      overflowY: 'auto',
      flex: 1,
    },
    modalActions: {
      padding: '24px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    closeButton: {
      padding: '10px 24px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    closeButtonHover: {
      backgroundColor: '#2563eb',
    },
    // User Details Styles
    userProfileHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '24px',
      paddingBottom: '24px',
      borderBottom: '1px solid #e5e7eb',
    },
    userAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '24px',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#1f2937',
      margin: '0 0 8px 0',
    },
    userEmail: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0 0 8px 0',
    },
    userStatus: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '9999px',
      fontSize: '14px',
      fontWeight: 500,
    },
    // Info Grid
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
    },
    infoCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px',
    },
    infoLabel: {
      fontSize: '12px',
      color: '#6b7280',
      margin: '0 0 4px 0',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    infoValue: {
      fontSize: '16px',
      fontWeight: 500,
      color: '#1f2937',
      margin: 0,
    },
    // Loading State for Details
    detailsLoading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
      textAlign: 'center',
    },
    detailsEmpty: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px',
    },
  };

  // SVG Icon Components
  const SearchIcon = () => (
    <svg style={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const FilterIcon = () => (
    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );

  const ViewIcon = () => (
    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const BlockIcon = () => (
    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const UnblockIcon = () => (
    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );

  // Add CSS animation for spinner
  if (typeof document !== 'undefined') {
    const styleSheet = document.styleSheets[0];
    const keyframeExists = Array.from(styleSheet.cssRules || []).some(
      rule => rule.name === 'spin'
    );
    if (!keyframeExists) {
      styleSheet.insertRule(`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `, styleSheet.cssRules.length);
    }
  }

  // Info Card Component
  const InfoCard = ({ label, value, icon }) => (
    <div style={styles.infoCard}>
      <p style={styles.infoLabel}>
        {icon && <span style={{ marginRight: '6px' }}>{icon}</span>}
        {label}
      </p>
      <p style={styles.infoValue}>{value}</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        {/* Stats Container */}
        <div style={styles.statsContainer}>
          <div style={{ ...styles.statBadge, ...styles.totalUsersStat }}>
            <span>👥</span>
            <span>Total: {loadingStats ? '...' : stats.totalUsers}</span>
          </div>
          <div style={{ ...styles.statBadge, ...styles.activeUsersStat }}>
            <span>✅</span>
            <span>Active: {loadingStats ? '...' : stats.activeUsers}</span>
          </div>
          <div style={{ ...styles.statBadge, ...styles.blockedUsersStat }}>
            <span>🚫</span>
            <span>Blocked: {loadingStats ? '...' : stats.blockedUsers}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorContainer}>
          <span>{error}</span>
          <button 
            onClick={() => {
              fetchUsers();
              fetchUserStats();
            }}
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Card */}
      <div style={styles.filterCard}>
        <div style={styles.searchContainer}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => e.target.style = { ...styles.searchInput, ...styles.searchInputFocus }}
            onBlur={(e) => e.target.style = styles.searchInput}
            onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.filterRow}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            onFocus={(e) => e.target.style = { ...styles.select, ...styles.selectFocus }}
            onBlur={(e) => e.target.style = styles.select}
            style={styles.select}
          >
            <option value="">All Users</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          
          <button
            onClick={() => {
              fetchUsers();
              fetchUserStats();
            }}
            onMouseEnter={(e) => e.target.style = { ...styles.filterButton, ...styles.filterButtonHover }}
            onMouseLeave={(e) => e.target.style = styles.filterButton}
            style={styles.filterButton}
          >
            <FilterIcon />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={{ marginTop: '12px', color: '#6b7280' }}>Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>
            No users found
          </div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>User</th>
                <th style={styles.tableHeaderCell}>Email</th>
                <th style={styles.tableHeaderCell}>Joined</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Role</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const userStatus = getUserStatus(user);
                const isBlocked = userStatus === 'blocked';
                
                return (
                  <tr 
                    key={user.id || user._id} 
                    style={styles.tableRow}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.tableRowHover.backgroundColor}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <td style={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: isBlocked ? '#dc2626' : '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '14px',
                        }}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1f2937' }}>{user.name || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {user.id || user._id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.tableCell}>{user.email || 'N/A'}</td>
                    <td style={styles.tableCell}>{formatDate(user.createdAt)}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(isBlocked ? styles.statusBlocked : styles.statusActive)
                      }}>
                        {isBlocked ? '🚫 Blocked' : '✅ Active'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: user.role === 'admin' ? '#e0e7ff' : '#f3f4f6',
                        color: user.role === 'admin' ? '#3730a3' : '#374151',
                      }}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button 
                        style={{ ...styles.actionButton, ...styles.viewButton }}
                        onClick={() => fetchUserDetails(user.id || user._id)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.viewButtonHover.backgroundColor}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.viewButton.backgroundColor}
                        title="View User Details"
                      >
                        <ViewIcon />
                      </button>
                      {!isBlocked ? (
                        <button 
                          style={{ ...styles.actionButton, ...styles.blockButton }}
                          onClick={() => {
                            setSelectedUser(user.id || user._id);
                            setShowBlockModal(true);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.blockButtonHover.backgroundColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.blockButton.backgroundColor}
                          title="Block User"
                        >
                          <BlockIcon />
                        </button>
                      ) : (
                        <button 
                          style={{ ...styles.actionButton, ...styles.unblockButton }}
                          onClick={() => handleUnblockUser(user.id || user._id)}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.unblockButtonHover.backgroundColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.unblockButton.backgroundColor}
                          title="Unblock User"
                        >
                          <UnblockIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.pageButton,
              ...(currentPage === 1 && styles.pageButtonDisabled)
            }}
            onMouseEnter={(e) => !(currentPage === 1) && (e.currentTarget.style.backgroundColor = styles.pageButtonHover.backgroundColor)}
            onMouseLeave={(e) => !(currentPage === 1) && (e.currentTarget.style.backgroundColor = styles.pageButton.backgroundColor)}
          >
            Previous
          </button>
          
          <div style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.pageButton,
              ...(currentPage === totalPages && styles.pageButtonDisabled)
            }}
            onMouseEnter={(e) => !(currentPage === totalPages) && (e.currentTarget.style.backgroundColor = styles.pageButtonHover.backgroundColor)}
            onMouseLeave={(e) => !(currentPage === totalPages) && (e.currentTarget.style.backgroundColor = styles.pageButton.backgroundColor)}
          >
            Next
          </button>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBlockModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Block User</h3>
            </div>
            <div style={styles.modalBody}>
              <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                Please provide a reason for blocking this user.
              </p>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px',
                  marginBottom: '16px',
                }}
              />
            </div>
            <div style={styles.modalActions}>
              <button 
                style={styles.closeButton}
                onClick={() => setShowBlockModal(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.closeButtonHover.backgroundColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.closeButton.backgroundColor}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.closeButton,
                  backgroundColor: '#dc2626',
                }}
                onClick={() => handleBlockUser(selectedUser)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowUserDetailsModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <span>👤</span>
                User Details
              </h3>
            </div>
            
            <div style={styles.modalBody}>
              {loadingDetails ? (
                <div style={styles.detailsLoading}>
                  <div style={styles.spinner}></div>
                  <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading user details...</p>
                </div>
              ) : userDetails ? (
                <>
                  {/* User Profile Header */}
                  <div style={styles.userProfileHeader}>
                    <div style={{
                      ...styles.userAvatar,
                      background: getUserStatus(userDetails) === 'blocked' 
                        ? 'linear-gradient(135deg, #dc2626, #991b1b)' 
                        : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    }}>
                      {userDetails.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div style={styles.userInfo}>
                      <h2 style={styles.userName}>{userDetails.name || 'Unknown User'}</h2>
                      <p style={styles.userEmail}>{userDetails.email || 'N/A'}</p>
                      <div style={{
                        ...styles.userStatus,
                        ...(getUserStatus(userDetails) === 'blocked' ? styles.statusBlocked : styles.statusActive)
                      }}>
                        <span>{getUserStatus(userDetails) === 'blocked' ? '🚫' : '✅'}</span>
                        <span>{getUserStatus(userDetails) === 'blocked' ? 'Blocked' : 'Active'}</span>
                      </div>
                    </div>
                  </div>

                  {/* User Information */}
                  <div style={styles.detailsSection}>
                    <h3 style={styles.sectionTitle}>
                      <span>📋</span>
                      User Information
                    </h3>
                    <div style={styles.infoGrid}>
                      <InfoCard
                        label="Joined Date"
                        value={formatDateTime(userDetails.createdAt)}
                        icon="📅"
                      />
                      <InfoCard
                        label="User Role"
                        value={userDetails.role === 'admin' ? '👑 Admin' : '👤 User'}
                        icon="👥"
                      />
                      <InfoCard
                        label="Account Status"
                        value={getUserStatus(userDetails) === 'blocked' ? '🚫 Blocked' : '✅ Active'}
                        icon="📊"
                      />
                      <InfoCard
                        label="User ID"
                        value={userDetails.id || userDetails._id || 'N/A'}
                        icon="🆔"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.detailsEmpty}>
                  ❌ Could not load user details
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button 
                style={styles.closeButton}
                onClick={() => setShowUserDetailsModal(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.closeButtonHover.backgroundColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.closeButton.backgroundColor}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;