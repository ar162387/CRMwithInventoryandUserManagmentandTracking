import React, { useState, useEffect } from 'react';
import { addPaymentToCustomerInvoice, updateCustomerInvoiceDueDate } from '../../services/customerInvoiceService';

const UpdateCustomerPaymentModal = ({ invoice, onClose }) => {
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  // Due date state
  const [dueDate, setDueDate] = useState(
    invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
  );

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Amount validation
  const [isValidAmount, setIsValidAmount] = useState(true);

  // Validation for amount
  useEffect(() => {
    if (paymentData.amount) {
      const amount = parseFloat(paymentData.amount);
      setIsValidAmount(amount > 0 && amount <= invoice.remainingAmount);
    } else {
      setIsValidAmount(true);
    }
  }, [paymentData.amount, invoice.remainingAmount]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  // Handle due date change
  const handleDueDateChange = (e) => {
    setDueDate(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate amount
    if (!paymentData.amount || !isValidAmount) {
      setError('Please enter a valid payment amount (not exceeding the remaining amount)');
      return;
    }

    try {
      setLoading(true);

      // If due date has changed, update it
      if (dueDate !== (invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '')) {
        await updateCustomerInvoiceDueDate(invoice._id, { dueDate });
      }

      // Add payment
      if (parseFloat(paymentData.amount) > 0) {
        await addPaymentToCustomerInvoice(invoice._id, paymentData);
      }

      setSuccess(true);

      // Close modal after success
      setTimeout(() => {
        onClose(true); // pass true to refresh data
      }, 1500);
    } catch (err) {
      console.error('Error updating payment:', err);
      setError('Failed to update payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Update Payment</h2>
          <button
            onClick={() => onClose()}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">Payment updated successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="mb-4">
              <p className="font-semibold mb-2">Invoice: {invoice.invoiceNumber}</p>
              <p className="mb-2">Customer: {invoice.customerName}</p>
              <p className="mb-2">Total Amount: {invoice.total?.toFixed(2)} PKR</p>
              <p className="mb-2">Paid Amount: {invoice.totalPaidAmount?.toFixed(2)} PKR</p>
              <p className="mb-2 font-semibold text-red-600">Remaining: {invoice.remainingAmount?.toFixed(2)} PKR</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={dueDate}
                onChange={handleDueDateChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                Payment Amount (PKR)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={paymentData.amount}
                onChange={handleInputChange}
                className={`shadow appearance-none border ${!isValidAmount ? 'border-red-500' : ''} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                placeholder="Enter amount"
              />
              {!isValidAmount && (
                <p className="text-red-500 text-xs italic">
                  Amount must be greater than 0 and not exceed the remaining amount.
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentDate">
                Payment Date
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={paymentData.paymentDate}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center justify-end mt-6">
              <button
                type="button"
                onClick={() => onClose()}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdateCustomerPaymentModal; 