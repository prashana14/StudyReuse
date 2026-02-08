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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [ordersResponse, statsResponse] = await Promise.all([
        apiService.orders.getSellerOrders(),
        apiService.orders.getSellerOrderStats()
      ]);
      
      if (ordersResponse.success) {
        setOrders(ordersResponse.data || []);
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
    } catch (err) {
      console.error('Error fetching seller data:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        return 'Today, ' + date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffHours < 48) {
        return 'Yesterday, ' + date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pending': { color: '#f59e0b', icon: '⏳', label: 'Pending' },
      'processing': { color: '#3b82f6', icon: '⚙️', label: 'Processing' },
      'shipped': { color: '#8b5cf6', icon: '🚚', label: 'Shipped' },
      'delivered': { color: '#10b981', icon: '✅', label: 'Delivered' },
      'cancelled': { color: '#ef4444', icon: '❌', label: 'Cancelled' }
    };
    return configs[status?.toLowerCase()] || { color: '#6b7280', icon: '📦', label: status || 'Unknown' };
  };

  const getSellerActionConfig = (action) => {
    const configs = {
      'pending': { color: '#f59e0b', icon: '⏳', label: 'Pending' },
      'accepted': { color: '#10b981', icon: '✅', label: 'Accepted' },
      'rejected': { color: '#ef4444', icon: '❌', label: 'Rejected' }
    };
    return configs[action?.toLowerCase()] || { color: '#6b7280', icon: '📦', label: action || 'Unknown' };
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_action') {
      return order.sellerAction === 'pending' && order.status === 'Pending';
    }
    return order.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleAcceptOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to accept this order?')) return;
    
    try {
      await apiService.orders.acceptOrderBySeller(orderId);
      alert('Order accepted successfully');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('Please provide a reason for rejecting this order:');
    if (!reason?.trim()) return alert('Please provide a reason for rejection');
    
    try {
      await apiService.orders.rejectOrderBySeller(orderId, reason);
      alert('Order rejected successfully');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await apiService.orders.cancelOrder(orderId);
      alert('Order cancelled successfully');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading && !refreshing) {
    return (
      <div style={{ maxWidth: '1200px', margin: '80px auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '5px' }}>
              📦 Seller Orders
            </h1>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>Manage orders for your listed items</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '10px 15px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: refreshing ? 0.7 : 1
              }}
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            
            <Link
              to="/orders"
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
            >
              👤 My Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button 
            onClick={handleRefresh}
            style={{ 
              padding: '6px 12px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px', color: '#d1d5db' }}>📦</div>
          <h3 style={{ marginBottom: '10px', color: '#374151', fontSize: '20px' }}>No Orders Found</h3>
          <p style={{ color: '#6b7280', marginBottom: '25px', maxWidth: '500px', margin: '0 auto', fontSize: '15px', lineHeight: '1.6' }}>
            You don't have any orders at the moment.
          </p>
          <Link 
            to="/my-items" 
            style={{ 
              padding: '12px 25px', 
              fontSize: '15px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Manage My Items
          </Link>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const actionConfig = getSellerActionConfig(order.sellerAction);
            const orderNumber = order._id?.substring(order._id.length - 6).toUpperCase();
            
            return (
              <div key={order._id} style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', background: order.sellerAction === 'pending' ? '#fffbeb' : 'white' }}>
                {/* Order Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Order #{orderNumber}</span>
                      <span style={{ background: statusConfig.color, color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                      <span style={{ background: actionConfig.color, color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {actionConfig.icon} {actionConfig.label}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <span>Placed: {formatDate(order.createdAt)}</span>
                      <span>Items: {order.items?.length || 0}</span>
                      <span>Total: {formatCurrency(order.totalAmount)}</span>
                      <span>Customer: {order.user?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {order.sellerAction === 'pending' && order.status === 'Pending' && (
                      <>
                        <button onClick={() => handleAcceptOrder(order._id)} style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                          Accept
                        </button>
                        <button onClick={() => handleRejectOrder(order._id)} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                          Reject
                        </button>
                      </>
                    )}
                    
                    {(order.status === 'processing' || order.status === 'pending') && order.sellerAction === 'accepted' && (
                      <button onClick={() => handleCancelOrder(order._id)} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    )}
                    
                    <button onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)} style={{ padding: '8px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                      {selectedOrder?._id === order._id ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {/* Order Details */}
                {selectedOrder?._id === order._id && (
                  <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#374151', fontWeight: '600' }}>Items ({order.items?.length || 0})</h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {order.items?.map((item, index) => (
                          <div key={item._id || index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {item.itemSnapshot?.imageURL ? (
                                <img src={item.itemSnapshot.imageURL} alt={item.itemSnapshot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ color: '#9ca3af', fontSize: '18px' }}>📦</div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>{item.itemSnapshot?.title || 'Item'}</div>
                              <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.quantity || 1} × {formatCurrency(item.price)} = {formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#374151', fontWeight: '600' }}>Customer</h4>
                      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ marginBottom: '8px' }}><strong>Name:</strong> {order.user?.name || 'N/A'}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {order.user?.email || 'N/A'}</div>
                        {order.shippingAddress?.phone && <div><strong>Phone:</strong> {order.shippingAddress.phone}</div>}
                      </div>
                    </div>

                    {order.shippingAddress && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#374151', fontWeight: '600' }}>Shipping Address</h4>
                        <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                          <div style={{ marginBottom: '5px' }}><strong>{order.shippingAddress.fullName || 'N/A'}</strong></div>
                          <div style={{ marginBottom: '5px' }}>{order.shippingAddress.street || ''}</div>
                          <div>{order.shippingAddress.city || ''}, {order.shippingAddress.state || ''}</div>
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #e5e7eb' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>Total:</span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;