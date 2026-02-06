// frontend/src/pages/admin/OrdersPage.jsx
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import apiService from '../../services/api';

const OrdersPage = () => {
  const { admin } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');

useEffect(() => {
    console.log('=== ORDERS PAGE DEBUG ===');
    console.log('Admin:', admin);
    console.log('Admin Token:', localStorage.getItem('adminToken'));
    console.log('API Service:', apiService);
    console.log('Admin API:', apiService.admin);
  }, [admin]);
  // Fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      // Prepare query parameters
      const params = {
        page: currentPage,
        limit: 10,
        ...(search && { search }),
        ...(status && { status })
      };

      // Try the admin API endpoint first
      let response;
      try {
        response = await apiService.admin.getAllOrders(params);
      } catch (adminApiError) {
        console.log('Admin orders endpoint failed, trying regular orders endpoint:', adminApiError.message);
        // Fallback to regular orders endpoint with admin middleware
        response = await apiService.orders.getAll(params);
      }

      if (response.success) {
        // Handle different response structures
        const ordersData = response.data || response.orders || [];
        const pagesData = response.pagination?.totalPages || response.totalPages || 1;

        setOrders(ordersData);
        setTotalPages(Number(pagesData));
      } else {
        setError(response.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error loading orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders on page load or filter change
  useEffect(() => {
    fetchOrders();
  }, [currentPage, status]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        setCurrentPage(1);
        fetchOrders();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await apiService.orders.updateStatus(orderId, newStatus);
      
      if (response.success) {
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Update selected order if open
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        
        alert('Order status updated successfully');
      } else {
        alert(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await apiService.orders.cancelOrder(orderId);
      
      if (response.success) {
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: 'Cancelled' } : order
          )
        );
        
        alert('Order cancelled successfully');
      } else {
        alert(response.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  // Format date
  const formatDate = (dateString) => {
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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Pending': { bg: '#fef3c7', text: '#92400e', emoji: '⏳' },
      'Processing': { bg: '#dbeafe', text: '#1e40af', emoji: '⚙️' },
      'Shipped': { bg: '#f3e8ff', text: '#6b21a8', emoji: '🚚' },
      'Delivered': { bg: '#d1fae5', text: '#065f46', emoji: '✅' },
      'Cancelled': { bg: '#fee2e2', text: '#991b1b', emoji: '❌' }
    };
    return colors[status] || { bg: '#f3f4f6', text: '#374151', emoji: '❓' };
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    const colors = {
      'Pending': { bg: '#fef3c7', text: '#92400e', emoji: '⏳' },
      'Paid': { bg: '#d1fae5', text: '#065f46', emoji: '💰' },
      'Failed': { bg: '#fee2e2', text: '#991b1b', emoji: '❌' },
      'Refunded': { bg: '#f3f4f6', text: '#374151', emoji: '↩️' }
    };
    return colors[status] || { bg: '#f3f4f6', text: '#374151', emoji: '❓' };
  };

  // If not admin, show access denied
  if (!admin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Admin privileges required to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
          📦 Order Management
        </h1>
        <p style={{ color: '#6b7280', marginTop: '4px' }}>
          Manage and track all customer orders
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚠️ {error}
          <button
            onClick={() => setError('')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search orders by ID, customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }}>
              🔍
            </span>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            onClick={fetchOrders}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            {search || status ? 'No orders match your filters' : 'No orders found'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Order ID
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Customer
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Date
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Amount
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Status
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Payment
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusColor = getStatusColor(order.status);
                  const paymentColor = getPaymentStatusColor(order.paymentStatus || 'Pending');
                  
                  return (
                    <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', color: '#4b5563' }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {order._id?.slice(-8) || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#4b5563' }}>
                        {order.user?.name || 'N/A'}
                        {order.user?.email && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {order.user.email}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: '#4b5563' }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td style={{ padding: '16px', color: '#4b5563', fontWeight: '500' }}>
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {statusColor.emoji} {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: paymentColor.bg,
                          color: paymentColor.text,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {paymentColor.emoji} {order.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            View
                          </button>
                          
                          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'Processing')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#e0e7ff',
                                color: '#3730a3',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Process
                            </button>
                          )}
                          
                          {order.status === 'Processing' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'Shipped')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#f3e8ff',
                                color: '#6b21a8',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Ship
                            </button>
                          )}
                          
                          {order.status === 'Shipped' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'Delivered')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Deliver
                            </button>
                          )}
                          
                          {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                            <button
                              onClick={() => cancelOrder(order._id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              borderRadius: '8px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{ padding: '8px 16px', color: '#6b7280' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
              borderRadius: '8px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>
                Order Details
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Order Summary */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Order Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Order ID</div>
                    <div style={{ color: '#1f2937' }}>{selectedOrder._id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Date</div>
                    <div style={{ color: '#1f2937' }}>{formatDate(selectedOrder.createdAt)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Status</div>
                    <div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: getStatusColor(selectedOrder.status).bg,
                        color: getStatusColor(selectedOrder.status).text
                      }}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
                    <div style={{ color: '#1f2937', fontWeight: '500' }}>
                      {formatCurrency(selectedOrder.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Customer Information</h4>
                <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}
                  </div>
                  {selectedOrder.user?.phone && (
                    <div>
                      <strong>Phone:</strong> {selectedOrder.user.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Shipping Address</h4>
                  <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                    <div>{selectedOrder.shippingAddress.fullName}</div>
                    <div>{selectedOrder.shippingAddress.street}</div>
                    <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</div>
                    <div>{selectedOrder.shippingAddress.country}</div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Order Items</h4>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      borderBottom: index === selectedOrder.items.length - 1 ? 'none' : '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {item.item?.title || item.itemSnapshot?.title || 'Unknown Item'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Quantity: {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div style={{ fontWeight: '500' }}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: '500'
              }}>
                <div>Total Amount</div>
                <div>{formatCurrency(selectedOrder.totalAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;