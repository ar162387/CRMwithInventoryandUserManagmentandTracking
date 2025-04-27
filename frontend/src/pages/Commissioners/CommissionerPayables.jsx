import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import PayCommissionerModal from './PayCommissionerModal';
import CommissionerPaymentHistoryModal from './CommissionerPaymentHistoryModal';
import CommissionerDueDateModal from './CommissionerDueDateModal';
import { getCommissioners, getCommissioner } from '../../services/commissionerService';
import { getCommissionerInvoices, deleteCommissionerInvoice } from '../../services/commissionerInvoiceService';
import api from '../../services/api';

const CommissionerPayables = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [commissioners, setCommissioners] = useState([]);
  const [selectedCommissioner, setSelectedCommissioner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [commissionerSummary, setCommissionerSummary] = useState({
    totalCommission: 0,
    totalPaid: 0,
    totalRemaining: 0
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // State for modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);

  // Set up error and success message timeout clearing
  useEffect(() => {
    // If there's an error or success message, clear it after 10 seconds
    if (error || success) {
      const timeout = setTimeout(() => {
        if (error) setError(null);
        if (success) setSuccess(null);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [error, success]);

  // Load commissioners on mount
  useEffect(() => {
    const loadCommissioners = async () => {
      try {
        console.log('Fetching commissioners...');
        const commissionersData = await getCommissioners();
        console.log('Commissioners loaded:', commissionersData);

        // Use the commissioner data directly from the backend
        setCommissioners(commissionersData);

        // Calculate summary for all commissioners
        calculateTotalSummary(commissionersData);
      } catch (err) {
        console.error('Error loading commissioners:', err);
        setError({
          message: 'Failed to load commissioners. Please try again later.',
          type: 'error'
        });
      }
    };

    loadCommissioners();
    // Don't fetch invoices initially until the user selects a commissioner
  }, []);

  // Fetch all commissioner invoices
  const fetchAllInvoices = async () => {
    try {
      setLoading(true);

      const response = await getCommissionerInvoices();
      console.log('All commissioner invoices loaded:', response);

      // Sort invoices by date (newest first)
      const sortedInvoices = response.sort((a, b) =>
        new Date(b.invoiceDate) - new Date(a.invoiceDate)
      );

      setInvoices(sortedInvoices);
      setTotalPages(Math.ceil(sortedInvoices.length / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error loading all invoices:', err);
      setError({
        message: 'Failed to load invoices. Please try again later.',
        type: 'error'
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary for all commissioners
  const calculateTotalSummary = (commissionersData) => {
    if (!commissionersData || commissionersData.length === 0) return;

    const summary = {
      totalCommission: 0,
      totalPaid: 0,
      totalRemaining: 0
    };

    // Sum the values directly from the commissioner objects
    commissionersData.forEach(commissioner => {
      summary.totalCommission += commissioner.totalCommission || 0;
      summary.totalPaid += commissioner.totalPaid || 0;
      summary.totalRemaining += commissioner.totalRemaining || 0;
    });

    setCommissionerSummary(summary);
  };

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Filter commissioners based on search term
  const filteredCommissioners = commissioners.filter(commissioner =>
    commissioner.commissionerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set the commissioner summary when a commissioner is selected
  const calculateLocalSummary = (commissioner) => {
    if (!commissioner) {
      // If commissioner is cleared, recalculate total summary
      calculateTotalSummary(commissioners);
      return;
    }

    // Use the values directly from the commissioner object
    const summary = {
      totalCommission: commissioner.totalCommission || 0,
      totalPaid: commissioner.totalPaid || 0,
      totalRemaining: commissioner.totalRemaining || 0,
      status: commissioner.status || 'unpaid'
    };

    setCommissionerSummary(summary);
  };

  // Fetch invoices based on selected commissioner
  const fetchInvoices = async () => {
    // If no commissioner is selected, fetch all invoices
    if (!selectedCommissioner) {
      await fetchAllInvoices();
      return;
    }

    try {
      setLoading(true);
      const endpoint = `/commissioner-invoices/commissioner/${selectedCommissioner._id}`;

      const response = await api.get(endpoint);
      console.log('Commissioner invoices loaded:', response.data);

      // Sort invoices by date (newest first)
      const sortedInvoices = response.data.sort((a, b) =>
        new Date(b.invoiceDate) - new Date(a.invoiceDate)
      );

      setInvoices(sortedInvoices);
      setTotalPages(Math.ceil(sortedInvoices.length / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError({
        message: 'Failed to load invoices. Please try again later.',
        type: 'error'
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle commissioner selection
  const handleCommissionerSelect = (commissioner) => {
    setSelectedCommissioner(commissioner);
    setSearchTerm(commissioner.commissionerName);
    setIsDropdownOpen(false);
    setCurrentPage(1); // Reset pagination
    calculateLocalSummary(commissioner);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedCommissioner(null);
    setSearchTerm('');
    setCurrentPage(1);
    calculateTotalSummary(commissioners);
    fetchAllInvoices();
  };

  // Effect to reload data when commissioner selection changes
  useEffect(() => {
    if (selectedCommissioner) {
      fetchInvoices();
    } else if (commissioners.length > 0) {
      // Only try to fetch all invoices if we have commissioners loaded
      fetchAllInvoices();
    }
  }, [selectedCommissioner, commissioners.length]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = invoices.slice(indexOfFirstItem, indexOfLastItem);

  // Handle opening payment modal
  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  // Handle opening payment history modal
  const handleOpenHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };

  // Handle opening due date modal
  const handleOpenDueDateModal = () => {
    setIsDueDateModalOpen(true);
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    // Close the modal
    setIsPaymentModalOpen(false);

    // Recalculate commissioner summary locally
    if (selectedCommissioner) {
      try {
        const refreshedCommissioner = await getCommissioner(selectedCommissioner._id);
        setSelectedCommissioner(refreshedCommissioner);
        calculateLocalSummary(refreshedCommissioner);

        // Also refresh all commissioners to keep the full summary updated
        const allCommissioners = await getCommissioners();
        setCommissioners(allCommissioners);

        // Refresh invoices
        fetchInvoices();
      } catch (err) {
        console.error('Error refreshing commissioner data:', err);
      }
    }
  };

  // Handle due date submission
  const handleDueDateSubmit = async () => {
    // Close the modal
    setIsDueDateModalOpen(false);

    // Recalculate commissioner summary locally
    if (selectedCommissioner) {
      try {
        const refreshedCommissioner = await getCommissioner(selectedCommissioner._id);
        setSelectedCommissioner(refreshedCommissioner);
        calculateLocalSummary(refreshedCommissioner);
      } catch (err) {
        console.error('Error refreshing commissioner data:', err);
      }
    }
  };

  // Handle invoice deletion
  const handleDelete = async (invoice) => {
    if (user?.role !== 'Admin') {
      setError({ message: 'Only administrators can delete commissioner invoices', type: 'validation' });
      return;
    }

    try {
      // If we're here, we can confirm the deletion
      if (window.confirm(
        `Are you sure you want to delete the invoice ${invoice.invoiceNumber}?\n\n` +
        `This will:\n` +
        `1. Remove the invoice record\n` +
        `2. Subtract ${formatCurrency(invoice.commissionerAmount)} from the commissioner's total commission\n` +
        `${invoice.paidAmount > 0 ? `3. Remove the payment of ${formatCurrency(invoice.paidAmount)} from the commissioner's payment history\n` : ''}` +
        `\nThis action cannot be undone.`
      )) {
        try {
          // Delete the invoice which will:
          // 1. Remove the invoice
          // 2. Remove the associated payment from the commissioner's payments array
          // 3. Update the commissioner's totals (commission, paid, remaining)
          await deleteCommissionerInvoice(invoice._id);

          // Show success message
          setSuccess(
            `Invoice ${invoice.invoiceNumber} was deleted successfully. ` +
            `${invoice.paidAmount > 0
              ? `The payment of ${formatCurrency(invoice.paidAmount)} has been reversed.`
              : ''}`
          );

          // Refresh data
          if (selectedCommissioner) {
            const refreshedCommissioner = await getCommissioner(selectedCommissioner._id);
            setSelectedCommissioner(refreshedCommissioner);
            calculateLocalSummary(refreshedCommissioner);
            fetchInvoices();
          } else {
            const allCommissioners = await getCommissioners();
            setCommissioners(allCommissioners);
            calculateTotalSummary(allCommissioners);
            fetchAllInvoices();
          }

          setError(null); // Clear any previous errors
        } catch (err) {
          console.error('Error deleting invoice:', err);
          // Handle specific validation error from backend
          if (err.response?.status === 400) {
            setError({
              message: err.response.data.message || 'Failed to delete invoice due to validation errors.',
              type: 'validation'
            });
          } else {
            setError({
              message: err.response?.data?.message || 'Failed to delete invoice. Please try again.',
              type: 'error'
            });
          }
        }
      }
    } catch (err) {
      console.error('Error in delete invoice process:', err);
      setError({
        message: 'An unexpected error occurred while trying to delete the invoice.',
        type: 'error'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Commissioner Payables</h1>

      {/* Commissioner selection searchable dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Commissioner:</label>
        <div className="relative" ref={dropdownRef}>
          <div className="flex">
            <input
              type="text"
              className="block w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type to search commissioners..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onClick={() => setIsDropdownOpen(true)}
            />
            {selectedCommissioner && (
              <button
                onClick={handleClearSelection}
                className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full md:w-1/3 mt-1 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
              {filteredCommissioners.length === 0 ? (
                <div className="px-4 py-2 text-gray-500">No commissioners found</div>
              ) : (
                filteredCommissioners.map(commissioner => (
                  <div
                    key={commissioner._id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleCommissionerSelect(commissioner)}
                  >
                    {commissioner.commissionerName}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {!selectedCommissioner && (
          <p className="mt-2 text-sm text-gray-600">
            Showing summary and invoices for all commissioners. Select a commissioner to filter.
          </p>
        )}
        {commissioners.length === 0 && !error && (
          <p className="mt-2 text-sm text-orange-600">Loading commissioners...</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Commissioner Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Commissioner</h2>
          <p className="text-2xl font-bold text-gray-800">
            {selectedCommissioner ? selectedCommissioner.commissionerName : 'All Commissioners'}
          </p>

          {selectedCommissioner && (
            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleOpenPaymentModal}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Pay Commission
              </button>
              <button
                onClick={handleOpenHistoryModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Payment History
              </button>
              <button
                onClick={handleOpenDueDateModal}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
              >
                Set Reminder
              </button>
            </div>
          )}
        </div>

        {/* Total Commission Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Commission</h2>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(commissionerSummary.totalCommission)}
          </p>
          {!selectedCommissioner && (
            <p className="text-xs text-gray-500 mt-1">Sum of all commissioner commissions</p>
          )}
        </div>

        {/* Total Paid Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Paid</h2>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(commissionerSummary.totalPaid)}
          </p>
          {!selectedCommissioner && (
            <p className="text-xs text-gray-500 mt-1">Sum of all commissioner payments</p>
          )}
        </div>

        {/* Remaining Amount Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Remaining Amount</h2>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(commissionerSummary.totalRemaining)}
          </p>
          {!selectedCommissioner && (
            <p className="text-xs text-gray-500 mt-1">Total amount remaining to be paid</p>
          )}
          {selectedCommissioner && commissionerSummary.status && (
            <div className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold
              ${commissionerSummary.status === 'paid' ? 'bg-green-100 text-green-800' :
                commissionerSummary.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  commissionerSummary.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}`}
            >
              {commissionerSummary.status.charAt(0).toUpperCase() + commissionerSummary.status.slice(1)}
            </div>
          )}
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={`border px-4 py-3 rounded relative mb-4 ${typeof error === 'object' && error.type === 'validation'
          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
          : 'bg-red-100 border-red-400 text-red-700'
          }`}>
          <span className="block sm:inline">{typeof error === 'object' ? error.message : error}</span>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commissioner Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission %
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Amount
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : currentInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                currentInvoices.map((invoice, index) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.commissionerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.commissionerPercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.commissionerAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <Link
                        to={`/commissioner-invoice/${invoice._id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        View
                      </Link>
                      {user?.role === 'Admin' && (
                        <button
                          onClick={() => handleDelete(invoice)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {isPaymentModalOpen && selectedCommissioner && (
        <PayCommissionerModal
          commissioner={selectedCommissioner}
          commissionerSummary={commissionerSummary}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={handlePaymentSubmit}
          api={api}
        />
      )}

      {isHistoryModalOpen && selectedCommissioner && (
        <CommissionerPaymentHistoryModal
          commissioner={selectedCommissioner}
          onClose={() => setIsHistoryModalOpen(false)}
          api={api}
        />
      )}

      {isDueDateModalOpen && selectedCommissioner && (
        <CommissionerDueDateModal
          commissioner={selectedCommissioner}
          commissionerSummary={commissionerSummary}
          onClose={() => setIsDueDateModalOpen(false)}
          onDueDateUpdate={handleDueDateSubmit}
          api={api}
        />
      )}
    </div>
  );
};

export default CommissionerPayables; 