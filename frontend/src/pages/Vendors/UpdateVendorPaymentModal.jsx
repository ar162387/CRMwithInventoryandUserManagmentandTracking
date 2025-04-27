import React, { useState, useEffect } from 'react';
import { updateVendorInvoicePayment } from '../../services/vendorInvoiceService';
import { formatCurrency, formatDate } from '../../utils/helpers';

const UpdateVendorPaymentModal = ({ invoice, onClose, onPaymentAdded }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
  });

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Calculate remaining amount
  const remainingAmount = invoice.remainingAmount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate payment amount doesn't exceed remaining amount
    if (name === 'amount') {
      const paymentAmount = parseFloat(value) || 0;
      if (paymentAmount > remainingAmount) {
        setValidationError('Payment amount cannot exceed the remaining amount');
      } else {
        setValidationError(null);
      }
    }

    // Validate due date
    if (name === 'dueDate') {
      const selectedDate = new Date(value);
      const today = new Date();

      if (selectedDate < today) {
        setValidationError('Warning: Setting a due date in the past will mark this invoice as overdue');
      } else {
        setValidationError(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setValidationError('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(formData.amount) > remainingAmount) {
      setValidationError('Payment amount cannot exceed the remaining amount');
      return;
    }

    // Additional validation for due date
    if (formData.dueDate) {
      const selectedDueDate = new Date(formData.dueDate);
      const today = new Date();

      if (selectedDueDate < today) {
        const proceed = window.confirm('Setting a due date in the past will mark this invoice as overdue. Do you want to proceed?');
        if (!proceed) {
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError(null);

      // Debugging: Invoice details before payment
      console.log('Before payment - Invoice details:', {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.total,
        totalPaidAmount: invoice.totalPaidAmount,
        remainingAmount: invoice.remainingAmount,
        status: invoice.status,
        payments: invoice.payments ? invoice.payments.length : 0
      });

      // Ensure we're sending the data with the field names expected by the backend
      const paymentData = {
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate
      };

      // Only include dueDate if it has a value
      if (formData.dueDate) {
        paymentData.dueDate = formData.dueDate;
      }

      // Add detailed logging
      console.log('Sending payment data:', JSON.stringify(paymentData));
      console.log('Invoice ID:', invoice._id);

      // For backward compatibility, also include paidAmount
      paymentData.paidAmount = parseFloat(formData.amount);

      // Send the payment data to the API
      const updatedInvoice = await updateVendorInvoicePayment(invoice._id, paymentData);

      // Debugging: Payment result
      console.log('Payment update successful - Updated invoice details:', {
        id: updatedInvoice._id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        totalAmount: updatedInvoice.total,
        totalPaidAmount: updatedInvoice.totalPaidAmount,
        remainingAmount: updatedInvoice.remainingAmount,
        status: updatedInvoice.status,
        payments: updatedInvoice.payments ? updatedInvoice.payments.length : 0
      });

      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      setError(`Failed to update payment: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Update Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Invoice Information</h3>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span className="font-medium text-gray-700">Invoice Number:</span>
              <span className="text-gray-900">{invoice.invoiceNumber}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-medium text-gray-700">Vendor:</span>
              <span className="text-gray-900">{invoice.vendorName}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-medium text-gray-700">Total Amount:</span>
              <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                Payment Amount *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                step="0.01"
                min="0.01"
                max={remainingAmount}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
              {validationError && (
                <p className="text-red-500 text-xs italic mt-1">{validationError}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentDate">
                Payment Date *
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                Due Date (Optional)
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={saving || validationError}
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
                'Add Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateVendorPaymentModal; 