// src/pages/admin/ItemsPage.jsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from "../../services/api";

const AdminItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Fetching items...');
      
      // Get items from API
      const response = await apiService.items.getAll();
      
      console.log('✅ API Response:', response);
      
      // Extract items from response based on your API structure
      let itemsArray = [];
      
      if (response && response.success) {
        if (Array.isArray(response.data)) {
          itemsArray = response.data;
        } else if (response.data && Array.isArray(response.data.items)) {
          itemsArray = response.data.items;
        } else if (response.data && response.data.data) {
          itemsArray = response.data.data;
        } else {
          // Try to find any array in the response
          Object.values(response).forEach(value => {
            if (Array.isArray(value)) {
              itemsArray = value;
            }
          });
        }
      } else if (Array.isArray(response)) {
        // If response is already an array
        itemsArray = response;
      }
      
      console.log(`📊 Found ${itemsArray.length} items`);
      setItems(itemsArray);
      
    } catch (error) {
      console.error('❌ Error fetching items:', error);
      setError('Failed to load items. Please check your connection.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId) => {
    try {
      await apiService.admin.approveItem(itemId);
      alert('Item approved!');
      fetchItems();
    } catch (error) {
      alert('Failed to approve item.');
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
      alert('Failed to reject item.');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    
    try {
      await apiService.admin.deleteItem(itemId, 'Admin deletion');
      alert('Item deleted!');
      fetchItems();
    } catch (error) {
      alert('Failed to delete item.');
    }
  };

  // Filter items based on search
  const filteredItems = Array.isArray(items) ? items.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (item.title?.toLowerCase() || '').includes(searchLower) ||
      (item.description?.toLowerCase() || '').includes(searchLower) ||
      (item.owner?.name?.toLowerCase() || '').includes(searchLower) ||
      (item.owner?.email?.toLowerCase() || '').includes(searchLower)
    );
  }) : [];

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
        <button 
          onClick={fetchItems}
          style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Items Count */}
      <div style={{ marginBottom: '20px', color: '#666' }}>
        Showing {filteredItems.length} items
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f5f5f5',
          borderRadius: '10px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
          <h3>No items found</h3>
          <p>{items.length === 0 ? 'No items in the system' : 'Search returned no results'}</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredItems.map(item => (
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
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                      backgroundColor: item.isApproved ? '#e8f5e9' : '#fff3e0',
                      color: item.isApproved ? '#2e7d32' : '#f57c00',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '12px'
                    }}>
                      {item.isApproved ? '✅ Approved' : '⏳ Pending'}
                    </span>
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
                
                {!item.isApproved && !item.isFlagged && (
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
                
                {!item.isApproved && (
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
                  onClick={() => handleDelete(item._id || item.id)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminItemsPage;