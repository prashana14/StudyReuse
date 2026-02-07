// frontend/src/pages/SellerOrders.jsx - SELLER VERSION ONLY
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

const SellerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchSellerOrders();
    fetchSellerStats();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Fetching seller orders...');
      
      // This should only get orders where user is the SELLER
      const response = await apiService.orders.getSellerOrders();
      
      console.log('✅ Seller Orders Response:', response);
      
      const ordersData = response?.data || [];
      console.log(`📦 Setting ${ordersData.length} seller orders to state`);
      
      setOrders(ordersData);
      
    } catch (err) {
      console.error('❌ Error fetching seller orders:', err);
      setError(err?.message || 'Failed to load seller orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerStats = async () => {
    try {
      const response = await apiService.orders.getSellerOrderStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching seller stats:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '#ffc107';
      case 'processing': return '#0d6efd';
      case 'shipped': return '#17a2b8';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSellerActionColor = (action) => {
    switch(action?.toLowerCase()) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  };

  const getSellerActionIcon = (action) => {
    switch(action?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      default: return '📦';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_action') {
      return order.sellerAction === 'pending' && order.status === 'Pending';
    }
    return order.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleAcceptOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to accept this order?')) {
      return;
    }

    try {
      await apiService.orders.acceptOrderBySeller(orderId);
      alert('Order accepted successfully');
      fetchSellerOrders();
      fetchSellerStats();
    } catch (err) {
      console.error('Error accepting order:', err);
      alert(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('Please provide a reason for rejecting this order:');
    if (reason === null) return;
    
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await apiService.orders.rejectOrderBySeller(orderId, reason);
      alert('Order rejected successfully');
      fetchSellerOrders();
      fetchSellerStats();
    } catch (err) {
      console.error('Error rejecting order:', err);
      alert(err.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await apiService.orders.cancelOrder(orderId);
      alert('Order cancelled successfully');
      fetchSellerOrders();
      fetchSellerStats();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleViewDetails = (order, e) => {
    e.stopPropagation();
    setSelectedOrder(selectedOrder?._id === order._id ? null : order);
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '80px auto', 
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4361ee',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ color: '#6c757d', fontSize: '16px' }}>
          Loading seller orders...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            background: 'linear-gradient(135deg, #7209b7, #4361ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '700'
          }}>
            Seller Orders
          </h1>
          
          <Link
            to="/orders"
            style={{
              padding: '10px 20px',
              background: '#4361ee',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            👤 View My Orders
          </Link>
        </div>
        <p style={{ color: '#6c757d', fontSize: '1.125rem' }}>
          Manage orders for your items
        </p>
      </div>

      {error && (
        <div style={{ 
          background: '#fff5f5', 
          border: '1px solid #ffcccc',
          color: '#d32f2f',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button 
            onClick={fetchSellerOrders}
            style={{ 
              padding: '5px 15px',
              background: '#4361ee',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#4361ee' }}>
            {stats?.totalOrders || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
            Total Orders
          </div>
        </div>

        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107' }}>
            {stats?.pendingOrders || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
            Pending Action
          </div>
        </div>

        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>
            {stats?.deliveredOrders || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
            Delivered
          </div>
        </div>

        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#7209b7' }}>
            ₹{stats?.totalRevenue?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
            Total Revenue
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ 
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        marginBottom: '30px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          marginBottom: '15px', 
          color: '#212529',
          fontWeight: '600'
        }}>
          Filter Orders
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['all', 'pending_action', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{ 
                padding: '8px 16px',
                background: statusFilter === status ? getStatusColor(status === 'pending_action' ? '#ffc107' : status) : '#f8f9fa',
                border: 'none',
                borderRadius: '20px',
                color: statusFilter === status ? 'white' : '#495057',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {status === 'all' ? '📦' : ''}
              {status === 'pending_action' ? '⏳' : ''}
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            fontSize: '80px', 
            marginBottom: '20px', 
            color: '#4361ee',
            opacity: 0.7
          }}>
            📦
          </div>
          <h3 style={{ 
            marginBottom: '16px', 
            color: '#212529',
            fontSize: '24px'
          }}>
            No Seller Orders Found
          </h3>
          <p style={{ 
            color: '#6c757d', 
            marginBottom: '30px', 
            maxWidth: '500px', 
            margin: '0 auto',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            You don't have any orders for your items yet. When customers purchase your items, orders will appear here.
          </p>
          <Link 
            to="/my-items" 
            style={{ 
              padding: '14px 32px', 
              fontSize: '16px',
              background: 'linear-gradient(135deg, #7209b7, #4361ee)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.3s',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(67, 97, 238, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Manage My Items
          </Link>
        </div>
      ) : (
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {filteredOrders.map((order) => (
            <div 
              key={order._id} 
              style={{ 
                padding: '25px',
                borderBottom: '1px solid #f8f9fa',
                transition: 'all 0.3s',
                background: order.sellerAction === 'pending' ? '#fff9e6' : 'white'
              }}
            >
              {/* Order Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: selectedOrder?._id === order._id ? '20px' : '0'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                    <span style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#212529' 
                    }}>
                      Order #{order._id?.substring(order._id.length - 6).toUpperCase()}
                    </span>
                    <span style={{ 
                      background: getStatusColor(order.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    
                    {/* Seller Action Badge */}
                    <span style={{ 
                      background: getSellerActionColor(order.sellerAction),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {getSellerActionIcon(order.sellerAction)} Action: {order.sellerAction}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6c757d',
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <span>Placed: {formatDate(order.createdAt)}</span>
                    <span>Items: {order.items?.length || 0}</span>
                    <span>Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                    <span>Customer: {order.user?.name || 'Unknown'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Seller Actions */}
                  {order.sellerAction === 'pending' && order.status === 'Pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptOrder(order._id);
                        }}
                        style={{ 
                          padding: '8px 16px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectOrder(order._id);
                        }}
                        style={{ 
                          padding: '8px 16px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Reject Order
                      </button>
                    </>
                  )}
                  
                  {/* Cancel Button for seller (if they have permission) */}
                  {(order.status?.toLowerCase() === 'processing' || order.status?.toLowerCase() === 'pending') && order.sellerAction === 'accepted' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelOrder(order._id);
                      }}
                      style={{ 
                        padding: '8px 16px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => handleViewDetails(order, e)}
                    style={{ 
                      padding: '8px 16px',
                      background: '#4361ee',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {selectedOrder?._id === order._id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>

              {/* Order Items (Expanded View) */}
              {selectedOrder?._id === order._id && (
                <div style={{ 
                  marginTop: '20px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    marginBottom: '15px', 
                    color: '#212529',
                    fontWeight: '600'
                  }}>
                    Order Items ({order.items?.length || 0})
                  </h4>
                  
                  <div style={{ marginBottom: '20px' }}>
                    {order.items?.map((item, index) => (
                      <div 
                        key={item._id || index} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '15px',
                          padding: '15px 0',
                          borderBottom: '1px solid #e0e0e0',
                          ...(index === (order.items?.length || 0) - 1 && { borderBottom: 'none' })
                        }}
                      >
                        <div style={{ 
                          width: '60px', 
                          height: '60px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid #dee2e6'
                        }}>
                          {item.itemSnapshot?.imageURL ? (
                            <img 
                              src={item.itemSnapshot.imageURL} 
                              alt={item.itemSnapshot.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div style="color: #adb5bd; font-size: 20px">📦</div>';
                              }}
                            />
                          ) : (
                            <div style={{ color: '#adb5bd', fontSize: '20px' }}>📦</div>
                          )}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#212529',
                            marginBottom: '5px'
                          }}>
                            {item.itemSnapshot?.title || item.item?.title || 'Item not found'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6c757d' }}>
                            Qty: {item.quantity || 1} × ₹{item.price?.toFixed(2) || '0.00'} = ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </div>
                          {item.itemStatus && (
                            <span style={{ 
                              fontSize: '12px', 
                              background: getSellerActionColor(item.itemStatus),
                              color: 'white',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: '500',
                              marginTop: '5px',
                              display: 'inline-block'
                            }}>
                              Item Status: {item.itemStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Info */}
                  <div style={{ 
                    marginTop: '20px',
                    padding: '20px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      marginBottom: '15px', 
                      color: '#212529',
                      fontWeight: '600'
                    }}>
                      Customer Information
                    </h4>
                    <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.6' }}>
                      <div><strong>Name:</strong> {order.user?.name || 'N/A'}</div>
                      <div><strong>Email:</strong> {order.user?.email || 'N/A'}</div>
                      <div><strong>Shipping Address:</strong> {order.shippingAddress?.fullName}, {order.shippingAddress?.street}, {order.shippingAddress?.city}</div>
                      <div><strong>Phone:</strong> {order.shippingAddress?.phone || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div style={{ 
                      marginTop: '20px',
                      padding: '20px',
                      background: '#eef2ff',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        marginBottom: '15px', 
                        color: '#212529',
                        fontWeight: '600'
                      }}>
                        Shipping Address
                      </h4>
                      <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.6' }}>
                        <div><strong>{order.shippingAddress.fullName || 'N/A'}</strong></div>
                        <div>{order.shippingAddress.street || ''}</div>
                        <div>{order.shippingAddress.city || ''}, {order.shippingAddress.state || ''} - {order.shippingAddress.zipCode || ''}</div>
                        <div>{order.shippingAddress.country || 'Nepal'}</div>
                        <div>Phone: {order.shippingAddress.phone || 'N/A'}</div>
                        {order.shippingAddress.notes && (
                          <div style={{ marginTop: '10px', fontStyle: 'italic' }}>
                            <strong>Notes:</strong> {order.shippingAddress.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div style={{ 
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{ width: '300px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '8px'
                      }}>
                        <span style={{ color: '#6c757d', fontSize: '14px' }}>Subtotal:</span>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          ₹{order.totalAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '8px'
                      }}>
                        <span style={{ color: '#6c757d', fontSize: '14px' }}>Shipping:</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#28a745' }}>
                          Free
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: '15px',
                        paddingTop: '15px',
                        borderTop: '2px solid #dee2e6'
                      }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#212529' }}>
                          Total:
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#4361ee' }}>
                          ₹{order.totalAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status & Approval Info */}
                  <div style={{ 
                    marginTop: '20px',
                    padding: '15px',
                    background: order.sellerAction === 'pending' ? '#fff3cd' : '#d4edda',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: order.sellerAction === 'pending' ? '#ffeaa7' : '#c3e6cb'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: order.sellerAction === 'pending' ? '#856404' : '#155724',
                      fontWeight: '600',
                      marginBottom: '5px'
                    }}>
                      {order.sellerAction === 'pending' 
                        ? '⏳ Awaiting Your Action' 
                        : '✅ Order Processed'}
                    </div>
                    <div style={{ fontSize: '13px', color: order.sellerAction === 'pending' ? '#856404' : '#155724' }}>
                      {order.sellerAction === 'pending' 
                        ? 'This order is waiting for your approval. Please accept or reject it.'
                        : 'You have already taken action on this order.'}
                    </div>
                    {order.sellerRejectionReason && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#dc3545',
                        marginTop: '10px',
                        padding: '10px',
                        background: '#fff5f5',
                        borderRadius: '4px',
                        borderLeft: '4px solid #dc3545'
                      }}>
                        <strong>Your Rejection Reason:</strong> {order.sellerRejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .order-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 15px !important;
          }
          
          .order-actions {
            align-self: flex-start !important;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          
          .status-filter {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SellerOrders;