import React, { useState, useEffect, useRef } from 'react';
import { getCommissioners } from '../../services/commissionerService';
import { getItems } from '../../services/itemService';
import { createCommissionerInvoice } from '../../services/commissionerInvoiceService';
import { useNavigate } from 'react-router-dom';
import CommissionerInvoicePreviewModal from './CommissionerInvoicePreviewModal';

const AddCommissionSheet = () => {
  const navigate = useNavigate();

  // Initial form state for reset
  const initialInvoiceData = {
    commissionerId: '',
    commissionerName: '',
    buyerName: '',
    customerName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    commissionerPercentage: '',
    items: [],
    paidAmount: 0
  };

  const initialItemState = {
    itemId: '',
    itemName: '',
    quantity: '',
    grossWeight: '',
    netWeight: '',
    packagingCost: '',
    salePrice: '',
    totalPrice: 0
  };

  // Form states
  const [commissioners, setCommissioners] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Autocomplete states
  const [commissionerInput, setCommissionerInput] = useState('');
  const [itemInput, setItemInput] = useState('');
  const [filteredCommissioners, setFilteredCommissioners] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showCommissionerDropdown, setShowCommissionerDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Refs for dropdown click away detection
  const commissionerRef = useRef(null);
  const itemRef = useRef(null);

  // Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Invoice data
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);

  // Current item being added
  const [currentItem, setCurrentItem] = useState(initialItemState);

  // Calculated values
  const [total, setTotal] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [commissionersData, itemsData] = await Promise.all([
          getCommissioners(),
          getItems()
        ]);

        setCommissioners(commissionersData);
        setItems(itemsData);
        setFilteredCommissioners(commissionersData);
        setFilteredItems(itemsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate item total price whenever the item details change
  useEffect(() => {
    const packagingTotal = parseFloat(currentItem.quantity || 0) * parseFloat(currentItem.packagingCost || 0);
    const saleTotal = parseFloat(currentItem.netWeight || 0) * parseFloat(currentItem.salePrice || 0);
    const itemTotal = packagingTotal + saleTotal;

    setCurrentItem(prev => ({
      ...prev,
      totalPrice: itemTotal
    }));
  }, [
    currentItem.quantity,
    currentItem.netWeight,
    currentItem.packagingCost,
    currentItem.salePrice
  ]);

  // Calculate invoice totals whenever items or percentage changes
  useEffect(() => {
    const calculatedTotal = invoiceData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotal(calculatedTotal);

    const percentage = parseFloat(invoiceData.commissionerPercentage || 0);
    const calculatedCommissionAmount = percentage > 0 ? (calculatedTotal * percentage / 100) : 0;
    setCommissionAmount(Math.round(calculatedCommissionAmount));

    const calculatedRemaining = Math.max(0, Math.round(calculatedCommissionAmount) - parseFloat(invoiceData.paidAmount || 0));
    setRemainingAmount(calculatedRemaining);
  }, [invoiceData.items, invoiceData.commissionerPercentage, invoiceData.paidAmount]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commissionerRef.current && !commissionerRef.current.contains(event.target)) {
        setShowCommissionerDropdown(false);
      }
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter commissioners based on input
  useEffect(() => {
    if (commissionerInput) {
      const filtered = commissioners.filter(commissioner =>
        commissioner.commissionerName.toLowerCase().includes(commissionerInput.toLowerCase())
      );
      setFilteredCommissioners(filtered);
    } else {
      setFilteredCommissioners(commissioners);
    }
  }, [commissionerInput, commissioners]);

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

  // Handle commissioner selection
  const handleCommissionerSelect = (commissioner) => {
    setInvoiceData(prev => ({
      ...prev,
      commissionerId: commissioner._id || '',
      commissionerName: commissioner.commissionerName
    }));
    setCommissionerInput(commissioner.commissionerName);
    setShowCommissionerDropdown(false);
  };

  // Handle custom commissioner input
  const handleCommissionerInputChange = (e) => {
    const value = e.target.value;
    setCommissionerInput(value);
    setInvoiceData(prev => ({
      ...prev,
      commissionerId: '',
      commissionerName: value
    }));
    setShowCommissionerDropdown(true);
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'commissionerId') {
      const selectedCommissioner = commissioners.find(commissioner => commissioner._id === value);
      setInvoiceData(prev => ({
        ...prev,
        commissionerId: value,
        commissionerName: selectedCommissioner ? selectedCommissioner.commissionerName : ''
      }));
    } else {
      setInvoiceData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add item to invoice
  const handleAddItem = () => {
    if (!currentItem.itemName || !currentItem.quantity || !currentItem.netWeight || !currentItem.grossWeight) {
      alert('Please fill in all required item fields');
      return;
    }

    // Add item to invoice items array
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }));

    // Reset current item form
    setCurrentItem({
      itemId: '',
      itemName: '',
      quantity: '',
      grossWeight: '',
      netWeight: '',
      packagingCost: '',
      salePrice: '',
      totalPrice: 0
    });
    setItemInput('');
  };

  // Remove item from invoice
  const handleRemoveItem = (index) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!invoiceData.commissionerName || !invoiceData.invoiceDate || !invoiceData.commissionerPercentage || invoiceData.items.length === 0) {
      alert('Please fill in all required fields and add at least one item');
      return;
    }

    // Ensure percentage is between 0 and 100
    const percentage = parseFloat(invoiceData.commissionerPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      alert('Commissioner percentage must be a number between 0 and 100');
      return;
    }

    // Ensure paid amount is not greater than commissioner amount
    if (parseFloat(invoiceData.paidAmount) > commissionAmount) {
      alert(`Paid amount cannot be greater than the commissioner amount (${commissionAmount})`);
      return;
    }

    // Show preview modal instead of submitting directly
    setShowPreviewModal(true);
  };

  // Handle invoice save
  const handleInvoiceSaved = () => {
    // Reset form data
    resetForm();

    // Navigate to commissioners page after invoice is saved
    setTimeout(() => {
      navigate('/commissioners');
    }, 2000);
  };

  // Reset the form
  const resetForm = () => {
    setInvoiceData(initialInvoiceData);
    setCurrentItem(initialItemState);
    setCommissionerInput('');
    setItemInput('');
    setShowCommissionerDropdown(false);
    setShowItemDropdown(false);
    setTotal(0);
    setCommissionAmount(0);
    setRemainingAmount(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Commission Sheet</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div ref={commissionerRef} className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="commissionerInput">
              Commissioner *
            </label>
            <input
              type="text"
              id="commissionerInput"
              value={commissionerInput}
              onChange={handleCommissionerInputChange}
              onClick={() => setShowCommissionerDropdown(true)}
              placeholder="Select or type commissioner name"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {showCommissionerDropdown && filteredCommissioners.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredCommissioners.map(commissioner => (
                  <div
                    key={commissioner._id}
                    onClick={() => handleCommissionerSelect(commissioner)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {commissioner.commissionerName} {commissioner.city && `- ${commissioner.city}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="invoiceDate">
              Commission Date *
            </label>
            <input
              type="date"
              id="invoiceDate"
              name="invoiceDate"
              value={invoiceData.invoiceDate}
              onChange={handleInputChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="buyerName">
              Buyer Name (Optional)
            </label>
            <input
              type="text"
              id="buyerName"
              name="buyerName"
              value={invoiceData.buyerName}
              onChange={handleInputChange}
              placeholder="Enter buyer name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerName">
              Customer Name (Optional)
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={invoiceData.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="commissionerPercentage">
              Commissioner Percentage (%) *
            </label>
            <input
              type="number"
              id="commissionerPercentage"
              name="commissionerPercentage"
              value={invoiceData.commissionerPercentage}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Items</h2>

          {/* Items Table */}
          {invoiceData.items.length > 0 && (
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
                      Sale Price/kg
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
                  {invoiceData.items.map((item, index) => (
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
                        {item.salePrice}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.totalPrice.toFixed(2)}
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
            <h3 className="text-lg font-medium mb-3 text-gray-700">Add Item</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div ref={itemRef} className="relative">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="itemInput">
                  Item *
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
                  Quantity *
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
                  Gross Weight (kg) *
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
                  Net Weight (kg) *
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="salePrice">
                  Sale Price/kg (PKR)
                </label>
                <input
                  type="number"
                  id="salePrice"
                  name="salePrice"
                  value={currentItem.salePrice}
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
                  value={currentItem.totalPrice.toFixed(2)}
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
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Commission Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paidAmount">
                Paid Amount (PKR)
              </label>
              <input
                type="number"
                id="paidAmount"
                name="paidAmount"
                value={invoiceData.paidAmount}
                onChange={handleInputChange}
                step="1"
                min="0"
                max={commissionAmount}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {commissionAmount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Must not exceed commissioner amount: {commissionAmount.toFixed(2)} PKR
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Total:</span>
              <span>PKR {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Commissioner Percentage:</span>
              <span>{invoiceData.commissionerPercentage || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b font-bold">
              <span>Commissioner Amount:</span>
              <span>PKR {commissionAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Paid Amount:</span>
              <span>PKR {parseFloat(invoiceData.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold text-red-600">
              <span>Remaining Amount:</span>
              <span>PKR {remainingAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/commissioners')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Preview Commission Sheet
          </button>
        </div>
      </form>

      {/* Invoice Preview Modal */}
      {showPreviewModal && (
        <CommissionerInvoicePreviewModal
          invoice={{
            ...invoiceData,
            commissionerAmount: commissionAmount,
            total: total,
            remainingAmount: remainingAmount
          }}
          onClose={() => setShowPreviewModal(false)}
          onSave={handleInvoiceSaved}
        />
      )}
    </div>
  );
};

export default AddCommissionSheet; 