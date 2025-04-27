import React, { useState } from 'react';
import { formatDate } from '../../utils/helpers';

const BrokerDueDateModal = ({ broker, onClose, onDueDateUpdate, api }) => {
  const [dueDate, setDueDate] = useState(
    broker.dueDate ? formatDate(broker.dueDate, 'yyyy-MM-dd') : ''
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!dueDate) {
      setError('Please select a due date');
      return;
    }

    try {
      setIsSubmitting(true);

      // Update broker due date via API
      await api.put(`/brokers/${broker._id}/due-date`, { dueDate });

      // Notify parent component
      if (onDueDateUpdate) {
        await onDueDateUpdate();
      }

      onClose();
    } catch (err) {
      console.error('Error updating due date:', err);
      setError(err.response?.data?.message || 'Failed to update due date');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Update Payment Due Date</h2>
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
          {broker.dueDate && (
            <p className="text-gray-700">
              <span className="font-medium">Current Due Date:</span> {formatDate(broker.dueDate)}
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
            <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
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
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Due Date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrokerDueDateModal; 