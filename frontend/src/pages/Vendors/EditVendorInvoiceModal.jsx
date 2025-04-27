import React, { useState, useEffect, useRef } from 'react';
import { getVendors } from '../../services/vendorService';
import { getBrokers } from '../../services/brokerService';
import { getItems } from '../../services/itemService';
import { getVendorInvoiceById, updateVendorInvoice } from '../../services/vendorInvoiceService';
import '../../styles/print.css';

const EditVendorInvoiceModal = ({ invoiceId, onClose, onUpdate }) => {
  // Initial states
  const initialInvoiceData = {
    vendorId: '',
    vendorName: '',
    brokerId: '',
    brokerName: '',
    invoiceDate: '',
    dueDate: '',
    items: [],
    labourTransportCost: 0,
    payments: [],
    totalPaidAmount: 0,
    invoiceNumber: ''
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

  // State for invoice data
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);
  const [originalInvoiceData, setOriginalInvoiceData] = useState(null);

  // State for new item being added
  const [currentItem, setCurrentItem] = useState(initialItemState);

  // Reference data
  const [vendors, setVendors] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [items, setItems] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Autocomplete states
  const [itemInput, setItemInput] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const itemRef = useRef(null);

  // Calculated values
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Load all necessary data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vendorsData, brokersData, itemsData, invoiceData] = await Promise.all([
          getVendors(),
          getBrokers(),
          getItems(),
          getVendorInvoiceById(invoiceId)
        ]);

        setVendors(vendorsData);
        setBrokers(brokersData);
        setItems(itemsData);
        setFilteredItems(itemsData);

        // Ensure all invoiceData.items have their itemId as string
        if (invoiceData.items && Array.isArray(invoiceData.items)) {
          invoiceData.items = invoiceData.items.map(item => ({
            ...item,
            itemId: item.itemId ? String(item.itemId) : null
          }));
        }

        // Format dates for form inputs
        const formattedInvoice = {
          ...invoiceData,
          invoiceDate: new Date(invoiceData.invoiceDate).toISOString().split('T')[0],
          dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split('T')[0] : ''
        };

        setInvoiceData(formattedInvoice);
        // Make a deep copy to ensure we keep original state for comparison
        const originalDataCopy = JSON.parse(JSON.stringify(formattedInvoice));
        console.log('Setting original invoice data:', originalDataCopy);
        setOriginalInvoiceData(originalDataCopy);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoiceId]);

  // Calculate item total price whenever the item details change
  useEffect(() => {
    // Calculate packaging cost: quantity * packagingCost (as float)
    const packagingTotal = parseFloat(currentItem.quantity || 0) * parseFloat(currentItem.packagingCost || 0);

    // Calculate purchase cost: netWeight * purchasePrice (as float)
    const purchaseTotal = parseFloat(currentItem.netWeight || 0) * parseFloat(currentItem.purchasePrice || 0);

    // Sum them up
    const itemTotal = packagingTotal + purchaseTotal;

    // Update the item - note that monetary values are still rounded for display
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
    // Calculate subtotal from all items (keep as float for calculations)
    const itemsSubtotal = invoiceData.items.reduce((sum, item) =>
      sum + parseFloat(item.totalPrice || 0), 0);
    setSubtotal(itemsSubtotal);

    // Calculate total by adding labour/transport cost (keep as float)
    const calculatedTotal = itemsSubtotal + parseFloat(invoiceData.labourTransportCost || 0);
    setTotal(calculatedTotal);

    // Calculate remaining amount by subtracting paid amount (keep as float)
    const calculatedRemaining = calculatedTotal - parseFloat(invoiceData.totalPaidAmount || 0);
    setRemainingAmount(calculatedRemaining);
  }, [invoiceData.items, invoiceData.labourTransportCost, invoiceData.totalPaidAmount]);

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

  // Handle click outside for item dropdown
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

  // Handle item selection
  const handleItemSelect = (item) => {
    console.log('Selected item:', item);

    // Ensure we have the item ID as a string
    const itemId = item._id ? String(item._id) : '';

    setCurrentItem(prev => ({
      ...prev,
      itemId: itemId,
      itemName: item.itemName
    }));

    setItemInput(item.itemName);
    setShowItemDropdown(false);

    console.log('Current item after selection:', {
      ...currentItem,
      itemId: itemId,
      itemName: item.itemName
    });
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
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add item to invoice
  const handleAddItem = () => {
    if (!currentItem.itemName || !currentItem.quantity || !currentItem.netWeight || !currentItem.grossWeight) {
      alert('Please fill in all required item fields');
      return;
    }

    // Make sure we preserve itemId if it exists
    const itemToAdd = { ...currentItem };

    // Ensure we have consistent data types
    itemToAdd.quantity = parseFloat(itemToAdd.quantity || 0);
    itemToAdd.netWeight = parseFloat(itemToAdd.netWeight || 0);
    itemToAdd.grossWeight = parseFloat(itemToAdd.grossWeight || 0);
    itemToAdd.purchasePrice = parseFloat(itemToAdd.purchasePrice || 0);
    itemToAdd.packagingCost = parseFloat(itemToAdd.packagingCost || 0);

    // Total price will be re-calculated in the useEffect
    itemToAdd.totalPrice = itemToAdd.totalPrice || 0;

    // Add item to invoice items array
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, itemToAdd]
    }));

    // Reset current item form
    setCurrentItem(initialItemState);
    setItemInput('');
  };

  // Edit existing item
  const handleEditItem = (index) => {
    const itemToEdit = invoiceData.items[index];

    // Make sure to preserve the itemId and other fields
    setCurrentItem({
      ...itemToEdit,
      itemId: itemToEdit.itemId || '', // Ensure we keep the itemId
    });

    setItemInput(itemToEdit.itemName);

    // Remove the item from the list as we're editing it
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
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

    try {
      setSaving(true);
      setError(null);

      // Make sure we have the original items for inventory comparison
      if (!originalInvoiceData || !originalInvoiceData.items || !Array.isArray(originalInvoiceData.items)) {
        setError('Original invoice data is missing or invalid');
        setSaving(false);
        return;
      }

      // Ensure all item amounts are correctly processed as numbers
      const processedItems = invoiceData.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity || 0),
        netWeight: parseFloat(item.netWeight || 0),
        grossWeight: parseFloat(item.grossWeight || 0),
        packagingCost: parseFloat(item.packagingCost || 0),
        purchasePrice: parseFloat(item.purchasePrice || 0),
        totalPrice: parseFloat(item.totalPrice || 0),
        // Ensure itemId is a string if it exists
        itemId: item.itemId ? String(item.itemId) : null
      }));

      // Ensure original items are also properly formatted
      const processedOriginalItems = originalInvoiceData.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity || 0),
        netWeight: parseFloat(item.netWeight || 0),
        grossWeight: parseFloat(item.grossWeight || 0),
        // Ensure itemId is a string if it exists
        itemId: item.itemId ? String(item.itemId) : null
      }));

      // Prepare inventory changes data to be sent to backend
      const updatedInvoiceData = {
        ...invoiceData,
        items: processedItems,
        originalItems: processedOriginalItems,
        // Include calculated totals from local state
        subtotal: subtotal,
        total: total,
        remainingAmount: remainingAmount
      };

      console.log('Sending update with originalItems:', updatedInvoiceData.originalItems.length);
      console.log('New items:', updatedInvoiceData.items.length);
      console.log('Updated totals:', {
        subtotal: subtotal,
        total: total,
        remainingAmount: remainingAmount
      });

      // Update the invoice through the API
      await updateVendorInvoice(invoiceId, updatedInvoiceData);

      // Notify parent component that update is complete
      if (onUpdate) onUpdate();

      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(`Failed to update invoice: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceData.invoiceNumber}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Vendor
                </label>
                <input
                  type="text"
                  value={invoiceData.vendorName}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Broker
                </label>
                <input
                  type="text"
                  value={invoiceData.brokerName || 'N/A'}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceData.invoiceDate}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
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
                  value={invoiceData.dueDate || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min={invoiceData.invoiceDate} // Ensure due date is after invoice date
                />
              </div>
            </div>

            {/* Items Section */}
            <div>
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
                          Actions
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
                            {parseFloat(item.totalPrice).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditItem(index)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </div>
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
                  {currentItem.itemId ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>

            {/* Invoice Summary */}
            <div>
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
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalPaidAmount">
                    Total Paid Amount (PKR)
                  </label>
                  <input
                    type="number"
                    id="totalPaidAmount"
                    name="totalPaidAmount"
                    value={invoiceData.totalPaidAmount}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
                  />
                  <p className="text-xs italic text-gray-500 mt-1">This amount is calculated automatically from the payment history. To add a payment, use the Update Payment button from the Vendor Payables page.</p>
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
                  <span>PKR {parseFloat(invoiceData.totalPaidAmount || 0).toFixed(2)}</span>
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
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Invoice'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditVendorInvoiceModal;
