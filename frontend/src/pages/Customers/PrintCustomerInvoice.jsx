import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/print.css';

const PrintCustomerInvoice = () => {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    // Retrieve invoice data from session storage
    const invoiceData = sessionStorage.getItem('printInvoice');

    if (!invoiceData) {
      alert('No invoice data found to print');
      navigate('/customers');
      return;
    }

    try {
      const parsedInvoice = JSON.parse(invoiceData);
      setInvoice(parsedInvoice);

      // Print automatically
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error('Error parsing invoice data:', error);
      alert('Error loading invoice data');
      navigate('/customers');
    }
  }, [navigate]);

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

  // Get payment method text
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

  if (!invoice) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 print:p-0 print:max-w-none print:w-full">
      <div className="no-print mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/customers')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Print
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 print:p-0 print:shadow-none">
        {/* Invoice Header */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">Customer Invoice</h3>
              <p className="text-gray-600">Invoice #: {invoice.invoiceNumber}</p>
              <p className="text-gray-600">Date: {formatDate(invoice.invoiceDate)}</p>
              {invoice.dueDate && (
                <p className="text-gray-600">Due Date: {formatDate(invoice.dueDate)}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-600">Customer: <span className="font-semibold">{invoice.customerName}</span></p>
              {invoice.brokerName && (
                <p className="text-gray-600">Broker: <span className="font-semibold">{invoice.brokerName}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-gray-700">Items</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Wt
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Wt
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pkg Cost
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/kg
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.itemName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.grossWeight} kg
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.netWeight} kg
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.packagingCost} PKR
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.sellingPrice} PKR
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.totalPrice.toFixed(2)} PKR
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg w-1/2 ml-auto">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Subtotal:</span>
              <span>{invoice.subtotal?.toFixed(2)} PKR</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Labour/Transport:</span>
              <span>{invoice.labourTransportCost?.toFixed(2)} PKR</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b font-bold">
              <span>Total:</span>
              <span>{invoice.total?.toFixed(2)} PKR</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Paid Amount:</span>
              <span>{invoice.totalPaidAmount?.toFixed(2)} PKR</span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold text-red-600">
              <span>Remaining Amount:</span>
              <span>{invoice.remainingAmount?.toFixed(2)} PKR</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Payment Information</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.payments.map((payment, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {payment.amount.toFixed(2)} PKR
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodText(payment.paymentMethod)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 flex justify-between">
          <div className="text-center">
            <div className="border-t border-gray-300 w-40 pt-1">
              Authorized Signature
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-300 w-40 pt-1">
              Received By
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintCustomerInvoice; 