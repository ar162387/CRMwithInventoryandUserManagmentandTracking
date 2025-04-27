import React, { useState, useEffect, useRef } from 'react';
import { getVendorInvoices, searchVendorInvoices, getVendorInvoicesByVendor } from '../../services/vendorInvoiceService';
import { getVendors, searchVendors } from '../../services/vendorService';
import ViewVendorInvoiceModal from './ViewVendorInvoiceModal';
import UpdateVendorPaymentModal from './UpdateVendorPaymentModal';
import { formatCurrency, formatDate } from '../../utils/helpers';

const VendorPayables = () => {
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const dropdownRef = useRef(null);

  // Summary state
  const [vendorSummary, setVendorSummary] = useState({
    totalInvoiceAmount: 0,
    totalPaid: 0,
    totalRemaining: 0
  });

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load invoices and vendors on component mount
  useEffect(() => {
    fetchInvoices();
    fetchVendors();
  }, []);

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

  // Fetch all vendors
  const fetchVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  // Fetch invoices from API
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // If a vendor is selected, fetch only their invoices
      let data;
      if (selectedVendor) {
        data = await getVendorInvoicesByVendor(selectedVendor._id);
      } else {
        data = await getVendorInvoices();
      }

      setInvoices(data);
      calculateSummary(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load vendor invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary totals
  const calculateSummary = (invoicesData) => {
    const summary = {
      totalInvoiceAmount: 0,
      totalPaid: 0,
      totalRemaining: 0
    };

    invoicesData.forEach(invoice => {
      summary.totalInvoiceAmount += invoice.total || 0;
      summary.totalPaid += invoice.totalPaidAmount || 0;
      summary.totalRemaining += invoice.remainingAmount || 0;
    });

    setVendorSummary(summary);
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get filtered invoices based on status
  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    return filtered;
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsDropdownOpen(value.length > 0);
  };

  // Handle vendor selection
  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setSearchTerm(vendor.vendorName);
    setIsDropdownOpen(false);
    setCurrentPage(1); // Reset pagination
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedVendor(null);
    setSearchTerm('');
    setCurrentPage(1);
    fetchInvoices(); // Fetch all invoices
  };

  // Effect to reload data when vendor selection changes
  useEffect(() => {
    fetchInvoices();
  }, [selectedVendor]);

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle view invoice
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  // Handle update payment
  const handleUpdatePayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  // Handle payment added
  const handlePaymentAdded = async () => {
    setShowPaymentModal(false);
    await fetchInvoices(); // Refresh invoices list
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

  // Get paginated invoices
  const getPaginatedInvoices = () => {
    const filtered = getFilteredInvoices();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredInvoices().length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Vendor Payables</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        {/* Search with Autocomplete Dropdown */}
        <div className="flex-1 min-w-[200px] relative" ref={dropdownRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search vendor..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              onFocus={() => searchTerm && setIsDropdownOpen(true)}
            />
            {searchTerm && (
              <button
                onClick={handleClearSelection}
                className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>

          {/* Vendor dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border overflow-y-auto max-h-60">
              {filteredVendors.length === 0 ? (
                <div className="px-4 py-2 text-gray-500">No vendors found</div>
              ) : (
                filteredVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleVendorSelect(vendor)}
                  >
                    {vendor.vendorName}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-auto">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Vendor Card */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500">Vendor</h3>
          <p className="text-xl font-semibold mt-1">
            {selectedVendor ? selectedVendor.vendorName : 'ALL'}
          </p>
        </div>

        {/* Total Invoice Amount Card */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Invoice Amount</h3>
          <p className="text-xl font-semibold mt-1 text-blue-600">
            {formatCurrency(vendorSummary.totalInvoiceAmount)}
          </p>
        </div>

        {/* Total Paid Card */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Paid</h3>
          <p className="text-xl font-semibold mt-1 text-green-600">
            {formatCurrency(vendorSummary.totalPaid)}
          </p>
        </div>

        {/* Total Remaining Card */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Remaining</h3>
          <p className="text-xl font-semibold mt-1 text-red-600">
            {formatCurrency(vendorSummary.totalRemaining)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-5 border-b border-gray-200 bg-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </td>
                </tr>
              ) : getPaginatedInvoices().length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-5 border-b border-gray-200 bg-white text-center">
                    No vendor invoices found
                  </td>
                </tr>
              ) : (
                getPaginatedInvoices().map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {invoice.invoiceNumber}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {invoice.vendorName}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {formatDate(invoice.invoiceDate)}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {formatCurrency(invoice.total)}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {formatCurrency(invoice.totalPaidAmount)}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {formatCurrency(invoice.remainingAmount)}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <span className={`px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                        {getStatusDisplayText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUpdatePayment(invoice)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-5 bg-white border-t flex flex-col xs:flex-row items-center xs:justify-between">
            <div className="inline-flex mt-2 xs:mt-0">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  } text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-l`}
              >
                Prev
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  } text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-r`}
              >
                Next
              </button>
            </div>
            <span className="text-xs xs:text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {showViewModal && (
        <ViewVendorInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* Update Payment Modal */}
      {showPaymentModal && (
        <UpdateVendorPaymentModal
          invoice={selectedInvoice}
          onClose={() => setShowPaymentModal(false)}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
};

export default VendorPayables; 