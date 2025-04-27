import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../utils/helpers';
import { getItems } from '../services/itemService';

const FakeInvoices = () => {
  // Initial states
  const initialInvoiceData = {
    customerName: '',
    brokerName: '',
    brokerCommissionPercentage: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [],
    labourTransportCost: 0,
    paidAmount: 0
  };

  const initialItemState = {
    itemId: '',
    itemName: '',
    quantity: '',
    grossWeight: '',
    netWeight: '',
    packagingCost: '',
    sellingPrice: '',
    totalPrice: 0
  };

  // State for form and data
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(initialInvoiceData);
  const [currentItem, setCurrentItem] = useState(initialItemState);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Items autocomplete state
  const [items, setItems] = useState([]);
  const [itemInput, setItemInput] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref for dropdown click away detection
  const itemRef = useRef(null);

  // Calculated values
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [brokerCommissionAmount, setBrokerCommissionAmount] = useState(0);

  // Load items on component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const itemsData = await getItems();
        setItems(itemsData);
        setFilteredItems(itemsData);
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

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter items based on input
  useEffect(() => {
    if (itemInput) {
      const filtered = items.filter(item =>
        item.itemName.toLowerCase().includes(itemInput.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [itemInput, items]);

  // Calculate item total price whenever the item details change
  useEffect(() => {
    const packagingTotal = parseFloat(currentItem.quantity || 0) * parseFloat(currentItem.packagingCost || 0);
    const sellingTotal = parseFloat(currentItem.netWeight || 0) * parseFloat(currentItem.sellingPrice || 0);
    const itemTotal = Math.round(packagingTotal + sellingTotal);

    setCurrentItem(prev => ({
      ...prev,
      totalPrice: itemTotal
    }));
  }, [
    currentItem.quantity,
    currentItem.netWeight,
    currentItem.packagingCost,
    currentItem.sellingPrice
  ]);

  // Calculate invoice totals whenever items or labour cost changes
  useEffect(() => {
    const itemsSubtotal = currentInvoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setSubtotal(Math.round(itemsSubtotal));

    const calculatedTotal = Math.round(itemsSubtotal + parseFloat(currentInvoice.labourTransportCost || 0));
    setTotal(calculatedTotal);

    const calculatedRemaining = Math.round(calculatedTotal - parseFloat(currentInvoice.paidAmount || 0));
    setRemainingAmount(calculatedRemaining);

    // Calculate broker commission if applicable
    if (currentInvoice.brokerName && currentInvoice.brokerCommissionPercentage > 0) {
      const commission = Math.round((calculatedTotal * currentInvoice.brokerCommissionPercentage) / 100);
      setBrokerCommissionAmount(commission);
    } else {
      setBrokerCommissionAmount(0);
    }
  }, [currentInvoice.items, currentInvoice.labourTransportCost, currentInvoice.paidAmount, currentInvoice.brokerCommissionPercentage]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentInvoice(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    setCurrentItem(prev => ({
      ...prev,
      itemId: item._id || '',
      itemName: item.itemName
    }));
    setItemInput(item.itemName);
    setShowItemDropdown(false);
  };

  // Handle custom item input
  const handleItemInputChange = (e) => {
    const value = e.target.value;
    setItemInput(value);
    setCurrentItem(prev => ({
      ...prev,
      itemId: '',
      itemName: value
    }));
    setShowItemDropdown(true);
  };

  // Handle item form input changes
  const handleItemFormInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add item to invoice
  const handleAddItem = () => {
    if (!currentItem.itemName) {
      return;
    }

    // Add item to invoice items array
    setCurrentInvoice(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }));

    // Reset current item form
    setCurrentItem(initialItemState);
    setItemInput('');
  };

  // Remove item from invoice
  const handleRemoveItem = (index) => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Save new invoice
  const handleSaveInvoice = () => {
    if (editingIndex !== null) {
      // Update existing invoice
      const updatedInvoices = [...invoices];
      updatedInvoices[editingIndex] = {
        ...currentInvoice,
        total,
        remainingAmount,
        brokerCommissionAmount
      };
      setInvoices(updatedInvoices);
      setEditingIndex(null);
    } else {
      // Add new invoice
      setInvoices(prev => [
        ...prev,
        {
          ...currentInvoice,
          total,
          remainingAmount,
          brokerCommissionAmount
        }
      ]);
    }

    // Reset form
    resetForm();
  };

  // Edit an existing invoice
  const handleEditInvoice = (index) => {
    setCurrentInvoice(invoices[index]);
    setEditingIndex(index);
  };

  // Delete an invoice
  const handleDeleteInvoice = (index) => {
    setInvoices(prev => prev.filter((_, i) => i !== index));
  };

  // Reset the form
  const resetForm = () => {
    setCurrentInvoice(initialInvoiceData);
    setCurrentItem(initialItemState);
    setItemInput('');
    setShowItemDropdown(false);
    setSubtotal(0);
    setTotal(0);
    setRemainingAmount(0);
    setBrokerCommissionAmount(0);
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice =>
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.brokerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Fake Invoices</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by customer or broker name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length > 0 && (
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
                      Edit
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
      )}

      {/* Create/Edit Invoice Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {editingIndex !== null ? 'Edit Invoice' : 'Create New Invoice'}
        </h2>

        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerName">
              Customer Name
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={currentInvoice.customerName}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brokerName">
              Broker Name (Optional)
            </label>
            <input
              type="text"
              id="brokerName"
              name="brokerName"
              value={currentInvoice.brokerName}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="invoiceDate">
              Invoice Date
            </label>
            <input
              type="date"
              id="invoiceDate"
              name="invoiceDate"
              value={currentInvoice.invoiceDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {currentInvoice.brokerName && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brokerCommissionPercentage">
                Broker Commission (%)
              </label>
              <input
                type="number"
                id="brokerCommissionPercentage"
                name="brokerCommissionPercentage"
                value={currentInvoice.brokerCommissionPercentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Items</h3>

          {/* Items Table */}
          {currentInvoice.items.length > 0 && (
            <div className="overflow-x-auto mb-4">
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
                      Selling/kg
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentInvoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.grossWeight}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.netWeight}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.packagingCost}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.sellingPrice}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.totalPrice}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Item Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium mb-3 text-gray-700">Add Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div ref={itemRef} className="relative">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="itemInput">
                  Item Name
                </label>
                <input
                  type="text"
                  id="itemInput"
                  value={itemInput}
                  onChange={handleItemInputChange}
                  onClick={() => setShowItemDropdown(true)}
                  placeholder="Select or type item name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {showItemDropdown && filteredItems.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredItems.map(item => (
                      <div
                        key={item._id}
                        onClick={() => handleItemSelect(item)}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      >
                        {item.itemName}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={currentItem.quantity}
                  onChange={handleItemFormInputChange}
                  step="0.01"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grossWeight">
                  Gross Weight (kg)
                </label>
                <input
                  type="number"
                  id="grossWeight"
                  name="grossWeight"
                  value={currentItem.grossWeight}
                  onChange={handleItemFormInputChange}
                  step="0.01"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="netWeight">
                  Net Weight (kg)
                </label>
                <input
                  type="number"
                  id="netWeight"
                  name="netWeight"
                  value={currentItem.netWeight}
                  onChange={handleItemFormInputChange}
                  step="0.01"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="packagingCost">
                  Packaging Cost (PKR)
                </label>
                <input
                  type="number"
                  id="packagingCost"
                  name="packagingCost"
                  value={currentItem.packagingCost}
                  onChange={handleItemFormInputChange}
                  step="1"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sellingPrice">
                  Selling Price/kg (PKR)
                </label>
                <input
                  type="number"
                  id="sellingPrice"
                  name="sellingPrice"
                  value={currentItem.sellingPrice}
                  onChange={handleItemFormInputChange}
                  step="1"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalPrice">
                  Total Price (PKR)
                </label>
                <input
                  type="text"
                  id="totalPrice"
                  value={currentItem.totalPrice}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Invoice Summary</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="labourTransportCost">
                Labour/Transport Cost (PKR)
              </label>
              <input
                type="number"
                id="labourTransportCost"
                name="labourTransportCost"
                value={currentInvoice.labourTransportCost}
                onChange={handleInputChange}
                step="1"
                min="0"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paidAmount">
                Paid Amount (PKR)
              </label>
              <input
                type="number"
                id="paidAmount"
                name="paidAmount"
                value={currentInvoice.paidAmount}
                onChange={handleInputChange}
                step="1"
                min="0"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Subtotal:</span>
              <span>PKR {subtotal}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Labour/Transport:</span>
              <span>PKR {parseFloat(currentInvoice.labourTransportCost || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b font-bold">
              <span>Total:</span>
              <span>PKR {total}</span>
            </div>
            {currentInvoice.brokerName && currentInvoice.brokerCommissionPercentage > 0 && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Broker Commission ({currentInvoice.brokerCommissionPercentage}%):</span>
                <span>PKR {brokerCommissionAmount}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Paid Amount:</span>
              <span>PKR {parseFloat(currentInvoice.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold text-red-600">
              <span>Remaining Amount:</span>
              <span>PKR {remainingAmount}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveInvoice}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {editingIndex !== null ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FakeInvoices; 