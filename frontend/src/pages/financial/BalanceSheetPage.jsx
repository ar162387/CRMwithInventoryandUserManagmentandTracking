import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import balanceService from '../../services/balanceService';
import BalanceEntryModal from '../../components/financial/BalanceEntryModal';
import ConfirmationModal from '../../components/financial/ConfirmationModal';
import { formatCurrency } from '../../utils/helpers';

const BalanceSheetPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [totalBalance, setTotalBalance] = useState(0);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1
  });

  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [remarksFilter, setRemarksFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);

      // Get total balance
      const balanceData = await balanceService.getTotalBalance();
      setTotalBalance(balanceData.totalBalance);

      // Get entries with filters
      const result = await balanceService.getAllBalanceEntries(
        pagination.page,
        10,
        dateFilter || null,
        remarksFilter || null
      );

      setEntries(result.entries);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching balance data:', error);
      toast.error('Failed to load balance data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters/page change
  useEffect(() => {
    fetchData();
  }, [pagination.page, dateFilter, remarksFilter]);

  // Handle changing page
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Open add/edit modal
  const openModal = (entry = null) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  // Open delete confirmation modal
  const openDeleteModal = (entry) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEntryToDelete(null);
  };

  // Handle saving a balance entry (add or edit)
  const handleSaveEntry = async (formData) => {
    try {
      if (editingEntry && editingEntry._id) {
        // Update existing entry
        await balanceService.updateBalanceEntry(editingEntry._id, formData);
        toast.success('Balance entry updated successfully');
      } else {
        // Add new entry
        await balanceService.addBalanceEntry(formData);
        toast.success('Balance entry added successfully');
      }

      // Refresh data
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving balance entry:', error);
      toast.error(error.response?.data?.message || 'Failed to save balance entry');
    }
  };

  // Handle deleting a balance entry
  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    try {
      await balanceService.deleteBalanceEntry(entryToDelete._id);
      toast.success('Balance entry deleted successfully');

      // Refresh data
      closeDeleteModal();
      fetchData();
    } catch (error) {
      console.error('Error deleting balance entry:', error);
      toast.error(error.response?.data?.message || 'Failed to delete balance entry');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setDateFilter('');
    setRemarksFilter('');
    setPagination({
      ...pagination,
      page: 1
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Balance Sheet</h1>

      {/* Total Balance Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Balance</h2>
        <p className="text-3xl font-bold text-blue-600">
          {loading ? 'Loading...' : formatCurrency(totalBalance)}
        </p>
      </div>

      {/* Action Buttons - Only for Admin */}
      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => openModal()}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Add Funds
          </button>
          <button
            onClick={() => openModal({
              _id: null,
              amount: '',
              date: new Date().toISOString().split('T')[0],
              remarks: '',
              type: 'subtraction'
            })}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Subtract Funds
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Date Filter
            </label>
            <input
              type="date"
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="remarksFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Remarks Search
            </label>
            <input
              type="text"
              id="remarksFilter"
              placeholder="Search by remarks..."
              value={remarksFilter}
              onChange={(e) => setRemarksFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 text-center">
                    No balance entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.type === 'addition' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {entry.type === 'addition' ? 'Addition' : 'Subtraction'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={entry.type === 'addition' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.remarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.createdBy?.fullname || entry.createdBy?.username || 'Unknown'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(entry)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(entry)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * 10, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {[...Array(pagination.pages).keys()].map((page) => (
                  <button
                    key={page + 1}
                    onClick={() => handlePageChange(page + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${pagination.page === page + 1
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {page + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === pagination.pages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <BalanceEntryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteEntry}
        title="Delete Balance Entry"
        message={`Are you sure you want to delete this ${entryToDelete?.type} of ${entryToDelete ? formatCurrency(entryToDelete.amount) : ''}? This action cannot be undone.`}
      />
    </div>
  );
};

export default BalanceSheetPage; 