import { useState, useEffect } from 'react';
import apiService from '../../services/api';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.orders.getAll();
      const ordersData = response.data.data || [];
      setOrders(ordersData);
      
      // Calculate statistics
      calculateStats(ordersData);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const stats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'Pending').length,
      processing: ordersData.filter(o => o.status === 'Processing').length,
      delivered: ordersData.filter(o => o.status === 'Delivered').length,
      cancelled: ordersData.filter(o => o.status === 'Cancelled').length,
      revenue: ordersData.reduce((sum, order) => sum + order.totalAmount, 0)
    };
    setStats(stats);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-500';
      case 'Processing': return 'bg-blue-500';
      case 'Shipped': return 'bg-cyan-500';
      case 'Delivered': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return '⏳';
      case 'Processing': return '🔄';
      case 'Shipped': return '🚚';
      case 'Delivered': return '✅';
      case 'Cancelled': return '❌';
      default: return '📦';
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Change order status to "${newStatus}"?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await apiService.orders.updateStatus(orderId, newStatus);
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      calculateStats(updatedOrders);
      
      alert(`Order status updated to ${newStatus}`);
      
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendNotification = async (order, messageType) => {
    const messages = {
      approved: `Your order #${order._id.substring(order._id.length - 6).toUpperCase()} has been approved and is being processed.`,
      shipped: `Your order #${order._id.substring(order._id.length - 6).toUpperCase()} has been shipped. Track your delivery.`,
      delivered: `Your order #${order._id.substring(order._id.length - 6).toUpperCase()} has been delivered. Thank you for shopping with us!`,
      cancelled: `Your order #${order._id.substring(order._id.length - 6).toUpperCase()} has been cancelled. Contact support for refunds.`
    };

    const notificationData = {
      userId: order.user._id,
      title: `Order Update - ${order.status}`,
      message: messages[messageType] || `Your order status has been updated to ${order.status}`,
      type: 'order_update',
      orderId: order._id
    };

    try {
      await apiService.admin.sendNotification(notificationData);
      alert('Notification sent to user');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification');
    }
  };

  const filteredOrders = orders.filter(order => {
    // Apply status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      return (
        order._id.toLowerCase().includes(searchLower) ||
        order.user?.name?.toLowerCase().includes(searchLower) ||
        order.user?.email?.toLowerCase().includes(searchLower) ||
        order.items.some(item => 
          item.item?.title?.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Order Management
        </h1>
        <p className="text-gray-600 text-lg">
          Manage and approve customer orders
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchAllOrders}
            className="ml-3 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 text-center border-t-4 border-blue-500">
          <div className="text-2xl md:text-3xl font-bold text-blue-600">
            {stats.total}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Total Orders
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 text-center border-t-4 border-yellow-500">
          <div className="text-2xl md:text-3xl font-bold text-yellow-600">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Pending Approval
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 text-center border-t-4 border-blue-400">
          <div className="text-2xl md:text-3xl font-bold text-blue-400">
            {stats.processing}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Processing
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 text-center border-t-4 border-green-500">
          <div className="text-2xl md:text-3xl font-bold text-green-600">
            ₹{stats.revenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Total Revenue
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by Order ID, User Name, Email, or Item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-100 outline-none transition-all"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          
          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="px-5 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-blue-600 hover:border-blue-400 font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            🔄 Clear Filters
          </button>
        </div>

        {/* Status Filters */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Filter by Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  statusFilter === status 
                    ? status === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : `${getStatusColor(status)} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '📦' : getStatusIcon(status)} 
                {status === 'all' ? 'All Orders' : status}
                {status !== 'all' && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === status ? 'bg-white/30' : 'bg-gray-200'
                  }`}>
                    {status === 'Pending' ? stats.pending :
                     status === 'Processing' ? stats.processing :
                     status === 'Shipped' ? 0 : // Add shipped count if you track it
                     status === 'Delivered' ? stats.delivered :
                     status === 'Cancelled' ? stats.cancelled : 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-blue-500 opacity-70">
              📦
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {searchTerm || statusFilter !== 'all' ? 'No Matching Orders' : 'No Orders Found'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              {searchTerm 
                ? `No orders found for "${searchTerm}"`
                : statusFilter !== 'all'
                ? `No ${statusFilter} orders found`
                : 'No orders have been placed yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="py-4 px-5 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                    Order ID
                  </th>
                  <th className="py-4 px-5 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                    Customer
                  </th>
                  <th className="py-4 px-5 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                    Items
                  </th>
                  <th className="py-4 px-5 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                    Total
                  </th>
                  <th className="py-4 px-5 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-4 px-5 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                    Date
                  </th>
                  <th className="py-4 px-5 text-left font-semibold text-gray-700 text-sm whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr 
                    key={order._id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedOrder?._id === order._id ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                  >
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-800">
                        #{order._id.substring(order._id.length - 6).toUpperCase()}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {order.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-blue-600">
                        ₹{order.totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 w-fit ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          disabled={updatingStatus}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[120px]"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.status === 'Processing') {
                              handleSendNotification(order, 'approved');
                            } else if (order.status === 'Shipped') {
                              handleSendNotification(order, 'shipped');
                            } else if (order.status === 'Delivered') {
                              handleSendNotification(order, 'delivered');
                            } else if (order.status === 'Cancelled') {
                              handleSendNotification(order, 'cancelled');
                            } else {
                              handleSendNotification(order, 'update');
                            }
                          }}
                          className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors flex items-center gap-1"
                        >
                          📨 Notify
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

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => {
              const pendingOrders = orders.filter(o => o.status === 'Pending');
              if (pendingOrders.length === 0) {
                alert('No pending orders to approve');
                return;
              }
              if (window.confirm(`Approve all ${pendingOrders.length} pending orders?`)) {
                pendingOrders.forEach(async (order) => {
                  await handleUpdateStatus(order._id, 'Processing');
                  await handleSendNotification(order, 'approved');
                });
              }
            }}
            className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:-translate-y-1 hover:shadow-lg transition-all text-center"
          >
            <div className="text-4xl mb-3">✅</div>
            Approve All Pending Orders
          </button>
          
          <button 
            onClick={() => {
              // Export orders to CSV
              const csvContent = "data:text/csv;charset=utf-8," 
                + ["Order ID,Customer,Items,Total,Status,Date"].concat(
                    orders.map(order => [
                      order._id,
                      order.user?.name || 'Unknown',
                      order.items.length,
                      order.totalAmount,
                      order.status,
                      new Date(order.createdAt).toLocaleDateString()
                    ].join(','))
                  ).join("\n");
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `orders_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="p-6 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all text-center"
          >
            <div className="text-4xl mb-3">📊</div>
            Export Orders to CSV
          </button>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          table {
            display: block;
          }
          
          thead {
            display: none;
          }
          
          tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb !important;
            border-radius: 0.5rem;
          }
          
          td {
            display: block;
            text-align: right;
            padding: 0.75rem 1rem !important;
            border-bottom: 1px solid #f9fafb;
          }
          
          td:before {
            content: attr(data-label);
            float: left;
            font-weight: 600;
            color: #4b5563;
          }
          
          td:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderManagement;