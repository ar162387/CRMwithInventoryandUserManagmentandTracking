import React, { useState } from 'react';
import { formatCurrency } from '../../utils/helpers';

const BrokerPaymentModal = ({ broker, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank',
    notes: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid payment amount');
      return false;
    }
    if (!formData.paymentDate) {
      setError('Please select a payment date');
      return false;
    }
    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onClose();
    } catch (err) {
      console.error('Error making payment:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Record Broker Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            <span className="font-medium">Broker:</span> {broker.brokerName}
          </p>
          {broker.pendingAmount > 0 && (
            <p className="text-red-600 font-semibold">
              Pending Amount: {formatCurrency(broker.pendingAmount)}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
              Payment Amount*
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="paymentDate" className="block text-gray-700 text-sm font-bold mb-2">
              Payment Date*
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="paymentMethod" className="block text-gray-700 text-sm font-bold mb-2">
              Payment Method*
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="online">Online Payment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Add any payment notes here..."
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrokerPaymentModal; 