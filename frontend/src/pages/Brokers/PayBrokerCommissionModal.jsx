import React, { useState } from 'react';
import { formatCurrency } from '../../utils/helpers';

const PayBrokerCommissionModal = ({ broker, brokerSummary, onClose, onPaymentComplete, api }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate amount doesn't exceed remaining amount
    if (name === 'amount') {
      const paymentAmount = parseInt(value) || 0;
      if (paymentAmount <= 0) {
        setValidationError('Payment amount must be greater than zero');
      } else if (paymentAmount > brokerSummary.totalRemaining) {
        setValidationError(`Payment amount cannot exceed the remaining amount (${formatCurrency(brokerSummary.totalRemaining)})`);
      } else if (!Number.isInteger(Number(value))) {
        setValidationError('Payment amount must be a whole number');
      } else {
        setValidationError(null);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validationError) {
      return;
    }

    // Validate amount
    if (!formData.amount || parseInt(formData.amount) <= 0) {
      setValidationError('Please enter a valid payment amount');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Make API call to add payment
      const response = await api.post(`/brokers/${broker._id}/payments`, formData);

      // Call the callback to notify parent component
      if (onPaymentComplete) {
        onPaymentComplete(response.data);
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      setError(err.response?.data?.message || 'Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Commission Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Broker Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="mb-2">
            <span className="font-medium">Broker:</span> {broker.brokerName}
          </div>
          <div className="mb-2">
            <span className="font-medium">Total Commission:</span> {formatCurrency(brokerSummary.totalCommission)}
          </div>
          <div className="mb-2">
            <span className="font-medium">Total Paid:</span> {formatCurrency(brokerSummary.totalPaid)}
          </div>
          <div className="font-medium">
            <span className="font-medium">Remaining Amount:</span> {formatCurrency(brokerSummary.totalRemaining)}
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
              Payment Amount *
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              max={brokerSummary.totalRemaining}
              step="1"
              value={formData.amount}
              onChange={handleInputChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${validationError ? 'border-red-500' : ''
                }`}
              placeholder="Enter amount"
              required
            />
            {validationError && (
              <p className="text-red-500 text-xs italic mt-1">{validationError}</p>
            )}
          </div>

          <div className="mb-4">
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

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentDate">
              Payment Date *
            </label>
            <input
              id="paymentDate"
              name="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={saving || validationError}
            >
              {saving ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayBrokerCommissionModal; 