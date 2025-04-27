import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCommissionerInvoice } from '../../services/commissionerInvoiceService';
import { formatCurrency, formatDate, printCommissionerInvoice } from '../../utils/helpers';

const ViewCommissionerInvoice = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the invoice data when component mounts
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const data = await getCommissionerInvoice(id);
        setInvoice(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    if (invoice) {
      printCommissionerInvoice(invoice);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center">Invoice not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Commission Sheet Details</h1>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Print
          </button>
          <Link
            to="/commissioners/sheets"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        {/* Invoice Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Commission Sheet</h2>
              <p className="text-gray-600">Invoice #: {invoice.invoiceNumber}</p>
              <p className="text-gray-600">Date: {formatDate(invoice.invoiceDate)}</p>
            </div>
            <div className="mt-4 md:mt-0 md:text-right">
              <p className="text-gray-600">Commissioner: <span className="font-semibold">{invoice.commissionerName}</span></p>
              {invoice.buyerName && (
                <p className="text-gray-600">Buyer: <span className="font-semibold">{invoice.buyerName}</span></p>
              )}
              {invoice.customerName && (
                <p className="text-gray-600">Customer: <span className="font-semibold">{invoice.customerName}</span></p>
              )}
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold 
                ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Items</h3>
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
                    Sale Price/kg
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
                      {item.salePrice} PKR
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="p-6 bg-gray-50">
          <div className="w-full md:w-1/2 ml-auto">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium">Total Amount:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium">Commission Percentage:</span>
              <span>{invoice.commissionerPercentage}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 font-bold">
              <span>Commission Amount:</span>
              <span>{formatCurrency(invoice.commissionerAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="font-medium">Paid Amount:</span>
              <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold text-red-600">
              <span>Remaining Amount:</span>
              <span>{formatCurrency(invoice.remainingAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCommissionerInvoice; 