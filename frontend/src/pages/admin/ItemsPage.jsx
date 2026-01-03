// src/pages/admin/ItemsPage.jsx
import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import apiService from "../../services/api";

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchItems();
  }, [currentPage, search, status]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiService.admin.getAllItems({
        page: currentPage,
        limit: 10,
        search,
        status
      });
      setItems(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveItem = async (itemId) => {
    try {
      await apiService.admin.approveItem(itemId);
      fetchItems();
      alert('Item approved successfully');
    } catch (error) {
      console.error('Error approving item:', error);
      alert('Failed to approve item');
    }
  };

  const handleRejectItem = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await apiService.admin.rejectItem(selectedItem._id, rejectReason);
      fetchItems();
      setSelectedItem(null);
      setRejectReason('');
      alert('Item rejected successfully');
    } catch (error) {
      console.error('Error rejecting item:', error);
      alert('Failed to reject item');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteReason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }

    try {
      await apiService.admin.deleteItem(selectedItem._id, deleteReason);
      fetchItems();
      setSelectedItem(null);
      setDeleteReason('');
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  // ... rest of your code remains the same
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (item) => {
    if (item.isFlagged) return { text: 'Flagged', color: 'bg-red-100 text-red-800' };
    if (!item.isApproved) return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Approved', color: 'bg-green-100 text-green-800' };
  };

  const getConditionColor = (condition) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'like new': 'bg-green-100 text-green-800',
      'good': 'bg-emerald-100 text-emerald-800',
      'fair': 'bg-yellow-100 text-yellow-800',
      'poor': 'bg-red-100 text-red-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Item Management</h1>
        <div className="text-sm text-gray-600">
          Total: {items.length} items
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Items</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
            </select>
            
            <button
              onClick={fetchItems}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const statusBadge = getStatusBadge(item);
            
            return (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Item Image */}
                <div className="h-48 bg-gray-100 relative">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                      {statusBadge.text}
                    </span>
                  </div>
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(item.condition)}`}>
                      {item.condition}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Owner: {item.owner?.name || 'Unknown'}</p>
                    <p>Category: {item.category}</p>
                    <p>Created: {formatDate(item.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {!item.isApproved && !item.isFlagged && (
                        <button
                          onClick={() => handleApproveItem(item._id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Approve Item"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      
                      {!item.isFlagged && (
                        <button
                          onClick={() => setSelectedItem({...item, action: 'reject'})}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Reject Item"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setSelectedItem({...item, action: 'delete'})}
                      className="text-gray-600 hover:text-red-600 p-1"
                      title="Delete Item"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center px-4 py-2">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject/Delete Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            {selectedItem.action === 'reject' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Item</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Reject item: <strong>{selectedItem.title}</strong>
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectItem}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject Item
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Item</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Permanently delete item: <strong>{selectedItem.title}</strong>
                  </p>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Enter reason for deletion..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setDeleteReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Item
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;