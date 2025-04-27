import React, { useState, useEffect, useRef } from 'react';
import { getCustomers } from '../../services/customerService';
import { getBrokers } from '../../services/brokerService';
import { getItems } from '../../services/itemService';
import { createCustomerInvoice } from '../../services/customerInvoiceService';
import { useNavigate } from 'react-router-dom';
import CustomerInvoicePreviewModal from './CustomerInvoicePreviewModal';

const GenerateCustomerInvoice = () => {
  const navigate = useNavigate();

  // Initial form state for reset
  const initialInvoiceData = {
    customerId: '',
    customerName: '',
    brokerId: '',
    brokerName: '',
    brokerCommissionPercentage: 0,
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
    sellingPrice: '',
    totalPrice: 0
  };

  // Form states
  const [customers, setCustomers] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Autocomplete states
  const [customerInput, setCustomerInput] = useState('');
  const [brokerInput, setBrokerInput] = useState('');
  const [itemInput, setItemInput] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filteredBrokers, setFilteredBrokers] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Inventory tracking
  const [availableInventory, setAvailableInventory] = useState({});
  const [currentItemValidation, setCurrentItemValidation] = useState({
    isValid: true,
    message: ''
  });

  // Refs for dropdown click away detection
  const customerRef = useRef(null);
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
  const [brokerCommissionAmount, setBrokerCommissionAmount] = useState(0);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersData, brokersData, itemsData] = await Promise.all([
          getCustomers(),
          getBrokers(),
          getItems()
        ]);

        setCustomers(customersData);
        setBrokers(brokersData);
        setItems(itemsData);
        setFilteredCustomers(customersData);
        setFilteredBrokers(brokersData);
        setFilteredItems(itemsData);

        // Initialize available inventory
        const inventory = {};
        itemsData.forEach(item => {
          inventory[item._id] = {
            id: item._id,
            name: item.itemName,
            shopQuantity: item.shopQuantity,
            shopNetWeight: item.shopNetWeight,
            shopGrossWeight: item.shopGrossWeight,
            originalShopQuantity: item.shopQuantity,
            originalShopNetWeight: item.shopNetWeight,
            originalShopGrossWeight: item.shopGrossWeight
          };
        });
        setAvailableInventory(inventory);

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
    const sellingTotal = parseFloat(currentItem.netWeight || 0) * parseFloat(currentItem.sellingPrice || 0);
    const itemTotal = Math.round(packagingTotal + sellingTotal);

    setCurrentItem(prev => ({
      ...prev,
      totalPrice: itemTotal
    }));

    // Validate current item against available inventory
    validateCurrentItem();
  }, [
    currentItem.quantity,
    currentItem.netWeight,
    currentItem.grossWeight,
    currentItem.packagingCost,
    currentItem.sellingPrice,
    currentItem.itemId
  ]);

  // Calculate invoice totals whenever items or labour cost changes
  useEffect(() => {
    const itemsSubtotal = invoiceData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setSubtotal(Math.round(itemsSubtotal));

    const calculatedTotal = Math.round(itemsSubtotal + parseFloat(invoiceData.labourTransportCost || 0));
    setTotal(calculatedTotal);

    const calculatedRemaining = Math.round(calculatedTotal - parseFloat(invoiceData.paidAmount || 0));
    setRemainingAmount(calculatedRemaining);

    // Calculate broker commission if applicable
    if (invoiceData.brokerName && invoiceData.brokerCommissionPercentage > 0) {
      const commission = Math.round((calculatedTotal * invoiceData.brokerCommissionPercentage) / 100);
      setBrokerCommissionAmount(commission);
    } else {
      setBrokerCommissionAmount(0);
    }
  }, [invoiceData.items, invoiceData.labourTransportCost, invoiceData.paidAmount, invoiceData.brokerCommissionPercentage]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerRef.current && !customerRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
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

  // Filter customers based on input
  useEffect(() => {
    if (customerInput) {
      const filtered = customers.filter(customer =>
        customer.customerName.toLowerCase().includes(customerInput.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerInput, customers]);

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

  // Update available inventory when invoice items change
  useEffect(() => {
    // Reset inventory to original values
    const resetInventory = {};
    Object.values(availableInventory).forEach(item => {
      resetInventory[item.id] = {
        ...item,
        shopQuantity: item.originalShopQuantity,
        shopNetWeight: item.originalShopNetWeight,
        shopGrossWeight: item.originalShopGrossWeight
      };
    });

    // Subtract quantities from inventory for each invoice item
    const updatedInventory = { ...resetInventory };
    invoiceData.items.forEach(item => {
      if (item.itemId && updatedInventory[item.itemId]) {
        updatedInventory[item.itemId].shopQuantity -= parseFloat(item.quantity || 0);
        updatedInventory[item.itemId].shopNetWeight -= parseFloat(item.netWeight || 0);
        updatedInventory[item.itemId].shopGrossWeight -= parseFloat(item.grossWeight || 0);
      }
    });

    setAvailableInventory(updatedInventory);

    // Revalidate current item if it's being edited
    if (currentItem.itemId) {
      validateCurrentItem();
    }
  }, [invoiceData.items]);

  // Validate current item against available inventory
  const validateCurrentItem = () => {
    if (!currentItem.itemId || !availableInventory[currentItem.itemId]) {
      setCurrentItemValidation({ isValid: true, message: '' });
      return;
    }

    const item = availableInventory[currentItem.itemId];
    const quantity = parseFloat(currentItem.quantity || 0);
    const netWeight = parseFloat(currentItem.netWeight || 0);
    const grossWeight = parseFloat(currentItem.grossWeight || 0);

    if (quantity <= 0 || netWeight <= 0 || grossWeight <= 0) {
      setCurrentItemValidation({ isValid: true, message: '' });
      return;
    }

    if (quantity > item.shopQuantity) {
      setCurrentItemValidation({
        isValid: false,
        message: `Not enough quantity available. Only ${item.shopQuantity.toFixed(2)} units left.`
      });
      return;
    }

    if (netWeight > item.shopNetWeight) {
      setCurrentItemValidation({
        isValid: false,
        message: `Not enough net weight available. Only ${item.shopNetWeight.toFixed(2)} kg left.`
      });
      return;
    }

    if (grossWeight > item.shopGrossWeight) {
      setCurrentItemValidation({
        isValid: false,
        message: `Not enough gross weight available. Only ${item.shopGrossWeight.toFixed(2)} kg left.`
      });
      return;
    }

    setCurrentItemValidation({ isValid: true, message: '' });
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setInvoiceData(prev => ({
      ...prev,
      customerId: customer._id || '',
      customerName: customer.customerName
    }));
    setCustomerInput(customer.customerName);
    setShowCustomerDropdown(false);
  };

  // Handle custom customer input
  const handleCustomerInputChange = (e) => {
    const value = e.target.value;
    setCustomerInput(value);
    setInvoiceData(prev => ({
      ...prev,
      customerId: '',
      customerName: value
    }));
    setShowCustomerDropdown(true);
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

    if (name === 'customerId') {
      const selectedCustomer = customers.find(customer => customer._id === value);
      setInvoiceData(prev => ({
        ...prev,
        customerId: value,
        customerName: selectedCustomer ? selectedCustomer.customerName : ''
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

    if (!currentItemValidation.isValid) {
      alert(currentItemValidation.message);
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
      sellingPrice: '',
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

    if (!invoiceData.customerName || !invoiceData.invoiceDate || invoiceData.items.length === 0) {
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

    // Navigate to customers page after invoice is saved
    setTimeout(() => {
      navigate('/customers');
    }, 2000);
  };

  // Reset the form
  const resetForm = () => {
    setInvoiceData(initialInvoiceData);
    setCurrentItem(initialItemState);
    setCustomerInput('');
    setBrokerInput('');
    setItemInput('');
    setShowCustomerDropdown(false);
    setShowBrokerDropdown(false);
    setShowItemDropdown(false);
    setSubtotal(0);
    setTotal(0);
    setRemainingAmount(0);
    setBrokerCommissionAmount(0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Generate Customer Invoice</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div ref={customerRef} className="relative">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerInput">
                Customer *
              </label>
              <input
                type="text"
                id="customerInput"
                value={customerInput}
                onChange={handleCustomerInputChange}
                onClick={() => setShowCustomerDropdown(true)}
                placeholder="Select or type customer name"
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer._id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      {customer.customerName} - {customer.city}
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

            {invoiceData.brokerName && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brokerCommissionPercentage">
                  Broker Commission (%)
                </label>
                <input
                  type="number"
                  id="brokerCommissionPercentage"
                  name="brokerCommissionPercentage"
                  value={invoiceData.brokerCommissionPercentage}
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
                          {item.itemName} {item.shopQuantity <= 0 ? '(Out of Stock)' : ''}
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

                {/* Available inventory information */}
                {currentItem.itemId && availableInventory[currentItem.itemId] && (
                  <div className="col-span-full">
                    <div className="text-sm bg-blue-50 border border-blue-200 p-2 rounded">
                      <p className="font-semibold">Available Stock:</p>
                      <p>Quantity: {availableInventory[currentItem.itemId].shopQuantity.toFixed(2)}</p>
                      <p>Net Weight: {availableInventory[currentItem.itemId].shopNetWeight.toFixed(2)} kg</p>
                      <p>Gross Weight: {availableInventory[currentItem.itemId].shopGrossWeight.toFixed(2)} kg</p>
                    </div>
                  </div>
                )}

                {/* Validation messages */}
                {!currentItemValidation.isValid && (
                  <div className="col-span-full text-red-600 text-sm mt-1">
                    {currentItemValidation.message}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={!currentItemValidation.isValid || !currentItem.itemName || !currentItem.quantity || !currentItem.netWeight || !currentItem.grossWeight}
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
                <span>PKR {subtotal}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Labour/Transport:</span>
                <span>PKR {parseFloat(invoiceData.labourTransportCost || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b font-bold">
                <span>Total:</span>
                <span>PKR {total}</span>
              </div>
              {invoiceData.brokerName && invoiceData.brokerCommissionPercentage > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Broker Commission ({invoiceData.brokerCommissionPercentage}%):</span>
                  <span>PKR {brokerCommissionAmount}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Paid Amount:</span>
                <span>PKR {parseFloat(invoiceData.paidAmount || 0)}</span>
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
              onClick={() => navigate('/customers')}
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
      )}

      {/* Invoice Preview Modal */}
      {showPreviewModal && (
        <CustomerInvoicePreviewModal
          invoice={invoiceData}
          onClose={() => setShowPreviewModal(false)}
          onSave={handleInvoiceSaved}
        />
      )}
    </div>
  );
};

export default GenerateCustomerInvoice; 