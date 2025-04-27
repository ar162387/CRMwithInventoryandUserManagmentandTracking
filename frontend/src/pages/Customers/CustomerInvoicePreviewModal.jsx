import React, { useState, useEffect } from 'react';
import { createCustomerInvoice } from '../../services/customerInvoiceService';
import '../../styles/print.css';

const CustomerInvoicePreviewModal = ({ invoice, onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Generate a unique invoice number when the modal opens
  useEffect(() => {
    generateInvoiceNumber();
  }, []);

  // Generate a unique invoice ID
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const newInvoiceNumber = `INV-${dateStr}-${randomNum}`;
    setInvoiceNumber(newInvoiceNumber);
  };

  // Calculate totals
  const subtotal = Math.round(invoice.items.reduce((sum, item) => sum + item.totalPrice, 0));
  const total = Math.round(subtotal + parseFloat(invoice.labourTransportCost || 0));
  const remainingAmount = Math.round(total - parseFloat(invoice.paidAmount || 0));

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

  // Handle save invoice
  const handleSaveInvoice = async () => {
    try {
      setSaving(true);
      setError(null);

      // Calculate broker commission amount if a broker is specified
      const subtotal = Math.round(invoice.items.reduce((sum, item) => sum + item.totalPrice, 0));
      const total = Math.round(subtotal + parseFloat(invoice.labourTransportCost || 0));

      // Prepare the data with the generated invoice number
      const invoiceData = {
        ...invoice,
        invoiceNumber: invoiceNumber,
        subtotal: subtotal,
        total: total,
        remainingAmount: Math.round(total - parseFloat(invoice.paidAmount || 0))
      };

      // Add broker commission amount if applicable
      if (invoiceData.brokerName && invoiceData.brokerCommissionPercentage > 0) {
        invoiceData.brokerCommissionAmount = Math.round((total * invoiceData.brokerCommissionPercentage) / 100);
      }

      // Clean up IDs to prevent validation errors
      if (!invoiceData.customerId || invoiceData.customerId === '') {
        invoiceData.customerId = null;
      }

      if (!invoiceData.brokerId || invoiceData.brokerId === '') {
        invoiceData.brokerId = null;
      }

      // Clean up item IDs
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        invoiceData.items = invoiceData.items.map(item => {
          const cleanedItem = { ...item };
          if (!cleanedItem.itemId || cleanedItem.itemId === '') {
            cleanedItem.itemId = null;
          }
          return cleanedItem;
        });
      }

      // Call the API to create the invoice
      await createCustomerInvoice(invoiceData);

      setSaved(true);
      if (onSave) onSave();
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError(`Failed to save invoice: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  // Prepare payments array for display
  const payments = [];
  if (invoice.paidAmount && parseFloat(invoice.paidAmount) > 0) {
    payments.push({
      amount: Math.round(parseFloat(invoice.paidAmount)),
      paymentMethod: 'cash',
      paymentDate: new Date()
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
      <div className="bg-white rounded-lg w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto p-6 print:p-0 print:max-w-none print:w-full print:max-h-none">
        <div className="print:hidden flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 print:hidden">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="print:p-4" id="printable-invoice">
          {/* Invoice Header */}
          <div className="mb-6 border-b pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Customer Invoice</h3>
                <p className="text-gray-600">Invoice #: {invoiceNumber}</p>
                <p className="text-gray-600">Date: {formatDate(invoice.invoiceDate)}</p>
                <p className="text-gray-600">Due Date: {formatDate(invoice.dueDate)}</p>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                        {item.totalPrice} PKR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg w-1/2 ml-auto">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Subtotal:</span>
                <span>{subtotal} PKR</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Labour/Transport:</span>
                <span>{parseFloat(invoice.labourTransportCost || 0)} PKR</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b font-bold">
                <span>Total:</span>
                <span>{total} PKR</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Paid Amount:</span>
                <span>{parseFloat(invoice.paidAmount || 0)} PKR</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-red-600">
                <span>Remaining Amount:</span>
                <span>{remainingAmount} PKR</span>
              </div>
            </div>
          </div>

          {/* Payment Information (for print view) */}
          {payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Payment Information</h3>
              <div className="overflow-x-auto">
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
                    {payments.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {payment.amount} PKR
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {getPaymentMethodText(payment.paymentMethod)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end mt-6 space-x-4 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={saving}
          >
            Cancel
          </button>

          {!saved ? (
            <button
              type="button"
              onClick={handleSaveInvoice}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Invoice'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Print Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInvoicePreviewModal; 