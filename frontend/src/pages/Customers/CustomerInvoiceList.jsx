import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomerInvoices, deleteCustomerInvoice } from '../../services/customerInvoiceService';
import { FaEye, FaPrint, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, printInvoice } from '../../utils/helpers';
import EditCustomerInvoiceModal from './EditCustomerInvoiceModal';

const CustomerInvoiceList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'Admin';

  // State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Load data
  useEffect(() => {
    loadInvoices();
  }, [search, status, itemsPerPage]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await getCustomerInvoices({ search, status });
      setInvoices(response);
      setTotalPages(Math.ceil(response.length / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error loading customer invoices:', err);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setCurrentPage(1);
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

  // Get payment method display text
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'online':
        return 'Online';
      case 'cheque':
        return 'Cheque';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = (invoice) => {
    printInvoice(invoice, 'customer');
  };

  // Handle edit invoice
  const handleEditInvoice = (invoiceId) => {
    setCurrentInvoiceId(invoiceId);
    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setCurrentInvoiceId(null);
  };

  // Handle update success
  const handleInvoiceUpdated = () => {
    loadInvoices();
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice? This will return inventory items to stock.')) {
      try {
        await deleteCustomerInvoice(id);
        // Refresh the list
        loadInvoices();
        alert('Invoice deleted successfully');
      } catch (err) {
        console.error('Error deleting invoice:', err);
        alert('Failed to delete invoice: ' + (err.message || 'Unknown error'));
      }
    }
  };

  // Get current invoices for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = invoices.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer Invoices</h1>
        <Link
          to="/generate-customer-invoice"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Generate Customer Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search by invoice no. or customer name"
            value={search}
            onChange={handleSearchChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="w-full md:w-1/4">
          <select
            value={status}
            onChange={handleStatusChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-700">No invoices found. Create a new invoice using the button above.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr. No.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice No.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Broker
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
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentInvoices.map((invoice, index) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.brokerName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.totalPaidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.remainingAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex justify-center space-x-2">
                      <button
                        onClick={() => navigate(`/customer-invoice/${invoice._id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handlePrintInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Print"
                      >
                        <FaPrint />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEditInvoice(invoice._id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">
                      {indexOfLastItem > invoices.length ? invoices.length : indexOfLastItem}
                    </span>{' '}
                    of <span className="font-medium">{invoices.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <span className="sr-only">Previous</span>
                      &laquo;
                    </button>
                    {[...Array(totalPages).keys()].map(number => (
                      <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === number + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {number + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <span className="sr-only">Next</span>
                      &raquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Customer Invoice Modal */}
      {showEditModal && currentInvoiceId && (
        <EditCustomerInvoiceModal
          invoiceId={currentInvoiceId}
          onClose={handleEditModalClose}
          onUpdate={handleInvoiceUpdated}
        />
      )}
    </div>
  );
};

export default CustomerInvoiceList; 