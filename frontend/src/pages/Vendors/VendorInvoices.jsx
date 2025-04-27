import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { deleteVendorInvoice } from '../../services/vendorInvoiceService';
import ViewVendorInvoiceModal from './ViewVendorInvoiceModal';
import { getVendorInvoices, searchVendorInvoices } from '../../services/vendorInvoiceService';
import { formatCurrency, printInvoice } from '../../utils/helpers';

const VendorInvoices = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Fetch invoices on component mount or when returning from edit page
  useEffect(() => {
    fetchInvoices();

    // Check if we're returning from the edit page with a refresh flag
    if (location.state?.refresh) {
      console.log('Refreshing invoices after edit');
      fetchInvoices();
    }
  }, [location]);

  // Function to fetch all invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getVendorInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vendor invoices:', err);
      setError('Failed to load vendor invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle search
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      fetchInvoices();
      return;
    }

    try {
      setLoading(true);
      const data = await searchVendorInvoices(query);
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error('Error searching vendor invoices:', err);
      setError('Failed to search vendor invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Handle print invoice
  const handlePrintInvoice = (invoice) => {
    printInvoice(invoice, 'vendor');
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'unpaid':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status display text
  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partially Paid';
      case 'overdue':
        return 'Overdue';
      case 'unpaid':
        return 'Unpaid';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await deleteVendorInvoice(invoiceToDelete._id);
      setInvoices(invoices.filter(inv => inv._id !== invoiceToDelete._id));
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    } catch (err) {
      // Check if the error is related to inventory validation
      if (err.response && err.response.data && err.response.data.details) {
        // Format the validation errors for better readability
        const validationErrors = err.response.data.details;

        // Create an alert with the validation error details
        const errorMessage = validationErrors.join('\n\n');
        alert(`Cannot delete invoice due to inventory constraints:\n\n${errorMessage}`);
      } else {
        // For other errors, just show the error message
        setError(err.message || 'Failed to delete invoice');
      }

      // Keep the modal open if there's an error
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setInvoiceToDelete(null);
  };

  // Filter invoices based on search query and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      invoice.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Vendor Invoices</h1>

        <div className="flex gap-4">
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>

          <Link
            to="/vendors/generate"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Generate New Invoice
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    No vendor invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.vendorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(invoice.totalPaidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(invoice.remainingAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                        {getStatusDisplayText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Print
                        </button>
                        {user?.role === 'Admin' && (
                          <>
                            <Link
                              to={`/vendors/invoice/${invoice._id}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(invoice)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <ViewVendorInvoiceModal
          invoice={selectedInvoice}
          onClose={handleCloseViewModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && invoiceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">Are you sure you want to delete invoice #{invoiceToDelete.invoiceNumber}?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDeleteCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInvoices; 