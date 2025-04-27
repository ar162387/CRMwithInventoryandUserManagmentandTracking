import React from 'react';
import { formatCurrency, formatDate, getPaymentMethodText } from '../../utils/helpers';

const CommissionerPaymentHistoryModal = ({ commissioner, onClose }) => {
  // Sort payments by date, newest first
  const sortedPayments = commissioner.payments
    ? [...commissioner.payments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
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
          <p><span className="font-semibold">Total Commission:</span> {formatCurrency(commissioner.totalCommission)}</p>
          <p><span className="font-semibold">Total Paid:</span> {formatCurrency(commissioner.totalPaid)}</p>
          <p><span className="font-semibold">Remaining:</span> {formatCurrency(commissioner.totalRemaining)}</p>
        </div>

        {sortedPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payment records found for this commissioner.
          </div>
        ) : (
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
                {sortedPayments.map((payment, index) => (
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

export default CommissionerPaymentHistoryModal; 