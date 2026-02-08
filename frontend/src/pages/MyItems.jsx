import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

// Status configuration
const STATUS_CONFIG = {
  'Available': {
    color: '#10b981',
    icon: '✅',
    label: 'Available',
    badgeColor: '#dcfce7',
    textColor: '#166534'
  },
  'Sold': {
    color: '#ef4444',
    icon: '💰',
    label: 'Sold',
    badgeColor: '#fee2e2',
    textColor: '#991b1b'
  },
  'Under Negotiation': {
    color: '#f59e0b',
    icon: '🤝',
    label: 'Under Negotiation',
    badgeColor: '#fef3c7',
    textColor: '#92400e'
  },
  'Unavailable': {
    color: '#6b7280',
    icon: '⛔',
    label: 'Unavailable',
    badgeColor: '#f3f4f6',
    textColor: '#374151'
  }
};

// Status options
const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

// Cloudinary image helper
const CloudinaryHelper = {
  // Get optimized image URL with Cloudinary transformations
  getOptimizedImage: (imageUrl, options = {}) => {
    if (!imageUrl) return null;
    
    const defaultOptions = {
      width: 400,
      height: 250,
      quality: 'auto:good',
      crop: 'fill',
      gravity: 'auto',
      format: 'auto'
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // If it's already a Cloudinary URL, add transformations
    if (imageUrl.includes('res.cloudinary.com')) {
      try {
        const urlParts = imageUrl.split('/upload/');
        if (urlParts.length === 2) {
          const transformation = `w_${opts.width},h_${opts.height},c_${opts.crop},g_${opts.gravity},q_${opts.quality},f_${opts.format}`;
          return `${urlParts[0]}/upload/${transformation}/${urlParts[1]}`;
        }
      } catch (error) {
        console.warn('Failed to parse Cloudinary URL:', error);
      }
    }
    
    // Return original URL if not Cloudinary
    return imageUrl;
  },
  
  // Generate thumbnail URL
  getThumbnail: (imageUrl) => {
    return CloudinaryHelper.getOptimizedImage(imageUrl, {
      width: 300,
      height: 200,
      crop: 'fill'
    }) || imageUrl;
  },
  
  // Check if image exists
  checkImage: async (url) => {
    if (!url) return false;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000);
    });
  }
};

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [deletingItem, setDeletingItem] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Fetch items function
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching user's items...");
      const response = await API.items.getMyItems();
      
      // Debug response structure
      console.log("API Response:", response.data);
      
      let itemsArray = [];
      
      // Extract items based on different response formats
      if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
        itemsArray = response.data.data.items;
      } else if (Array.isArray(response.data)) {
        itemsArray = response.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        itemsArray = response.data.items;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        itemsArray = response.data.data;
      } else if (typeof response.data === 'object') {
        // Try to find array in object
        const findArray = (obj) => {
          for (const key in obj) {
            if (Array.isArray(obj[key])) return obj[key];
            if (typeof obj[key] === 'object') {
              const result = findArray(obj[key]);
              if (result) return result;
            }
          }
          return [];
        };
        itemsArray = findArray(response.data);
      }
      
      console.log(`Found ${itemsArray.length} items`);
      
      // Validate and process items
      const validatedItems = itemsArray.map(item => ({
        ...item,
        price: item.price || 0,
        status: item.status || 'Available',
        category: item.category || 'Uncategorized',
        title: item.title || 'Untitled Item',
        description: item.description || 'No description available',
        imageURL: item.imageURL || item.image || null,
        _id: item._id || item.id
      }));
      
      setItems(validatedItems);
      
      // Pre-check images
      validatedItems.forEach(item => {
        if (item.imageURL) {
          const optimizedUrl = CloudinaryHelper.getThumbnail(item.imageURL);
          CloudinaryHelper.checkImage(optimizedUrl).then(exists => {
            if (!exists) {
              setImageErrors(prev => ({ ...prev, [item._id]: true }));
            }
          });
        }
      });
      
    } catch (err) {
      console.error("Error fetching items:", err);
      
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view these items.");
      } else if (err.message === 'Network Error') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.response?.data?.message || "Failed to load your items. Please try again.");
      }
      
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle status update - FIXED VERSION
  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [itemId]: true }));
      
      console.log(`Updating item ${itemId} status to: ${newStatus}`);
      
      // FIXED: Direct fetch call with correct endpoint
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }
      
      // Update local state
      setItems(prevItems => 
        prevItems.map(item => 
          item._id === itemId 
            ? { ...item, status: newStatus }
            : item
        )
      );
      
      console.log("Status updated successfully");
      alert('Status updated successfully!');
      
    } catch (err) {
      console.error("Error updating status:", err);
      
      let errorMessage = "Failed to update status";
      if (err.message.includes('Failed to update')) {
        // Try alternative endpoint
        try {
          const token = localStorage.getItem('token');
          const altResponse = await fetch(`http://localhost:4000/api/items/${itemId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
          });
          
          const altData = await altResponse.json();
          
          if (altResponse.ok) {
            // Update local state
            setItems(prevItems => 
              prevItems.map(item => 
                item._id === itemId 
                  ? { ...item, status: newStatus }
                  : item
              )
            );
            alert('Status updated successfully!');
            return;
          }
        } catch (altErr) {
          console.log("Alternative method also failed:", altErr);
        }
      }
      
      alert(errorMessage);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId, itemTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setDeletingItem(itemId);
      
      console.log(`Deleting item ${itemId}`);
      
      await API.items.delete(itemId);
      
      // Remove from local state
      setItems(prevItems => prevItems.filter(item => item._id !== itemId));
      
      console.log("Item deleted successfully");
      
    } catch (err) {
      console.error("Error deleting item:", err);
      
      let errorMessage = "Failed to delete item";
      if (err.response?.status === 404) {
        errorMessage = "Item not found";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to delete this item";
      }
      
      alert(errorMessage);
    } finally {
      setDeletingItem(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setImageErrors({});
    fetchItems();
  };

  // Handle image error
  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const avgPrice = totalItems > 0 ? totalValue / totalItems : 0;
    
    const statusCounts = items.reduce((acc, item) => {
      const status = item.status || 'Available';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const availableItems = statusCounts['Available'] || 0;
    const soldItems = statusCounts['Sold'] || 0;
    
    return {
      totalItems,
      totalValue,
      avgPrice,
      availableItems,
      soldItems,
      statusCounts
    };
  }, [items]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your items...</p>
        </div>
        
        <style jsx>{`
          .container {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 20px;
          }
          .loading-container {
            text-align: center;
            padding: 100px 20px;
          }
          .spinner {
            width: '50px';
            height: '50px';
            border: '4px solid #f3f3f3';
            borderTop: '4px solid #4361ee';
            borderRadius: '50%';
            animation: 'spin 1s linear infinite';
            margin: '0 auto 20px';
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Items</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={handleRefresh} className="btn-primary">
              Try Again
            </button>
            <Link to="/add-item" className="btn-secondary">
              Add New Item
            </Link>
          </div>
        </div>
        
        <style jsx>{`
          .container {
            max-width: 800px;
            margin: 60px auto;
            padding: 0 20px;
          }
          .error-container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          .error-message {
            color: #6c757d;
            margin-bottom: 30px;
            max-width: 500px;
            margin: 0 auto 30px;
          }
          .error-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
          }
          .btn-primary, .btn-secondary {
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            cursor: pointer;
          }
          .btn-primary {
            background: #4361ee;
            color: white;
            border: none;
          }
          .btn-primary:hover {
            background: #3a56d4;
            transform: translateY(-2px);
          }
          .btn-secondary {
            background: white;
            color: #4361ee;
            border: 2px solid #4361ee;
          }
          .btn-secondary:hover {
            background: #4361ee;
            color: white;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="title">My Items</h1>
          <p className="subtitle">Manage all your study materials in one place</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh} 
            className="refresh-btn"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link to="/add-item" className="add-btn">
            + Add New Item
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Total Items</span>
          <span className="stat-value">{stats.totalItems}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Value</span>
          <span className="stat-value">Rs. {stats.totalValue.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Available</span>
          <span className="stat-value" style={{color: '#10b981'}}>
            {stats.availableItems}
          </span>
        </div>
        {/* <div className="stat">
          <span className="stat-label">Sold</span>
          <span className="stat-value" style={{color: '#ef4444'}}>
            {stats.soldItems}
          </span>
        </div> */}
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No items listed</h3>
          <p>You haven't added any items to the marketplace yet.</p>
          <Link to="/add-item" className="empty-btn">
            Add Your First Item
          </Link>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {items.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG['Available'];
              const imageUrl = CloudinaryHelper.getThumbnail(item.imageURL);
              const hasImageError = imageErrors[item._id] || !item.imageURL;
              
              return (
                <div key={item._id} className="item-card">
                  {/* Status Badge */}
                  <div 
                    className="status-badge"
                    style={{
                      background: statusConfig.badgeColor,
                      color: statusConfig.textColor
                    }}
                  >
                    <span>{statusConfig.icon}</span>
                    <span>{item.status}</span>
                  </div>
                  
                  {/* Approval Badge */}
                  {item.isApproved && (
                    <div className="approval-badge">✅ Approved</div>
                  )}
                  
                  {/* Item Image */}
                  <div className="image-container">
                    {!hasImageError && imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="item-image"
                        onError={() => handleImageError(item._id)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span className="placeholder-icon">📚</span>
                        <span className="placeholder-text">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div className="item-details">
                    <h3 className="item-title">{item.title}</h3>
                    
                    {item.category && (
                      <span className="category-badge">{item.category}</span>
                    )}
                    
                    <p className="item-description">
                      {item.description.length > 100 
                        ? `${item.description.substring(0, 100)}...`
                        : item.description
                      }
                    </p>
                    
                    {/* Status Update Section */}
                    <div className="status-update">
                      <p className="status-label">Update Status:</p>
                      <div className="status-buttons">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusUpdate(item._id, status)}
                            disabled={updatingStatus[item._id] || item.status === status}
                            className="status-btn"
                            style={{
                              background: item.status === status ? STATUS_CONFIG[status].color : 'white',
                              color: item.status === status ? 'white' : STATUS_CONFIG[status].color,
                              borderColor: STATUS_CONFIG[status].color,
                              opacity: updatingStatus[item._id] ? 0.7 : 1
                            }}
                          >
                            {updatingStatus[item._id] && item.status === status ? (
                              <>
                                <span className="status-spinner"></span>
                                Updating...
                              </>
                            ) : (
                              <>
                                {STATUS_CONFIG[status].icon} {status}
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Price and Actions */}
                    <div className="item-footer">
                      <span className="item-price">Rs. {item.price}</span>
                      <div className="item-actions">
                        <Link to={`/item/${item._id}`} className="action-btn view-btn">
                          View
                        </Link>
                        <Link to={`/edit-item/${item._id}`} className="action-btn edit-btn">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteItem(item._id, item.title)}
                          disabled={deletingItem === item._id}
                          className="action-btn delete-btn"
                        >
                          {deletingItem === item._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Stats */}
          <div className="detailed-stats">
            <h3>Detailed Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon">📊</div>
                <div className="stat-card-content">
                  <p className="stat-card-label">Average Price</p>
                  <p className="stat-card-value">Rs. {Math.round(stats.avgPrice).toLocaleString()}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">💼</div>
                <div className="stat-card-content">
                  <p className="stat-card-label">Active Listings</p>
                  <p className="stat-card-value">{stats.availableItems}</p>
                </div>
              </div>
              {/* <div className="stat-card">
                <div className="stat-card-icon">💰</div>
                <div className="stat-card-content">
                  <p className="stat-card-label">Successful Sales</p>
                  <p className="stat-card-value">{stats.soldItems}</p>
                </div>
              </div> */}
              {/* <div className="stat-card">
                <div className="stat-card-icon">📈</div>
                <div className="stat-card-content">
                  <p className="stat-card-label">Completion Rate</p>
                  <p className="stat-card-value">
                    {stats.totalItems > 0 
                      ? `${Math.round((stats.soldItems / stats.totalItems) * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div> */}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 40px auto;
          padding: 0 20px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .title {
          font-size: 2.5rem;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #4361ee, #7209b7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .subtitle {
          color: #6c757d;
          font-size: 1.125rem;
        }
        
        .header-actions {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        
        .refresh-btn, .add-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
          text-decoration: none;
          cursor: pointer;
        }
        
        .refresh-btn {
          background: #f8fafc;
          color: #4361ee;
          border: 2px solid #e2e8f0;
          border: none;
        }
        
        .refresh-btn:hover:not(:disabled) {
          background: #e2e8f0;
          transform: translateY(-2px);
        }
        
        .refresh-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .add-btn {
          background: linear-gradient(135deg, #4361ee, #7209b7);
          color: white;
          border: none;
        }
        
        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }
        
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .stat {
          text-align: center;
          padding: 15px;
        }
        
        .stat-label {
          display: block;
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #4361ee;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.5;
        }
        
        .empty-state h3 {
          margin-bottom: 16px;
          color: #212529;
        }
        
        .empty-state p {
          color: #6c757d;
          margin-bottom: 30px;
          max-width: 400px;
          margin: 0 auto 30px;
        }
        
        .empty-btn {
          padding: 12px 32px;
          background: linear-gradient(135deg, #4361ee, #7209b7);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          display: inline-block;
          transition: all 0.2s;
        }
        
        .empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }
        
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }
        
        .item-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        
        .item-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .status-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 10;
          backdrop-filter: blur(4px);
        }
        
        .approval-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          z-index: 10;
        }
        
        .image-container {
          width: 100%;
          height: 200px;
          overflow: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        .item-card:hover .item-image {
          transform: scale(1.05);
        }
        
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .placeholder-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }
        
        .placeholder-text {
          font-size: 14px;
          opacity: 0.8;
        }
        
        .item-details {
          padding: 20px;
        }
        
        .item-title {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #212529;
          line-height: 1.4;
        }
        
        .category-badge {
          display: inline-block;
          background: #eef2ff;
          color: #4361ee;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 12px;
        }
        
        .item-description {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
          min-height: 42px;
        }
        
        .status-update {
          margin-bottom: 20px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }
        
        .status-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .status-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .status-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid;
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          min-width: 120px;
          justify-content: center;
        }
        
        .status-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .status-btn:disabled {
          cursor: not-allowed;
        }
        
        .status-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid white;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 5px;
        }
        
        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .item-price {
          font-size: 20px;
          font-weight: 700;
          color: #4361ee;
        }
        
        .item-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        
        .view-btn {
          background: white;
          color: #4361ee;
          border: 1px solid #4361ee;
        }
        
        .view-btn:hover {
          background: #4361ee;
          color: white;
        }
        
        .edit-btn {
          background: #4361ee;
          color: white;
        }
        
        .edit-btn:hover {
          background: #3a56d4;
          transform: translateY(-2px);
        }
        
        .delete-btn {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        .delete-btn:hover:not(:disabled) {
          background: #dc2626;
          color: white;
        }
        
        .delete-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .detailed-stats {
          margin-top: 40px;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .detailed-stats h3 {
          margin-bottom: 20px;
          color: #212529;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .stat-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .stat-card-icon {
          font-size: 32px;
        }
        
        .stat-card-content {
          flex: 1;
        }
        
        .stat-card-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 4px;
        }
        
        .stat-card-value {
          font-size: 20px;
          font-weight: 700;
          color: #4361ee;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 20px;
          }
          
          .header-actions {
            width: 100%;
            justify-content: center;
          }
          
          .title {
            font-size: 2rem;
          }
          
          .items-grid {
            grid-template-columns: 1fr;
          }
          
          .status-buttons {
            flex-direction: column;
          }
          
          .status-btn {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default MyItems;