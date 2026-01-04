// src/pages/admin/ItemsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from "../../services/api";

const AdminItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    isApproved: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, [filters.page, filters.status, filters.isApproved, filters.search]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params for admin endpoint
      const params = {
        page: filters.page,
        limit: filters.limit
      };
      
      // Add status filter if not 'all'
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      
      // Add approval filter if not 'all'
      if (filters.isApproved !== 'all') {
        if (filters.isApproved === 'approved') {
          params.isApproved = true;
        } else if (filters.isApproved === 'pending') {
          params.isApproved = false;
        } else if (filters.isApproved === 'rejected') {
          params.isFlagged = true;
        }
      }
      
      // Add search filter
      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }
      
      console.log('Fetching admin items with params:', params);
      
      // ✅ USE THE CORRECT FUNCTION: apiService.admin.getItems
      const data = await apiService.admin.getItems(params);
      console.log('Admin items response:', data);
      
      // Handle different response structures
      let itemsList = [];
      let paginationData = {
        totalPages: 1,
        currentPage: 1,
        total: 0
      };
      
      if (data) {
        if (Array.isArray(data)) {
          // If response is directly an array
          itemsList = data;
          paginationData.total = data.length;
        } else if (data.items) {
          // If response has items property
          itemsList = data.items;
          if (data.pagination) {
            paginationData = data.pagination;
          } else {
            paginationData.total = data.total || data.items.length || 0;
            paginationData.totalPages = data.totalPages || 1;
            paginationData.currentPage = data.currentPage || filters.page;
          }
        } else if (data.data && Array.isArray(data.data)) {
          // If response has data property
          itemsList = data.data;
          paginationData.total = data.total || data.data.length || 0;
        }
      }
      
      setItems(itemsList);
      setPagination(paginationData);
      
      if (itemsList.length === 0) {
        console.log('No items returned. Possible issues:');
        console.log('1. API endpoint might be incorrect');
        console.log('2. Admin token might be missing or invalid');
        console.log('3. Backend might not have the admin items endpoint');
        console.log('4. Filters might be too restrictive');
      }
      
    } catch (error) {
      console.error('Error fetching items:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.status
      });
      
      // Try to get more specific error message
      let errorMessage = 'Failed to load items. Please check your connection.';
      if (error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check if the server is running.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await apiService.admin.updateItemStatus(itemId, { status: newStatus });
      // Refresh items list
      fetchItems();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update item status. Please try again.');
    }
  };

  const handleApprove = async (itemId) => {
    try {
      await apiService.admin.approveItem(itemId);
      alert('Item approved successfully!');
      fetchItems();
    } catch (error) {
      console.error('Error approving item:', error);
      alert('Failed to approve item. Please try again.');
    }
  };

  const handleReject = async (itemId) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required.');
      return;
    }
    
    try {
      await apiService.admin.rejectItem(itemId, reason.trim());
      alert('Item rejected successfully!');
      fetchItems();
    } catch (error) {
      console.error('Error rejecting item:', error);
      alert('Failed to reject item. Please try again.');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    const reason = prompt('Please enter reason for deletion (optional):');
    
    try {
      await apiService.admin.deleteItem(itemId, reason || 'No reason provided');
      alert('Item deleted successfully!');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleRefresh = () => {
    fetchItems();
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      isApproved: 'all',
      search: '',
      page: 1,
      limit: 20
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '9999px',
          height: '3rem',
          width: '3rem',
          borderBottom: '2px solid #2563eb',
          borderLeft: '2px solid #2563eb',
          borderRight: '2px solid #2563eb',
          borderTop: '2px solid transparent'
        }}></div>
        <p style={{
          marginTop: '1rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          Loading items from admin API...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            <span style={{ marginRight: '0.5rem' }}>📦</span>
            Admin - Manage Items
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0.25rem 0 0 0'
          }}>
            Total Items: {pagination.total} | Page {pagination.currentPage} of {pagination.totalPages}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              console.log('Current API service:', apiService);
              console.log('Admin methods available:', Object.keys(apiService.admin));
              console.log('Current filters:', filters);
            }}
            style={{
              padding: '0.5rem',
              backgroundColor: '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            title="Debug Info"
          >
            🐛 Debug
          </button>
          
          <button
            onClick={handleRefresh}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <span>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.375rem'
            }}>
              <span style={{ marginRight: '0.25rem' }}>📊</span>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">📦 All Status</option>
              <option value="Available">✅ Available</option>
              <option value="Sold">💰 Sold</option>
              <option value="Reserved">⏳ Reserved</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.375rem'
            }}>
              <span style={{ marginRight: '0.25rem' }}>✅</span>
              Approval Status
            </label>
            <select
              value={filters.isApproved}
              onChange={(e) => setFilters(prev => ({ ...prev, isApproved: e.target.value, page: 1 }))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">📋 All Items</option>
              <option value="approved">✅ Approved Only</option>
              <option value="pending">⏳ Pending Approval</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.375rem'
            }}>
              <span style={{ marginRight: '0.25rem' }}>🔍</span>
              Search Items
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && setFilters(prev => ({ ...prev, page: 1 }))}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                🔍 Search
              </button>
            </div>
          </div>
        </div>

        {/* Filter Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={handleResetFilters}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span>🔄</span>
            Reset Filters
          </button>
          
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📊</span>
            Showing {items.length} of {pagination.total} items
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <div style={{ flexShrink: 0, fontSize: '1.25rem' }}>⚠️</div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>
              Error Loading Items
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>
              {error}
            </p>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  console.log('Debugging API issue...');
                  console.log('API Base URL:', apiService.config.baseURL);
                  console.log('Admin Token exists:', !!apiService.config.getToken(true));
                  console.log('Available admin methods:', Object.keys(apiService.admin));
                  fetchItems();
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Retry with Debug
              </button>
              <button
                onClick={() => setError(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>
          <p style={{
            color: '#6b7280',
            fontSize: '1.125rem',
            margin: '1rem 0 0.5rem 0'
          }}>
            {filters.status !== 'all' || filters.isApproved !== 'all' || filters.search
              ? 'No items found with current filters'
              : 'No items in the system yet'}
          </p>
          <p style={{
            color: '#9ca3af',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            {filters.status !== 'all' || filters.isApproved !== 'all' || filters.search
              ? 'Try adjusting your filters or search terms.'
              : 'Items will appear here once users start listing.'}
          </p>
          <button
            onClick={handleResetFilters}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginRight: '0.5rem'
            }}
          >
            Reset All Filters
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {items.map(item => (
              <div
                key={item._id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Item Image and Basic Info */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                    }}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      margin: '0 0 0.375rem 0',
                      color: '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ 
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.title}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#10b981'
                      }}>
                        ₹{item.price}
                      </span>
                    </h3>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0 0 0.5rem 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.description}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: apiService.helpers.getCategoryColor(item.category).bg,
                        color: apiService.helpers.getCategoryColor(item.category).text,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {apiService.helpers.getCategoryIcon(item.category)}
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: apiService.helpers.getStatusColor(item.status).split(' ')[0],
                    color: apiService.helpers.getStatusColor(item.status).split(' ')[1]
                  }}>
                    {apiService.helpers.getStatusEmoji(item.status)}
                    {item.status}
                  </span>
                  
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: item.isApproved ? '#d1fae5' : 
                                    item.isFlagged ? '#fee2e2' : '#fef3c7',
                    color: item.isApproved ? '#065f46' :
                          item.isFlagged ? '#991b1b' : '#92400e'
                  }}>
                    {item.isApproved ? '✅ Approved' :
                     item.isFlagged ? '🚩 Flagged' : '⏳ Pending'}
                  </span>
                </div>

                {/* Owner Information */}
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <p style={{
                        margin: '0 0 0.25rem 0',
                        color: '#374151',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span>👤</span>
                        Owner
                      </p>
                      <p style={{
                        margin: 0,
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {item.owner?.name || 'Unknown User'}
                        <span style={{ color: '#9ca3af' }}>•</span>
                        {item.owner?.email || 'No email'}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        margin: '0 0 0.25rem 0',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'flex-end'
                      }}>
                        <span>📅</span>
                        Listed
                      </p>
                      <p style={{
                        margin: 0,
                        color: '#6b7280',
                        fontSize: '0.7rem'
                      }}>
                        {apiService.helpers.timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem'
                }}>
                  {/* View Details */}
                  <button
                    onClick={() => navigate(`/admin/items/${item._id}`)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      fontWeight: 500
                    }}
                    title="View details"
                  >
                    <span>👁️</span>
                  </button>
                  
                  {/* Status Change */}
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                  
                  {/* Approve/Reject */}
                  {!item.isApproved ? (
                    <button
                      onClick={() => handleApprove(item._id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        fontWeight: 500
                      }}
                      title="Approve item"
                    >
                      <span>✅</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReject(item._id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        fontWeight: 500
                      }}
                      title="Reject item"
                    >
                      <span>❌</span>
                    </button>
                  )}
                  
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item._id)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      fontWeight: 500
                    }}
                    title="Delete item"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.currentPage === 1 ? '#f3f4f6' : '#3b82f6',
                  color: pagination.currentPage === 1 ? '#9ca3af' : '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  opacity: pagination.currentPage === 1 ? 0.5 : 1
                }}
              >
                <span>⬅️</span>
                Previous
              </button>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: pagination.currentPage === pageNum ? '#3b82f6' : '#ffffff',
                        color: pagination.currentPage === pageNum ? '#ffffff' : '#374151',
                        border: `1px solid ${pagination.currentPage === pageNum ? '#3b82f6' : '#d1d5db'}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: pagination.currentPage === pageNum ? 600 : 400
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                  <>
                    <span style={{ color: '#9ca3af' }}>...</span>
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.currentPage === pagination.totalPages ? '#f3f4f6' : '#3b82f6',
                  color: pagination.currentPage === pagination.totalPages ? '#9ca3af' : '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1
                }}
              >
                Next
                <span>➡️</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminItemsPage;