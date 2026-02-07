// src/pages/admin/ItemsPage.jsx - CLEAN VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from "../../services/api";

const AdminItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [dashboardStats, setDashboardStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch dashboard stats
      try {
        const stats = await apiService.admin.getDashboardStats();
        setDashboardStats(stats);
      } catch (statsError) {
        console.error('Could not fetch dashboard stats:', statsError.message);
      }
      
      // 2. Fetch items
      await fetchItems();
      
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      let response;
      
      if (viewMode === 'pending') {
        response = await apiService.admin.getPendingItems();
      } else {
        const params = {};
        if (viewMode !== 'all') {
          params.status = viewMode;
        }
        if (search) {
          params.search = search;
        }
        response = await apiService.admin.getItems(params);
      }
      
      if (response && response.success) {
        let itemsData = [];
        
        if (Array.isArray(response.items)) {
          itemsData = response.items;
        } else if (Array.isArray(response.data)) {
          itemsData = response.data;
        } else if (Array.isArray(response)) {
          itemsData = response;
        }
        
        setItems(itemsData);
      } else {
        console.error('Invalid response format from admin items endpoint');
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching admin items:', error);
      setError('Failed to load items. Check console for details.');
      setItems([]);
    }
  };

  // Refresh items when viewMode or search changes
  useEffect(() => {
    if (!loading) {
      fetchItems();
    }
  }, [viewMode, search]);

  // Helper functions to get item status
  const getItemApprovalStatus = (item) => {
    return item.isApproved === true || 
           item.approved === true || 
           item.status === 'approved' ||
           item.status === 'Approved' ||
           item.isActive === true ||
           item.active === true;
  };

  const getItemFlaggedStatus = (item) => {
    return item.isFlagged === true || 
           item.flagged === true || 
           item.status === 'flagged' ||
           item.status === 'Flagged';
  };

  const getItemPendingStatus = (item) => {
    const isApproved = getItemApprovalStatus(item);
    const isFlagged = getItemFlaggedStatus(item);
    const isRejected = item.status === 'rejected' || item.status === 'Rejected' || item.isRejected === true;
    
    return !isApproved && !isFlagged && !isRejected;
  };

  // Handle approval
  const handleApprove = async (itemId) => {
    try {
      await apiService.admin.approveItem(itemId);
      alert('Item approved successfully!');
      fetchItems();
    } catch (error) {
      console.error('Approval error:', error);
      alert(`Failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleReject = async (itemId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await apiService.admin.rejectItem(itemId, reason);
      alert('Item rejected!');
      fetchItems();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject item.');
    }
  };

  // Filter items based on view mode and search
  const filteredItems = Array.isArray(items) ? items.filter(item => {
    let passesViewMode = true;
    
    switch (viewMode) {
      case 'pending':
        passesViewMode = getItemPendingStatus(item);
        break;
      case 'approved':
        passesViewMode = getItemApprovalStatus(item);
        break;
      case 'flagged':
        passesViewMode = getItemFlaggedStatus(item);
        break;
      case 'all':
      default:
        passesViewMode = true;
    }
    
    if (!passesViewMode) return false;
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      (item.title?.toLowerCase() || '').includes(searchLower) ||
      (item.description?.toLowerCase() || '').includes(searchLower) ||
      (item.owner?.name?.toLowerCase() || '').includes(searchLower) ||
      (item.owner?.email?.toLowerCase() || '').includes(searchLower)
    );
  }) : [];

  // Calculate counts
  const pendingCount = items.filter(item => getItemPendingStatus(item)).length;
  const approvedCount = items.filter(item => getItemApprovalStatus(item)).length;
  const flaggedCount = items.filter(item => getItemFlaggedStatus(item)).length;
  const totalCount = items.length;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Loading items...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1>Admin - Manage Items</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchAllData}
            style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div 
          onClick={() => setViewMode('all')}
          style={{
            backgroundColor: viewMode === 'all' ? '#e3f2fd' : '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: viewMode === 'all' ? '2px solid #2196f3' : '1px solid #ddd'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>
            {totalCount}
          </div>
          <div style={{ color: '#666' }}>All Items</div>
        </div>
        
        <div 
          onClick={() => setViewMode('pending')}
          style={{
            backgroundColor: viewMode === 'pending' ? '#fff3e0' : '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: viewMode === 'pending' ? '2px solid #ff9800' : '1px solid #ddd'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
            {pendingCount}
          </div>
          <div style={{ color: '#666' }}>Pending Approval</div>
        </div>
        
        <div 
          onClick={() => setViewMode('approved')}
          style={{
            backgroundColor: viewMode === 'approved' ? '#e8f5e9' : '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: viewMode === 'approved' ? '2px solid #4caf50' : '1px solid #ddd'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
            {approvedCount}
          </div>
          <div style={{ color: '#666' }}>Approved</div>
        </div>
        
        <div 
          onClick={() => setViewMode('flagged')}
          style={{
            backgroundColor: viewMode === 'flagged' ? '#ffebee' : '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: viewMode === 'flagged' ? '2px solid #f44336' : '1px solid #ddd'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
            {flaggedCount}
          </div>
          <div style={{ color: '#666' }}>Flagged</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search items by title, description, or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        />
        
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Items ({totalCount})</option>
          <option value="pending">Pending Approval ({pendingCount})</option>
          <option value="approved">Approved ({approvedCount})</option>
          <option value="flagged">Flagged ({flaggedCount})</option>
        </select>
      </div>

      {/* Items Count */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        color: '#666'
      }}>
        Showing {filteredItems.length} {viewMode} items
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffcdd2'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f5f5f5',
          borderRadius: '10px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>
            {viewMode === 'pending' ? '⏳' : 
             viewMode === 'approved' ? '✅' : 
             viewMode === 'flagged' ? '🚩' : '📦'}
          </div>
          <h3>No {viewMode} items found</h3>
          <p>
            {viewMode === 'pending' ? 
              'No pending items in the system.' :
              viewMode === 'approved' ? 'No approved items' :
              viewMode === 'flagged' ? 'No flagged items' :
              'No items in the system'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredItems.map(item => {
            const isApproved = getItemApprovalStatus(item);
            const isFlagged = getItemFlaggedStatus(item);
            const isPending = getItemPendingStatus(item);
            
            return (
              <div
                key={item._id || item.id}
                style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* Item Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{item.title || 'Untitled Item'}</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        Rs. {item.price || 0}
                      </span>
                      <span style={{ 
                        backgroundColor: '#e3f2fd', 
                        color: '#1565c0',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}>
                        {item.category || 'Uncategorized'}
                      </span>
                      <span style={{ 
                        backgroundColor: isApproved ? '#e8f5e9' : '#fff3e0',
                        color: isApproved ? '#2e7d32' : '#f57c00',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}>
                        {isApproved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                      {isFlagged && (
                        <span style={{ 
                          backgroundColor: '#ffe6e6',
                          color: '#d32f2f',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '12px'
                        }}>
                          🚩 Flagged
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Quantity: <strong>{item.quantity || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p style={{ 
                    color: '#666', 
                    margin: '10px 0',
                    fontSize: '14px'
                  }}>
                    {item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...` 
                      : item.description}
                  </p>
                )}

                {/* Owner Info */}
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '15px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>Owner:</strong> {item.owner?.name || 'Unknown User'}
                    </div>
                    <div>
                      <strong>Listed:</strong> {item.createdAt 
                        ? new Date(item.createdAt).toLocaleDateString() 
                        : 'Unknown date'}
                    </div>
                  </div>
                  {item.owner?.email && (
                    <div style={{ marginTop: '5px', color: '#666' }}>
                      {item.owner.email}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => navigate(`/item/${item._id || item.id}`)}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    View
                  </button>
                  
                  {/* Show Approve button if pending */}
                  {isPending && (
                    <button
                      onClick={() => handleApprove(item._id || item.id)}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Approve
                    </button>
                  )}
                  
                  {/* Show Reject button if not approved */}
                  {!isApproved && (
                    <button
                      onClick={() => handleReject(item._id || item.id)}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Reject
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this item?')) {
                        apiService.admin.deleteItem(item._id || item.id, 'Admin deletion')
                          .then(() => {
                            alert('Item deleted!');
                            fetchItems();
                          })
                          .catch(err => alert('Failed to delete item.'));
                      }
                    }}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Delete
                  </button>
                </div>

                {/* Status Info */}
                <div style={{ 
                  marginTop: '10px',
                  padding: '5px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '3px',
                  fontSize: '11px',
                  color: '#666',
                  borderTop: '1px solid #eee'
                }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span><strong>ID:</strong> {(item._id || item.id || '').substring(0, 8)}...</span>
                    <span><strong>Status:</strong> {item.status || 'none'}</span>
                    <span><strong>Approved:</strong> {String(item.isApproved)}</span>
                    <span><strong>Flagged:</strong> {String(item.isFlagged)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminItemsPage;