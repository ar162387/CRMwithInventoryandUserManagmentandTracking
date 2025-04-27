import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import { useAuth } from '../../contexts/AuthContext';

const ManageInventory = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredItems(items);
      } else {
        // First try local filtering for immediate response
        const localResults = items.filter(item =>
          item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.itemId.toString().includes(searchQuery)
        );

        setFilteredItems(localResults);

        // Then do server-side search if query is longer than 2 characters
        if (searchQuery.length > 2) {
          searchItems();
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, items]);

  // Reset to first page when filtered items change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredItems]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/items');
      setItems(response.data);
      setFilteredItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load items. Please try again later.');
      setLoading(false);
    }
  };

  const searchItems = async () => {
    try {
      const response = await api.get(`/items/search?query=${encodeURIComponent(searchQuery)}`);
      setFilteredItems(response.data);
      setError('');
    } catch (error) {
      console.error('Error searching items:', error);
      // Don't show error to user, just keep using local results
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.delete(`/items/${itemId}`);
      setItems(items.filter(item => item.itemId !== itemId));
      setFilteredItems(filteredItems.filter(item => item.itemId !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleItemAdded = (newItem) => {
    setItems([newItem, ...items]);
    setFilteredItems([newItem, ...filteredItems]);
  };

  const handleItemUpdated = (updatedItem) => {
    setItems(items.map(item =>
      item.itemId === updatedItem.itemId ? updatedItem : item
    ));
    setFilteredItems(filteredItems.map(item =>
      item.itemId === updatedItem.itemId ? updatedItem : item
    ));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Pagination functions
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${currentPage === 1
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          First
        </button>

        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${currentPage === 1
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`px-3 py-1 rounded ${currentPage === number
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${currentPage === totalPages
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          Next
        </button>

        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${currentPage === totalPages
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          Last
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Inventory</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Item
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search Section */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or ID..."
          className="w-full p-2 border rounded"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Items count */}
      <div className="mb-4 text-gray-600">
        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b text-left">Sr. No.</th>
              <th className="px-6 py-3 border-b text-left">Item ID</th>
              <th className="px-6 py-3 border-b text-left">Item Name</th>
              <th className="px-6 py-3 border-b text-left">Shop</th>
              <th className="px-6 py-3 border-b text-left">Cold Storage</th>
              <th className="px-6 py-3 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{indexOfFirstItem + index + 1}</td>
                <td className="px-6 py-4 border-b">{item.itemId}</td>
                <td className="px-6 py-4 border-b">{item.itemName}</td>
                <td className="px-6 py-4 border-b">
                  <div>Qty: {item.shopQuantity || ''}</div>
                  <div>Net: {item.shopNetWeight || ''}</div>
                  <div>Gross: {item.shopGrossWeight || ''}</div>
                </td>
                <td className="px-6 py-4 border-b">
                  <div>Qty: {item.coldQuantity || ''}</div>
                  <div>Net: {item.coldNetWeight || ''}</div>
                  <div>Gross: {item.coldGrossWeight || ''}</div>
                </td>
                <td className="px-6 py-4 border-b">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.itemId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {renderPaginationControls()}

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={handleItemAdded}
      />

      {selectedItem && (
        <EditItemModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </div>
  );
};

export default ManageInventory; 