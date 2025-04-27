import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/helpers';
import { getItems } from '../../services/itemService';
import CreateFakeInvoiceModal from './CreateFakeInvoiceModal';
import ViewEditFakeInvoiceModal from './ViewEditFakeInvoiceModal';

const FakeInvoicesPage = () => {
  // State for form and data
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewEditModal, setShowViewEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Load items on component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const itemsData = await getItems();
        setItems(itemsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Handle edit invoice
  const handleEditInvoice = (index) => {
    setEditingIndex(index);
    setShowViewEditModal(true);
  };

  // Handle delete invoice
  const handleDeleteInvoice = (index) => {
    setInvoices(prev => prev.filter((_, i) => i !== index));
  };

  // Create new invoice
  const handleCreateInvoice = (newInvoice) => {
    setInvoices(prev => [...prev, newInvoice]);
    setShowCreateModal(false);
  };

  // Update existing invoice
  const handleUpdateInvoice = (updatedInvoice) => {
    const updatedInvoices = [...invoices];
    updatedInvoices[editingIndex] = updatedInvoice;
    setInvoices(updatedInvoices);
    setShowViewEditModal(false);
    setEditingIndex(null);
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice =>
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.brokerName && invoice.brokerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Fake Invoices</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Search Bar and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search by customer or broker name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full max-w-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create New Invoice
        </button>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length > 0 ? (
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Broker
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission %
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customerName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {invoice.brokerName || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {invoice.invoiceDate}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(invoice.paidAmount)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {invoice.brokerName ? `${invoice.brokerCommissionPercentage}%` : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleEditInvoice(index)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View/Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No invoices found. Create a new invoice to get started.
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateFakeInvoiceModal
          items={items}
          onSave={handleCreateInvoice}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* View/Edit Invoice Modal */}
      {showViewEditModal && editingIndex !== null && (
        <ViewEditFakeInvoiceModal
          invoice={invoices[editingIndex]}
          items={items}
          onSave={handleUpdateInvoice}
          onClose={() => {
            setShowViewEditModal(false);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default FakeInvoicesPage; 