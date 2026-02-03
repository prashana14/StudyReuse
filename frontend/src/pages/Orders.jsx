import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
  try {
    setLoading(true);
    setError('');
    
    console.log('🔄 Fetching user orders...');
    
    // CORRECT: The API call returns response.data directly (due to interceptor)
    const response = await apiService.orders.getMyOrders();
    
    console.log('✅ API Response:', response);
    console.log('Response data structure:', {
      success: response?.success,
      count: response?.count,
      data: response?.data
    });
    
    // IMPORTANT FIX: response is already response.data from backend
    // So we need to access response.data (which is the orders array)
    const ordersData = response?.data || [];
    console.log(`📦 Setting ${ordersData.length} orders to state`);
    
    setOrders(ordersData);
    
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    console.error('Error details:', err);
    
    setError(err?.message || 'Failed to load orders');
  } finally {
    setLoading(false);
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

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      // CORRECT: Use cancelOrder() not cancel()
      await apiService.orders.cancelOrder(orderId);
      alert('Order cancelled successfully');
      fetchUserOrders(); // Refresh orders list
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
        <p style={{ color: '#6c757d', fontSize: '16px' }}>Loading your orders...</p>
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
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #4361ee, #7209b7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '700'
        }}>
          My Orders
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1.125rem' }}>
          Track and manage your orders
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
            onClick={fetchUserOrders}
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

      {/* Debug Info (only in development) */}
      {/* {process.env.NODE_ENV === 'development' && orders.length > 0 && (
        <div style={{ 
          background: '#eef2ff', 
          padding: '12px 15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          borderLeft: '4px solid #4361ee'
        }}>
          <strong>Debug:</strong> Loaded {orders.length} orders | 
          Showing {filteredOrders.length} after filter
        </div>
      )} */}

      {/* Stats and Filters */}
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
            {orders.length}
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
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>
            {orders.filter(o => o.status?.toLowerCase() === 'delivered').length}
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
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107' }}>
            {orders.filter(o => o.status?.toLowerCase() === 'pending').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
            Pending
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
          Filter by Status
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{ 
                padding: '8px 16px',
                background: statusFilter === status ? getStatusColor(status === 'all' ? '#4361ee' : status) : '#f8f9fa',
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
              {status === 'all' ? '📦' : getStatusIcon(status)} {status === 'all' ? 'All Orders' : status}
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
            {statusFilter === 'all' ? 'No Orders Yet' : `No ${statusFilter} Orders`}
          </h3>
          <p style={{ 
            color: '#6c757d', 
            marginBottom: '30px', 
            maxWidth: '500px', 
            margin: '0 auto',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            {statusFilter === 'all' 
              ? "You haven't placed any orders yet. Start shopping to see your orders here!"
              : `You don't have any ${statusFilter.toLowerCase()} orders.`}
          </p>
          <Link 
            to="/items" 
            style={{ 
              padding: '14px 32px', 
              fontSize: '16px',
              background: 'linear-gradient(135deg, #4361ee, #7209b7)',
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
            Browse Items
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
                transition: 'all 0.3s'
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
                    <span>Payment: {order.paymentMethod || 'Cash on Delivery'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'processing') && (
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
                          {item.item?.category && (
                            <span style={{ 
                              fontSize: '12px', 
                              background: '#eef2ff',
                              color: '#4361ee',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: '500',
                              marginTop: '5px',
                              display: 'inline-block'
                            }}>
                              {item.item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
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
                    background: order.status?.toLowerCase() === 'pending' ? '#fff3cd' : '#d4edda',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: order.status?.toLowerCase() === 'pending' ? '#ffeaa7' : '#c3e6cb'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: order.status?.toLowerCase() === 'pending' ? '#856404' : '#155724',
                      fontWeight: '600',
                      marginBottom: '5px'
                    }}>
                      {order.status?.toLowerCase() === 'pending' ? '🕒 Awaiting Approval' : '✅ Order Approved'}
                    </div>
                    <div style={{ fontSize: '13px', color: order.status?.toLowerCase() === 'pending' ? '#856404' : '#155724' }}>
                      {order.status?.toLowerCase() === 'pending' 
                        ? 'This order is awaiting admin approval. You will receive a notification when approved.'
                        : 'This order has been approved and is being processed.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Order Approval Info */}
      {user?.role === 'admin' && (
        <div style={{ 
          marginTop: '40px', 
          background: '#eef2ff', 
          padding: '25px',
          borderRadius: '12px',
          border: '2px solid #4361ee'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            marginBottom: '15px', 
            color: '#212529',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>👑</span> Admin Panel - Order Approvals
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Pending Approvals</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                {orders.filter(o => o.status?.toLowerCase() === 'pending').length} orders waiting for approval
              </div>
              <Link 
                to="/admin/orders" 
                style={{ 
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: '#4361ee',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Manage Orders
              </Link>
            </div>
            <div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔔</div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Notifications</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Send notifications to users about order updates
              </div>
              <Link 
                to="/admin/notifications" 
                style={{ 
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '2px solid #4361ee',
                  color: '#4361ee',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Send Notifications
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div style={{ 
        marginTop: '40px', 
        background: '#eef2ff', 
        padding: '25px',
        borderRadius: '12px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          marginBottom: '15px', 
          color: '#212529',
          fontWeight: '600'
        }}>
          Need Help with Your Order?
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px'
        }}>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📞</div>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Contact Support</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Need assistance? Our support team is here to help.
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📝</div>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Return Policy</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              10-day return policy on all items. Contact us for returns.
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🚚</div>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Track Shipping</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Shipping updates will be sent to your email and here.
            </div>
          </div>
        </div>
      </div>

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

export default Orders;