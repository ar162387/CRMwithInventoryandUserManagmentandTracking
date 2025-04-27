import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { addCommissionerPayment } from '../../services/commissionerService';

const PayCommissionerModal = ({ commissioner, commissionerSummary, onClose, onPaymentComplete }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]); // Format YYYY-MM-DD
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (parseFloat(amount) > commissionerSummary.totalRemaining) {
      setError(`Payment amount cannot exceed remaining balance (${formatCurrency(commissionerSummary.totalRemaining)})`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare payment data
      const paymentData = {
        amount: parseFloat(amount),
        paymentMethod: paymentMethod,
        paymentDate: new Date(paymentDate)
      };

      // Save payment
      await addCommissionerPayment(commissioner._id, paymentData);

      // Call completion handler
      if (onPaymentComplete) {
        onPaymentComplete();
      }
    } catch (err) {
      console.error('Error making payment:', err);
      setError(`Failed to process payment: ${err.message || 'Unknown error'}`);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Pay Commission</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Commissioner Details</h3>
          <p><span className="font-semibold">Name:</span> {commissioner.commissionerName}</p>
          <p><span className="font-semibold">Total Commission:</span> {formatCurrency(commissionerSummary.totalCommission)}</p>
          <p><span className="font-semibold">Total Paid:</span> {formatCurrency(commissionerSummary.totalPaid)}</p>
          <p><span className="font-semibold">Remaining Amount:</span> {formatCurrency(commissionerSummary.totalRemaining)}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="amount">
              Payment Amount (PKR) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Max: ${commissionerSummary.totalRemaining}`}
              required
              min="1"
              max={commissionerSummary.totalRemaining}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="paymentMethod">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="cash">Cash</option>
              <option value="online">Online Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="paymentDate">
              Payment Date *
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Make Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayCommissionerModal; 