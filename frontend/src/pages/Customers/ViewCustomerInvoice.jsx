import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerInvoiceById } from '../../services/customerInvoiceService';
import { FaPrint } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, getPaymentMethodText, printInvoice } from '../../utils/helpers';
import EditCustomerInvoiceModal from './EditCustomerInvoiceModal';

const ViewCustomerInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load invoice data
  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await getCustomerInvoiceById(id);
      setInvoice(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle print action
  const handlePrint = () => {
    if (invoice) {
      printInvoice(invoice, 'customer');
    }
  };

  // Handle edit invoice
  const handleEditInvoice = () => {
    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
  };

  // Handle update success
  const handleInvoiceUpdated = () => {
    fetchInvoice();
  };

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

  // Check if user is admin
  const isAdmin = user?.role === 'Admin';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => navigate('/customer-invoices')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">Invoice not found.</span>
        </div>
        <button
          onClick={() => navigate('/customer-invoices')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer Invoice Details</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/customer-invoices')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          >
            <FaPrint className="mr-2" /> Print
          </button>
          {isAdmin && (
            <button
              onClick={handleEditInvoice}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Invoice Information</h2>
              <p className="mb-2"><span className="font-medium">Invoice Number:</span> {invoice.invoiceNumber}</p>
              <p className="mb-2"><span className="font-medium">Date:</span> {formatDate(invoice.invoiceDate)}</p>
              {invoice.dueDate && (
                <p className="mb-2"><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
              )}
              <p className="mb-2">
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Customer & Broker</h2>
              <p className="mb-2"><span className="font-medium">Customer:</span> {invoice.customerName}</p>
              {invoice.brokerName && (
                <>
                  <p className="mb-2"><span className="font-medium">Broker:</span> {invoice.brokerName}</p>
                  <p className="mb-2"><span className="font-medium">Commission %:</span> {invoice.brokerCommissionPercentage}%</p>
                  <p className="mb-2"><span className="font-medium">Commission Amount:</span> {formatCurrency(invoice.brokerCommissionAmount)}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Wt
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Wt
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pkg Cost
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/kg
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.grossWeight} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.netWeight} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.packagingCost} PKR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sellingPrice} PKR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.totalPrice.toFixed(2)} PKR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="w-full md:w-1/2">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              {invoice.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoice.payments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.amount.toFixed(2)} PKR
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getPaymentMethodText(payment.paymentMethod)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No payments recorded yet.</p>
              )}
            </div>

            <div className="w-full md:w-1/3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Labour/Transport:</span>
                    <span>{formatCurrency(invoice.labourTransportCost)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Paid Amount:</span>
                    <span>{formatCurrency(invoice.totalPaidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Remaining Amount:</span>
                    <span>{formatCurrency(invoice.remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Invoice Modal */}
      {showEditModal && (
        <EditCustomerInvoiceModal
          invoiceId={id}
          onClose={handleEditModalClose}
          onUpdate={handleInvoiceUpdated}
        />
      )}
    </div>
  );
};

export default ViewCustomerInvoice; 