// frontend/src/pages/admin/OrdersPage.jsx
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import apiService from '../../services/api';

const OrdersPage = () => {
  const { admin } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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
            {status ? 'No orders match your filters' : 'No orders found'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                    <div style={{ color: '#1f2937', fontWeight: '500' }}>
                      {selectedOrder.status}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Payment Status</div>
                    <div style={{ color: '#1f2937', fontWeight: '500' }}>
                      {selectedOrder.paymentStatus || 'Pending'}
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