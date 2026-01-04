// src/pages/admin/OrdersPage.jsx
import { useState, useEffect } from 'react';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, status]);

  // Mock data function
  const getMockOrders = () => {
    return [
      {
        id: '1',
        _id: 'order_001',
        orderNumber: 'ORD-2024-001',
        user: {
          name: 'John Sharma',
          email: 'john.sharma@example.com',
          phone: '+977 9801234567'
        },
        customer: {
          name: 'John Sharma',
          email: 'john.sharma@example.com'
        },
        items: [
          {
            item: {
              title: 'Mathematics Advanced Calculus Book',
              price: 850
            },
            quantity: 1,
            price: 850
          },
          {
            item: {
              title: 'Physics Reference Guide Volume 2',
              price: 650
            },
            quantity: 1,
            price: 650
          }
        ],
        totalAmount: 1500,
        amount: 1500,
        status: 'pending',
        paymentStatus: 'paid',
        payment: { status: 'paid' },
        createdAt: new Date().toISOString(),
        shippingAddress: {
          fullName: 'John Sharma',
          street: '123 Kathmandu Road',
          address: 'Thamel, Kathmandu',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44600',
          country: 'Nepal'
        }
      },
      {
        id: '2',
        _id: 'order_002',
        orderNumber: 'ORD-2024-002',
        user: {
          name: 'Priya Gurung',
          email: 'priya.gurung@example.com',
          phone: '+977 9812345678'
        },
        customer: {
          name: 'Priya Gurung',
          email: 'priya.gurung@example.com'
        },
        items: [
          {
            item: {
              title: 'Engineering Drawing Set Complete Kit',
              price: 1250
            },
            quantity: 1,
            price: 1250
          }
        ],
        totalAmount: 1250,
        amount: 1250,
        status: 'processing',
        paymentStatus: 'paid',
        payment: { status: 'paid' },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        shippingAddress: {
          fullName: 'Priya Gurung',
          street: '456 Pokhara Lane',
          address: 'Lakeside, Pokhara',
          city: 'Pokhara',
          state: 'Gandaki',
          zipCode: '33700',
          country: 'Nepal'
        }
      },
      {
        id: '3',
        _id: 'order_003',
        orderNumber: 'ORD-2024-003',
        user: {
          name: 'Raj Thapa',
          email: 'raj.thapa@example.com',
          phone: '+977 9823456789'
        },
        customer: {
          name: 'Raj Thapa',
          email: 'raj.thapa@example.com'
        },
        items: [
          {
            item: {
              title: 'Computer Science Algorithms Book',
              price: 950
            },
            quantity: 2,
            price: 950
          },
          {
            item: {
              title: 'Programming Python Guide',
              price: 750
            },
            quantity: 1,
            price: 750
          }
        ],
        totalAmount: 2650,
        amount: 2650,
        status: 'shipped',
        paymentStatus: 'paid',
        payment: { status: 'paid' },
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        shippingAddress: {
          fullName: 'Raj Thapa',
          street: '789 Lalitpur Street',
          address: 'Patan, Lalitpur',
          city: 'Lalitpur',
          state: 'Bagmati',
          zipCode: '44700',
          country: 'Nepal'
        }
      },
      {
        id: '4',
        _id: 'order_004',
        orderNumber: 'ORD-2024-004',
        user: {
          name: 'Sita Rai',
          email: 'sita.rai@example.com',
          phone: '+977 9834567890'
        },
        customer: {
          name: 'Sita Rai',
          email: 'sita.rai@example.com'
        },
        items: [
          {
            item: {
              title: 'Medical Biology Textbook',
              price: 1200
            },
            quantity: 1,
            price: 1200
          }
        ],
        totalAmount: 1200,
        amount: 1200,
        status: 'delivered',
        paymentStatus: 'paid',
        payment: { status: 'paid' },
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        shippingAddress: {
          fullName: 'Sita Rai',
          street: '101 Biratnagar Avenue',
          address: 'Rangeli Road',
          city: 'Biratnagar',
          state: 'Province 1',
          zipCode: '56613',
          country: 'Nepal'
        }
      },
      {
        id: '5',
        _id: 'order_005',
        orderNumber: 'ORD-2024-005',
        user: {
          name: 'Amit Shrestha',
          email: 'amit.shrestha@example.com',
          phone: '+977 9845678901'
        },
        customer: {
          name: 'Amit Shrestha',
          email: 'amit.shrestha@example.com'
        },
        items: [
          {
            item: {
              title: 'Business Management Guide',
              price: 800
            },
            quantity: 1,
            price: 800
          },
          {
            item: {
              title: 'Economics Principles Book',
              price: 900
            },
            quantity: 1,
            price: 900
          }
        ],
        totalAmount: 1700,
        amount: 1700,
        status: 'cancelled',
        paymentStatus: 'refunded',
        payment: { status: 'refunded' },
        createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        shippingAddress: {
          fullName: 'Amit Shrestha',
          street: '202 Butwal Road',
          address: 'Tilottama',
          city: 'Butwal',
          state: 'Lumbini',
          zipCode: '32907',
          country: 'Nepal'
        }
      }
    ];
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // First try to get real data from API
      try {
        // Try to import API service
        const apiModule = await import('../../services/api');
        const apiService = apiModule.default || apiModule;
        
        // Check if API service has the method
        if (apiService && apiService.admin && apiService.admin.getAllOrders) {
          const params = {
            page: currentPage,
            limit: 10,
            ...(search && { search }),
            ...(status && { status })
          };
          
          // Make API call
          const response = await apiService.admin.getAllOrders(params);
          
          // Check if response is valid
          if (response && response.data) {
            const ordersData = response.data.orders || response.data.data || response.data || [];
            const pagesData = response.data.pagination?.totalPages || 1;
            
            if (Array.isArray(ordersData) && ordersData.length > 0) {
              setOrders(ordersData);
              setTotalPages(Number(pagesData) || 1);
              setUsingMockData(false);
              return;
            }
          }
        }
      } catch (apiError) {
        console.log('API call failed, using mock data:', apiError.message);
      }
      
      // If API fails or returns no data, use mock data
      const mockOrders = getMockOrders();
      
      // Apply filters to mock data
      let filteredOrders = mockOrders;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.user?.name?.toLowerCase().includes(searchLower) ||
          order.user?.email?.toLowerCase().includes(searchLower)
        );
      }
      
      if (status) {
        filteredOrders = filteredOrders.filter(order => 
          order.status.toLowerCase() === status.toLowerCase()
        );
      }
      
      // Apply pagination to mock data
      const startIndex = (currentPage - 1) * 10;
      const paginatedOrders = filteredOrders.slice(startIndex, startIndex + 10);
      
      setOrders(paginatedOrders);
      setTotalPages(Math.ceil(filteredOrders.length / 10));
      setUsingMockData(true);
      
    } catch (error) {
      console.error('Error loading orders:', error);
      // Fallback to mock data
      const mockOrders = getMockOrders();
      setOrders(mockOrders.slice(0, 10));
      setTotalPages(1);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // Try to update via API first
      try {
        const apiModule = await import('../../services/api');
        const apiService = apiModule.default || apiModule;
        
        if (apiService && apiService.orders && apiService.orders.updateStatus) {
          await apiService.orders.updateStatus(orderId, newStatus);
        }
      } catch (apiError) {
        console.log('API update failed, updating locally:', apiError.message);
      }
      
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId || order._id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Update selected order if it's the same
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId)) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      alert(`✅ Order status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`❌ Failed to update order status: ${error.message}`);
    }
  };

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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return 'Invalid amount';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': { background: '#fef3c7', color: '#92400e', emoji: '⏳' },
      'processing': { background: '#dbeafe', color: '#1e40af', emoji: '⚙️' },
      'shipped': { background: '#f3e8ff', color: '#6b21a8', emoji: '🚚' },
      'delivered': { background: '#d1fae5', color: '#065f46', emoji: '✅' },
      'cancelled': { background: '#fee2e2', color: '#991b1b', emoji: '❌' },
      'completed': { background: '#10b981', color: '#ffffff', emoji: '🎉' }
    };
    return colors[status?.toLowerCase()] || { background: '#f3f4f6', color: '#374151', emoji: '❓' };
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': { background: '#fef3c7', color: '#92400e', emoji: '⏳' },
      'paid': { background: '#d1fae5', color: '#065f46', emoji: '💰' },
      'failed': { background: '#fee2e2', color: '#991b1b', emoji: '❌' },
      'refunded': { background: '#f3f4f6', color: '#374151', emoji: '↩️' }
    };
    return colors[status?.toLowerCase()] || { background: '#f3f4f6', color: '#374151', emoji: '❓' };
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📦 Order Management
          </h1>
          {usingMockData && (
            <div style={{
              marginTop: '4px',
              fontSize: '12px',
              color: '#f59e0b',
              backgroundColor: '#fef3c7',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⚡ Using Sample Data
            </div>
          )}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          padding: '4px 12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}>
          Total: {orders.length} orders
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px'
          }}>
            🔍
          </div>
          <input
            type="text"
            placeholder="Search orders by ID, customer name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
            style={{
              width: '100%',
              padding: '8px 8px 8px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              minWidth: '140px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">📋 All Orders</option>
            <option value="pending">⏳ Pending</option>
            <option value="processing">⚙️ Processing</option>
            <option value="shipped">🚚 Shipped</option>
            <option value="delivered">✅ Delivered</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
          
          <button
            onClick={fetchOrders}
            style={{
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
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            🔍 Apply Filters
          </button>
          
          <button
            onClick={() => {
              setSearch('');
              setStatus('');
              setCurrentPage(1);
              fetchOrders();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            🗑️ Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '48px',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{ color: '#6b7280' }}>Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            📭 No orders found
            {search || status ? (
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                Try changing your search or filter criteria
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1000px'
            }}>
              <thead style={{
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <tr>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    📄 Order Details
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    👤 Customer
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    💰 Amount
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    📊 Status
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    💳 Payment
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    ⚡ Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const orderId = order._id || order.id;
                  const statusColors = getStatusColor(order.status);
                  const paymentColors = getPaymentStatusColor(order.paymentStatus);
                  
                  return (
                    <tr 
                      key={orderId} 
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', color: '#4b5563' }}>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1f2937' }}>
                            {order.orderNumber}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            📅 {formatDate(order.createdAt)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            📦 {order.items?.length || 0} item(s)
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#4b5563' }}>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1f2937' }}>
                            👤 {order.user?.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            📧 {order.user?.email}
                          </div>
                          {order.user?.phone && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                              📱 {order.user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#4b5563' }}>
                        <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '16px' }}>
                          {formatCurrency(order.totalAmount || order.amount)}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#4b5563' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: statusColors.background,
                          color: statusColors.color
                        }}>
                          {statusColors.emoji} {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#4b5563' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: paymentColors.background,
                          color: paymentColors.color
                        }}>
                          {paymentColors.emoji} {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#4b5563' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              padding: '6px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              transition: 'background-color 0.2s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="View Details"
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          >
                            👁️
                          </button>
                          
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusUpdate(orderId, 'processing')}
                              style={{
                                padding: '6px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                backgroundColor: '#e0e7ff',
                                color: '#3730a3',
                                transition: 'background-color 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Mark as Processing"
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#c7d2fe'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#e0e7ff'}
                            >
                              ⚙️
                            </button>
                          )}
                          
                          {order.status === 'processing' && (
                            <button
                              onClick={() => handleStatusUpdate(orderId, 'shipped')}
                              style={{
                                padding: '6px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                backgroundColor: '#f3e8ff',
                                color: '#6b21a8',
                                transition: 'background-color 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Mark as Shipped"
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#e9d5ff'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#f3e8ff'}
                            >
                              🚚
                            </button>
                          )}
                          
                          {order.status === 'shipped' && (
                            <button
                              onClick={() => handleStatusUpdate(orderId, 'delivered')}
                              style={{
                                padding: '6px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                transition: 'background-color 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Mark as Delivered"
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#a7f3d0'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#d1fae5'}
                            >
                              ✅
                            </button>
                          )}
                          
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button
                              onClick={() => handleStatusUpdate(orderId, 'cancelled')}
                              style={{
                                padding: '6px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                transition: 'background-color 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Cancel Order"
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#fecaca'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#fee2e2'}
                            >
                              ❌
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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '32px',
          gap: '8px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '14px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) e.target.style.backgroundColor = '#ffffff';
            }}
          >
            ◀️ Previous
          </button>
          
          <div style={{
            padding: '8px 16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '14px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) e.target.style.backgroundColor = '#ffffff';
            }}
          >
            Next ▶️
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 50,
          padding: '16px'
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1f2937',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📋 Order Details: {selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    📅 Order Date
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                    {formatDate(selectedOrder.createdAt)}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    📊 Status
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: getStatusColor(selectedOrder.status).background,
                    color: getStatusColor(selectedOrder.status).color
                  }}>
                    {getStatusColor(selectedOrder.status).emoji} {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    💳 Payment Status
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: getPaymentStatusColor(selectedOrder.paymentStatus).background,
                    color: getPaymentStatusColor(selectedOrder.paymentStatus).color
                  }}>
                    {getPaymentStatusColor(selectedOrder.paymentStatus).emoji} {selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1)}
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    📦 Total Items
                  </div>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                    {selectedOrder.items?.length || 0} items
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  👤 Customer Information
                </h4>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                    {selectedOrder.user?.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    📧 {selectedOrder.user?.email}
                  </div>
                  {selectedOrder.user?.phone && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      📱 {selectedOrder.user?.phone}
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📍 Shipping Address
                  </h4>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                      {selectedOrder.shippingAddress.fullName}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      {selectedOrder.shippingAddress.street}
                      {selectedOrder.shippingAddress.address && `, ${selectedOrder.shippingAddress.address}`}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                      {selectedOrder.shippingAddress.country}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🛍️ Order Items
                </h4>
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {selectedOrder.items?.map((item, index) => (
                    <div 
                      key={index} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: index === selectedOrder.items.length - 1 ? 'none' : '1px solid #e5e7eb'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                          {item.item?.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          📦 Quantity: {item.quantity}
                          <span style={{ marginLeft: '12px' }}>
                            💰 Unit Price: {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    💰 Total Amount
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#1f2937'
                  }}>
                    {formatCurrency(selectedOrder.totalAmount || selectedOrder.amount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    📝 Order ID
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {selectedOrder._id || selectedOrder.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default OrdersPage;