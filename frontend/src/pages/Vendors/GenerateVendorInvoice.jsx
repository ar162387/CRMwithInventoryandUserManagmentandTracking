import React, { useState, useEffect, useRef } from 'react';
import { getVendors } from '../../services/vendorService';
import { getBrokers } from '../../services/brokerService';
import { getItems } from '../../services/itemService';
import { createVendorInvoice } from '../../services/vendorInvoiceService';
import { useNavigate } from 'react-router-dom';
import VendorInvoicePreviewModal from './VendorInvoicePreviewModal';

const GenerateVendorInvoice = () => {
  const navigate = useNavigate();

  // Initial form state for reset
  const initialInvoiceData = {
    vendorId: '',
    vendorName: '',
    brokerId: '',
    brokerName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
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
    purchasePrice: '',
    totalPrice: 0,
    storageType: 'shop'
  };

  // Form states
  const [vendors, setVendors] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Autocomplete states
  const [vendorInput, setVendorInput] = useState('');
  const [brokerInput, setBrokerInput] = useState('');
  const [itemInput, setItemInput] = useState('');
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [filteredBrokers, setFilteredBrokers] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Refs for dropdown click away detection
  const vendorRef = useRef(null);
  const brokerRef = useRef(null);
  const itemRef = useRef(null);

  // Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Invoice data
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);

  // Current item being added
  const [currentItem, setCurrentItem] = useState(initialItemState);

  // Calculated values
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vendorsData, brokersData, itemsData] = await Promise.all([
          getVendors(),
          getBrokers(),
          getItems()
        ]);

        setVendors(vendorsData);
        setBrokers(brokersData);
        setItems(itemsData);
        setFilteredVendors(vendorsData);
        setFilteredBrokers(brokersData);
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
    const purchaseTotal = parseFloat(currentItem.netWeight || 0) * parseFloat(currentItem.purchasePrice || 0);
    const itemTotal = packagingTotal + purchaseTotal;

    setCurrentItem(prev => ({
      ...prev,
      totalPrice: itemTotal
    }));
  }, [
    currentItem.quantity,
    currentItem.netWeight,
    currentItem.packagingCost,
    currentItem.purchasePrice
  ]);

  // Calculate invoice totals whenever items or labour cost changes
  useEffect(() => {
    const itemsSubtotal = invoiceData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setSubtotal(itemsSubtotal);

    const calculatedTotal = itemsSubtotal + parseFloat(invoiceData.labourTransportCost || 0);
    setTotal(calculatedTotal);

    const calculatedRemaining = calculatedTotal - parseFloat(invoiceData.paidAmount || 0);
    setRemainingAmount(calculatedRemaining);
  }, [invoiceData.items, invoiceData.labourTransportCost, invoiceData.paidAmount]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorRef.current && !vendorRef.current.contains(event.target)) {
        setShowVendorDropdown(false);
      }
      if (brokerRef.current && !brokerRef.current.contains(event.target)) {
        setShowBrokerDropdown(false);
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

  // Filter vendors based on input
  useEffect(() => {
    if (vendorInput) {
      const filtered = vendors.filter(vendor =>
        vendor.vendorName.toLowerCase().includes(vendorInput.toLowerCase())
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(vendors);
    }
  }, [vendorInput, vendors]);

  // Filter brokers based on input
  useEffect(() => {
    if (brokerInput) {
      const filtered = brokers.filter(broker =>
        broker.brokerName.toLowerCase().includes(brokerInput.toLowerCase())
      );
      setFilteredBrokers(filtered);
    } else {
      setFilteredBrokers(brokers);
    }
  }, [brokerInput, brokers]);

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

  // Handle vendor selection
  const handleVendorSelect = (vendor) => {
    setInvoiceData(prev => ({
      ...prev,
      vendorId: vendor._id || '',
      vendorName: vendor.vendorName
    }));
    setVendorInput(vendor.vendorName);
    setShowVendorDropdown(false);
  };

  // Handle custom vendor input
  const handleVendorInputChange = (e) => {
    const value = e.target.value;
    setVendorInput(value);
    setInvoiceData(prev => ({
      ...prev,
      vendorId: '',
      vendorName: value
    }));
    setShowVendorDropdown(true);
  };

  // Handle broker selection
  const handleBrokerSelect = (broker) => {
    setInvoiceData(prev => ({
      ...prev,
      brokerId: broker._id || '',
      brokerName: broker.brokerName
    }));
    setBrokerInput(broker.brokerName);
    setShowBrokerDropdown(false);
  };

  // Handle custom broker input
  const handleBrokerInputChange = (e) => {
    const value = e.target.value;
    setBrokerInput(value);
    setInvoiceData(prev => ({
      ...prev,
      brokerId: '',
      brokerName: value
    }));
    setShowBrokerDropdown(true);
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

    if (name === 'vendorId') {
      const selectedVendor = vendors.find(vendor => vendor._id === value);
      setInvoiceData(prev => ({
        ...prev,
        vendorId: value,
        vendorName: selectedVendor ? selectedVendor.vendorName : ''
      }));
    } else if (name === 'brokerId') {
      const selectedBroker = brokers.find(broker => broker._id === value);
      setInvoiceData(prev => ({
        ...prev,
        brokerId: value,
        brokerName: selectedBroker ? selectedBroker.brokerName : ''
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
      purchasePrice: '',
      totalPrice: 0,
      storageType: 'shop'
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

    if (!invoiceData.vendorName || !invoiceData.invoiceDate || invoiceData.items.length === 0) {
      alert('Please fill in all required fields and add at least one item');
      return;
    }

    // Validate due date if provided
    if (invoiceData.dueDate) {
      const invoiceDate = new Date(invoiceData.invoiceDate);
      const dueDate = new Date(invoiceData.dueDate);

      if (dueDate <= invoiceDate) {
        alert('Due date must be greater than the invoice date');
        return;
      }
    }

    // Show preview modal instead of submitting directly
    setShowPreviewModal(true);
  };

  // Handle invoice save
  const handleInvoiceSaved = () => {
    // Reset form data
    resetForm();

    // Navigate to vendors page after invoice is saved
    setTimeout(() => {
      navigate('/vendors');
    }, 2000);
  };

  // Reset the form
  const resetForm = () => {
    setInvoiceData(initialInvoiceData);
    setCurrentItem(initialItemState);
    setVendorInput('');
    setBrokerInput('');
    setItemInput('');
    setShowVendorDropdown(false);
    setShowBrokerDropdown(false);
    setShowItemDropdown(false);
    setSubtotal(0);
    setTotal(0);
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Generate Vendor Invoice</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div ref={vendorRef} className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vendorInput">
              Vendor *
            </label>
            <input
              type="text"
              id="vendorInput"
              value={vendorInput}
              onChange={handleVendorInputChange}
              onClick={() => setShowVendorDropdown(true)}
              placeholder="Select or type vendor name"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {showVendorDropdown && filteredVendors.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredVendors.map(vendor => (
                  <div
                    key={vendor._id}
                    onClick={() => handleVendorSelect(vendor)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {vendor.vendorName} - {vendor.city}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div ref={brokerRef} className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brokerInput">
              Broker (Optional)
            </label>
            <input
              type="text"
              id="brokerInput"
              value={brokerInput}
              onChange={handleBrokerInputChange}
              onClick={() => setShowBrokerDropdown(true)}
              placeholder="Select or type broker name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {showBrokerDropdown && filteredBrokers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredBrokers.map(broker => (
                  <div
                    key={broker._id}
                    onClick={() => handleBrokerSelect(broker)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {broker.brokerName} - {broker.city}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="invoiceDate">
              Invoice Date *
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
              Due Date (Optional)
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={invoiceData.dueDate}
              onChange={handleInputChange}
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
                      Price/kg
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
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
                        {item.purchasePrice}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.storageType}
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="storageType">
                  Storage Type *
                </label>
                <select
                  id="storageType"
                  name="storageType"
                  value={currentItem.storageType}
                  onChange={handleItemFormInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="shop">Shop</option>
                  <option value="cold">Cold Storage</option>
                </select>
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purchasePrice">
                  Purchase Price/kg (PKR)
                </label>
                <input
                  type="number"
                  id="purchasePrice"
                  name="purchasePrice"
                  value={currentItem.purchasePrice}
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
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Invoice Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="labourTransportCost">
                Labour/Transport Cost (PKR)
              </label>
              <input
                type="number"
                id="labourTransportCost"
                name="labourTransportCost"
                value={invoiceData.labourTransportCost}
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
                value={invoiceData.paidAmount}
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
              <span>PKR {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Labour/Transport:</span>
              <span>PKR {parseFloat(invoiceData.labourTransportCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b font-bold">
              <span>Total:</span>
              <span>PKR {total.toFixed(2)}</span>
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
            onClick={() => navigate('/vendors')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Preview Invoice
          </button>
        </div>
      </form>

      {/* Invoice Preview Modal */}
      {showPreviewModal && (
        <VendorInvoicePreviewModal
          invoice={invoiceData}
          onClose={() => setShowPreviewModal(false)}
          onSave={handleInvoiceSaved}
        />
      )}
    </div>
  );
};

export default GenerateVendorInvoice; 