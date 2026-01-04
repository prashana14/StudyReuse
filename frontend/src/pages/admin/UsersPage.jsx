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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, status]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Call the API
      const response = await apiService.admin.getAllUsers({
        page: currentPage,
        limit: 10,
        search,
        status
      });
      
      // Log response to debug structure
      console.log('API Response:', response);
      
      // Handle different possible response structures
      let usersData = [];
      let pagesData = 1;
      
      if (Array.isArray(response)) {
        // Response is directly an array
        usersData = response;
      } else if (response && typeof response === 'object') {
        // Response is an object with different possible structures
        usersData = response.data?.users || 
                   response.users || 
                   response.data || 
                   [];
        
        pagesData = response.pagination?.totalPages || 
                   response.data?.pagination?.totalPages || 
                   1;
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
      fetchUsers();
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
    totalUsers: {
      fontSize: '14px',
      color: '#6b7280',
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
      padding: '4px 12px',
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
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
    blockButton: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
    },
    unblockButton: {
      backgroundColor: '#d1fae5',
      color: '#059669',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '48px',
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      width: '90%',
      maxWidth: '400px',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#1f2937',
      marginBottom: '16px',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '100px',
      marginBottom: '16px',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    cancelButton: {
      padding: '8px 16px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
    },
    confirmButton: {
      padding: '8px 16px',
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        <div style={styles.totalUsers}>
          Total: {users.length} users
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorContainer}>
          <span>{error}</span>
          <button 
            onClick={fetchUsers}
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
            onClick={fetchUsers}
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
              {users.map((user) => (
                <tr 
                  key={user.id || user._id} 
                  style={styles.tableRow}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <td style={styles.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
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
                      ...(user.status === 'active' || !user.status ? styles.statusActive : styles.statusBlocked)
                    }}>
                      {user.status || 'active'}
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
                      onClick={() => console.log('View user:', user.id)}
                      title="View Details"
                    >
                      <ViewIcon />
                    </button>
                    {(user.status === 'active' || !user.status) ? (
                      <button 
                        style={{ ...styles.actionButton, ...styles.blockButton }}
                        onClick={() => {
                          setSelectedUser(user.id || user._id);
                          setShowBlockModal(true);
                        }}
                        title="Block User"
                      >
                        <BlockIcon />
                      </button>
                    ) : (
                      <button 
                        style={{ ...styles.actionButton, ...styles.unblockButton }}
                        onClick={() => handleUnblockUser(user.id || user._id)}
                        title="Unblock User"
                      >
                        <UnblockIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
            <h3 style={styles.modalTitle}>Block User</h3>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              Please provide a reason for blocking this user.
            </p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Enter reason for blocking..."
              style={styles.textarea}
            />
            <div style={styles.modalActions}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowBlockModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmButton}
                onClick={() => handleBlockUser(selectedUser)}
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;