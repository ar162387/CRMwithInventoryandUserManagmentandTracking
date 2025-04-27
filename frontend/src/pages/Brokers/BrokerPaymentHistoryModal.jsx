import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate, getPaymentMethodText } from '../../utils/helpers';

const BrokerPaymentHistoryModal = ({ broker, onClose, api }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brokerData, setBrokerData] = useState(null);

  // Fetch broker data with payments on mount
  useEffect(() => {
    const fetchBrokerDetails = async () => {
      try {
        setLoading(true);
        // Get the broker details with their payment history
        const response = await api.get(`/brokers/${broker._id}`);
        setBrokerData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching broker details:', err);
        setError('Failed to load broker payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchBrokerDetails();
  }, [broker._id, api]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Broker Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{broker.brokerName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Total Commission:</span>{' '}
              {brokerData ? formatCurrency(brokerData.totalCommission) : '...'}
            </div>
            <div>
              <span className="font-medium">Total Paid:</span>{' '}
              {brokerData ? formatCurrency(brokerData.totalPaid) : '...'}
            </div>
            <div>
              <span className="font-medium">Remaining:</span>{' '}
              {brokerData ? formatCurrency(brokerData.totalRemaining) : '...'}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Payment History */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : brokerData && brokerData.payments && brokerData.payments.length > 0 ? (
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
                {brokerData.payments
                  .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)) // Sort by date, newest first
                  .map((payment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
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
          <div className="text-center py-8 text-gray-500">
            No payment history found for this broker.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrokerPaymentHistoryModal; 