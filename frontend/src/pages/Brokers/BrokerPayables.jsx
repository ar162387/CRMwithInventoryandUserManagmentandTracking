import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import PayBrokerCommissionModal from './PayBrokerCommissionModal';
import BrokerPaymentHistoryModal from './BrokerPaymentHistoryModal';
import BrokerDueDateModal from './BrokerDueDateModal';
import { getBrokers, getBroker } from '../../services/brokerService';
import api from '../../services/api';

const BrokerPayables = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [brokerSummary, setBrokerSummary] = useState({
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

  // Load brokers on mount
  useEffect(() => {
    const loadBrokers = async () => {
      try {
        console.log('Fetching brokers...');
        const brokersData = await getBrokers();
        console.log('Brokers loaded:', brokersData);

        // Use the broker data directly from the backend
        setBrokers(brokersData);

        // Calculate summary for all brokers
        calculateTotalSummary(brokersData);
      } catch (err) {
        console.error('Error loading brokers:', err);
        setError('Failed to load brokers. Please try again later.');
      }
    };

    loadBrokers();
    // Don't fetch invoices initially until the user selects a broker
  }, []);

  // Fetch all invoices with brokers from customer-invoices
  const fetchAllInvoices = async () => {
    try {
      setLoading(true);

      // Instead of using /brokers/all-invoices which doesn't exist,
      // use the customer-invoices endpoint and filter for broker invoices
      const response = await api.get('/customer-invoices');
      console.log('All invoices loaded:', response.data);

      // Filter for invoices that have a broker
      const brokerInvoices = response.data.filter(invoice =>
        invoice.brokerId || invoice.brokerName
      );

      // Sort invoices by date (newest first)
      const sortedInvoices = brokerInvoices.sort((a, b) =>
        new Date(b.invoiceDate) - new Date(a.invoiceDate)
      );

      setInvoices(sortedInvoices);
      setTotalPages(Math.ceil(sortedInvoices.length / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error loading all invoices:', err);
      setError('Failed to load invoices. Please try again later.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary for all brokers
  const calculateTotalSummary = (brokersData) => {
    if (!brokersData || brokersData.length === 0) return;

    const summary = {
      totalCommission: 0,
      totalPaid: 0,
      totalRemaining: 0
    };

    // Sum the values directly from the broker objects
    // The values are already properly calculated in the backend
    brokersData.forEach(broker => {
      summary.totalCommission += broker.totalCommission || 0;
      summary.totalPaid += broker.totalPaid || 0;
      summary.totalRemaining += broker.totalRemaining || 0;
    });

    setBrokerSummary(summary);
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

  // Filter brokers based on search term
  const filteredBrokers = brokers.filter(broker =>
    broker.brokerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set the broker summary when a broker is selected
  const calculateLocalSummary = (broker) => {
    if (!broker) {
      // If broker is cleared, recalculate total summary
      calculateTotalSummary(brokers);
      return;
    }

    // Use the values directly from the broker object
    // They are already properly calculated in the backend
    const summary = {
      totalCommission: broker.totalCommission || 0,
      totalPaid: broker.totalPaid || 0,
      totalRemaining: broker.totalRemaining || 0,
      status: broker.status || 'unpaid'
    };

    setBrokerSummary(summary);
  };

  // Fetch invoices based on selected broker
  const fetchInvoices = async () => {
    // If no broker is selected, fetch all invoices
    if (!selectedBroker) {
      await fetchAllInvoices();
      return;
    }

    try {
      setLoading(true);
      const endpoint = `/brokers/${selectedBroker._id}/invoices`;

      const response = await api.get(endpoint);
      console.log('Broker invoices loaded:', response.data);

      // Sort invoices by date (newest first)
      const sortedInvoices = response.data.sort((a, b) =>
        new Date(b.invoiceDate) - new Date(a.invoiceDate)
      );

      setInvoices(sortedInvoices);
      setTotalPages(Math.ceil(sortedInvoices.length / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices. Please try again later.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle broker selection
  const handleBrokerSelect = (broker) => {
    setSelectedBroker(broker);
    setSearchTerm(broker.brokerName);
    setIsDropdownOpen(false);
    setCurrentPage(1); // Reset pagination
    calculateLocalSummary(broker);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedBroker(null);
    setSearchTerm('');
    setCurrentPage(1);
    calculateTotalSummary(brokers);
    fetchAllInvoices();
  };

  // Effect to reload data when broker selection changes
  useEffect(() => {
    if (selectedBroker) {
      fetchInvoices();
    } else if (brokers.length > 0) {
      // Only try to fetch all invoices if we have brokers loaded
      fetchAllInvoices();
    }
  }, [selectedBroker, brokers.length]);

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

    // Recalculate broker summary locally
    if (selectedBroker) {
      try {
        const refreshedBroker = await getBroker(selectedBroker._id);
        setSelectedBroker(refreshedBroker);
        calculateLocalSummary(refreshedBroker);

        // Also refresh all brokers to keep the full summary updated
        const allBrokers = await getBrokers();
        setBrokers(allBrokers);

        // Refresh invoices
        fetchInvoices();
      } catch (err) {
        console.error('Error refreshing broker data:', err);
      }
    }
  };

  // Handle due date submission
  const handleDueDateSubmit = async () => {
    // Close the modal
    setIsDueDateModalOpen(false);

    // Recalculate broker summary locally
    if (selectedBroker) {
      try {
        const refreshedBroker = await getBroker(selectedBroker._id);
        setSelectedBroker(refreshedBroker);
        calculateLocalSummary(refreshedBroker);
      } catch (err) {
        console.error('Error refreshing broker data:', err);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Broker Payables</h1>

      {/* Broker selection searchable dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Broker:</label>
        <div className="relative" ref={dropdownRef}>
          <div className="flex">
            <input
              type="text"
              className="block w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type to search brokers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onClick={() => setIsDropdownOpen(true)}
            />
            {selectedBroker && (
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
              {filteredBrokers.length === 0 ? (
                <div className="px-4 py-2 text-gray-500">No brokers found</div>
              ) : (
                filteredBrokers.map(broker => (
                  <div
                    key={broker._id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleBrokerSelect(broker)}
                  >
                    {broker.brokerName}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {!selectedBroker && (
          <p className="mt-2 text-sm text-gray-600">
            Showing summary and invoices for all brokers. Select a broker to filter.
          </p>
        )}
        {brokers.length === 0 && !error && (
          <p className="mt-2 text-sm text-orange-600">Loading brokers...</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Broker Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Broker</h2>
          <p className="text-2xl font-bold text-gray-800">
            {selectedBroker ? selectedBroker.brokerName : 'All Brokers'}
          </p>

          {selectedBroker && (
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
            {formatCurrency(brokerSummary.totalCommission)}
          </p>
          {!selectedBroker && (
            <p className="text-xs text-gray-500 mt-1">Sum of all broker commissions</p>
          )}
        </div>

        {/* Total Paid Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Paid</h2>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(brokerSummary.totalPaid)}
          </p>
          {!selectedBroker && (
            <p className="text-xs text-gray-500 mt-1">Sum of all broker payments</p>
          )}
        </div>

        {/* Remaining Amount Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Remaining Amount</h2>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(brokerSummary.totalRemaining)}
          </p>
          {!selectedBroker && (
            <p className="text-xs text-gray-500 mt-1">Total amount remaining to be paid</p>
          )}
          {selectedBroker && brokerSummary.status && (
            <div className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold
              ${brokerSummary.status === 'paid' ? 'bg-green-100 text-green-800' :
                brokerSummary.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  brokerSummary.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}`}
            >
              {brokerSummary.status.charAt(0).toUpperCase() + brokerSummary.status.slice(1)}
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
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
                  Broker Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
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
                  <td colSpan="9" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : currentInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
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
                      {invoice.brokerName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.brokerCommissionPercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.brokerCommissionAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <Link
                        to={`/customer-invoice/${invoice._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
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
      {isPaymentModalOpen && selectedBroker && (
        <PayBrokerCommissionModal
          broker={selectedBroker}
          brokerSummary={brokerSummary}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={handlePaymentSubmit}
          api={api}
        />
      )}

      {isHistoryModalOpen && selectedBroker && (
        <BrokerPaymentHistoryModal
          broker={selectedBroker}
          onClose={() => setIsHistoryModalOpen(false)}
          api={api}
        />
      )}

      {isDueDateModalOpen && selectedBroker && (
        <BrokerDueDateModal
          broker={selectedBroker}
          brokerSummary={brokerSummary}
          onClose={() => setIsDueDateModalOpen(false)}
          onDueDateUpdate={handleDueDateSubmit}
          api={api}
        />
      )}
    </div>
  );
};

export default BrokerPayables;