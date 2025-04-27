import React from 'react';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ViewVendorInvoiceModal = ({ invoice, onClose }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Invoice Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Invoice Information</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Invoice Number:</span>
                <span className="text-gray-900">{invoice.invoiceNumber}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Date:</span>
                <span className="text-gray-900">{formatDate(invoice.invoiceDate)}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Due Date:</span>
                <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                  {getStatusDisplayText(invoice.status)}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Vendor Information</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900">{invoice.vendorName}</span>
              </p>
              {invoice.brokerName && (
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">Broker:</span>
                  <span className="text-gray-900">{invoice.brokerName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Items</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Weight</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packaging Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items && invoice.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.grossWeight} kg</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.netWeight} kg</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.packagingCost)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.purchasePrice)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Payment Information</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Subtotal:</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Labour/Transport:</span>
                <span className="text-gray-900">{formatCurrency(invoice.labourTransportCost)}</span>
              </p>
              <p className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-700">Total Paid Amount:</span>
                <span className="text-green-600">{formatCurrency(invoice.totalPaidAmount)}</span>
              </p>
              <p className="flex justify-between font-bold text-red-600 border-t pt-2 mt-2">
                <span>Remaining Amount:</span>
                <span>{formatCurrency(invoice.remainingAmount)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Payment History</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payments.map((payment, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.paymentDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{getPaymentMethodText(payment.paymentMethod)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewVendorInvoiceModal; 