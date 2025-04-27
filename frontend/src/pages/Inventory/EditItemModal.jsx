import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const EditItemModal = ({ isOpen, onClose, item, onItemUpdated }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    shopQuantity: '',
    shopNetWeight: '',
    shopGrossWeight: '',
    transferToCold: {
      quantity: '',
      netWeight: '',
      grossWeight: ''
    },
    transferToShop: {
      quantity: '',
      netWeight: '',
      grossWeight: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.itemName,
        shopQuantity: item.shopQuantity || '',
        shopNetWeight: item.shopNetWeight || '',
        shopGrossWeight: item.shopGrossWeight || '',
        transferToCold: {
          quantity: '',
          netWeight: '',
          grossWeight: ''
        },
        transferToShop: {
          quantity: '',
          netWeight: '',
          grossWeight: ''
        }
      });
    }
  }, [item]);

  const validateField = (name, value, type = 'shop') => {
    if (value === '') return '';

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return 'Value must be a positive number';
    }

    if (type === 'transfer') {
      if (name === 'quantity') {
        const maxQuantity = type === 'transferToCold' ? item.shopQuantity : item.coldQuantity;
        if (numValue > maxQuantity) {
          return `Cannot transfer more than available quantity (${maxQuantity})`;
        }
      } else if (name === 'netWeight') {
        const maxNetWeight = type === 'transferToCold' ? item.shopNetWeight : item.coldNetWeight;
        if (numValue > maxNetWeight) {
          return `Cannot transfer more than available net weight (${maxNetWeight})`;
        }
      } else if (name === 'grossWeight') {
        const maxGrossWeight = type === 'transferToCold' ? item.shopGrossWeight : item.coldGrossWeight;
        if (numValue > maxGrossWeight) {
          return `Cannot transfer more than available gross weight (${maxGrossWeight})`;
        }
      }
    }

    return '';
  };

  const validateTransferField = (field, value, transferType) => {
    if (value === '') return '';

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return 'Value must be a positive number';
    }

    if (transferType === 'transferToCold') {
      switch (field) {
        case 'quantity':
          if (numValue > item.shopQuantity) {
            return `Quantity must not exceed available shop quantity (${item.shopQuantity})`;
          }
          break;
        case 'netWeight':
          if (numValue > item.shopNetWeight) {
            return `Net weight must not exceed available shop net weight (${item.shopNetWeight})`;
          }
          break;
        case 'grossWeight':
          if (numValue > item.shopGrossWeight) {
            return `Gross weight must not exceed available shop gross weight (${item.shopGrossWeight})`;
          }
          break;
      }
    } else if (transferType === 'transferToShop') {
      switch (field) {
        case 'quantity':
          if (numValue > item.coldQuantity) {
            return `Quantity must not exceed available cold quantity (${item.coldQuantity})`;
          }
          break;
        case 'netWeight':
          if (numValue > item.coldNetWeight) {
            return `Net weight must not exceed available cold net weight (${item.coldNetWeight})`;
          }
          break;
        case 'grossWeight':
          if (numValue > item.coldGrossWeight) {
            return `Gross weight must not exceed available cold gross weight (${item.coldGrossWeight})`;
          }
          break;
      }
    }

    return '';
  };

  const handleInputChange = (e, type = 'shop', field = null) => {
    const { name, value } = e.target;

    if (type === 'shop') {
      // Handle shop fields directly
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      if (value !== '') {
        const error = validateField(name, value, type);
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    } else {
      // Handle transfer fields (nested structure)
      setFormData(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value
        }
      }));

      // Real-time validation for transfer fields
      const error = validateTransferField(field, value, type);
      setErrors(prev => ({
        ...prev,
        [`${type}.${field}`]: error
      }));
    }
  };

  const toggleDropdown = (dropdown) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
      // Reset the fields of the newly opened dropdown
      setFormData(prev => ({
        ...prev,
        [dropdown]: {
          quantity: '',
          netWeight: '',
          grossWeight: ''
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First update the basic item details
      const updatedItem = await api.put(`/items/${item.itemId}`, {
        itemName: formData.itemName,
        shopQuantity: formData.shopQuantity || 0,
        shopNetWeight: formData.shopNetWeight || 0,
        shopGrossWeight: formData.shopGrossWeight || 0
      });

      // Then handle transfers if any
      if (formData.transferToCold.quantity || formData.transferToCold.netWeight || formData.transferToCold.grossWeight) {
        await api.post(`/items/${item.itemId}/transfer-to-cold`, {
          quantity: parseFloat(formData.transferToCold.quantity) || 0,
          netWeight: parseFloat(formData.transferToCold.netWeight) || 0,
          grossWeight: parseFloat(formData.transferToCold.grossWeight) || 0
        });
      }

      if (formData.transferToShop.quantity || formData.transferToShop.netWeight || formData.transferToShop.grossWeight) {
        await api.post(`/items/${item.itemId}/transfer-to-shop`, {
          quantity: parseFloat(formData.transferToShop.quantity) || 0,
          netWeight: parseFloat(formData.transferToShop.netWeight) || 0,
          grossWeight: parseFloat(formData.transferToShop.grossWeight) || 0
        });
      }

      // Fetch the updated item
      const response = await api.get(`/items/${item.itemId}`);
      onItemUpdated(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.message || 'Failed to update item'
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Item</h2>

        <form onSubmit={handleSubmit}>
          {/* Basic Item Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Item Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Item Name</label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Shop Quantity</label>
                <input
                  type="number"
                  name="shopQuantity"
                  value={formData.shopQuantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
                {errors.shopQuantity && (
                  <span className="text-red-500 text-sm">{errors.shopQuantity}</span>
                )}
              </div>
              <div>
                <label className="block mb-1">Shop Net Weight</label>
                <input
                  type="number"
                  name="shopNetWeight"
                  value={formData.shopNetWeight}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
                {errors.shopNetWeight && (
                  <span className="text-red-500 text-sm">{errors.shopNetWeight}</span>
                )}
              </div>
              <div>
                <label className="block mb-1">Shop Gross Weight</label>
                <input
                  type="number"
                  name="shopGrossWeight"
                  value={formData.shopGrossWeight}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
                {errors.shopGrossWeight && (
                  <span className="text-red-500 text-sm">{errors.shopGrossWeight}</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Storage Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Current Storage Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border p-3 rounded">
                <h4 className="font-medium mb-2">Shop Storage</h4>
                <p>Quantity: {item.shopQuantity || 0}</p>
                <p>Net Weight: {item.shopNetWeight || 0}</p>
                <p>Gross Weight: {item.shopGrossWeight || 0}</p>
              </div>
              <div className="border p-3 rounded">
                <h4 className="font-medium mb-2">Cold Storage</h4>
                <p>Quantity: {item.coldQuantity || 0}</p>
                <p>Net Weight: {item.coldNetWeight || 0}</p>
                <p>Gross Weight: {item.coldGrossWeight || 0}</p>
              </div>
            </div>
          </div>

          {/* Transfer to Cold Storage Dropdown */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => toggleDropdown('transferToCold')}
              className="w-full text-left p-3 bg-gray-100 rounded-lg flex justify-between items-center"
            >
              <h3 className="text-lg font-semibold">Transfer to Cold Storage</h3>
              <span>{activeDropdown === 'transferToCold' ? '▼' : '▶'}</span>
            </button>
            {activeDropdown === 'transferToCold' && (
              <div className="mt-3 p-4 border rounded">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.transferToCold.quantity}
                      onChange={(e) => handleInputChange(e, 'transferToCold', 'quantity')}
                      className="w-full p-2 border rounded"
                    />
                    {errors['transferToCold.quantity'] && (
                      <span className="text-red-500 text-sm">{errors['transferToCold.quantity']}</span>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1">Net Weight</label>
                    <input
                      type="number"
                      value={formData.transferToCold.netWeight}
                      onChange={(e) => handleInputChange(e, 'transferToCold', 'netWeight')}
                      className="w-full p-2 border rounded"
                    />
                    {errors['transferToCold.netWeight'] && (
                      <span className="text-red-500 text-sm">{errors['transferToCold.netWeight']}</span>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1">Gross Weight</label>
                    <input
                      type="number"
                      value={formData.transferToCold.grossWeight}
                      onChange={(e) => handleInputChange(e, 'transferToCold', 'grossWeight')}
                      className="w-full p-2 border rounded"
                    />
                    {errors['transferToCold.grossWeight'] && (
                      <span className="text-red-500 text-sm">{errors['transferToCold.grossWeight']}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transfer to Shop Dropdown */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => toggleDropdown('transferToShop')}
              className="w-full text-left p-3 bg-gray-100 rounded-lg flex justify-between items-center"
            >
              <h3 className="text-lg font-semibold">Transfer to Shop</h3>
              <span>{activeDropdown === 'transferToShop' ? '▼' : '▶'}</span>
            </button>
            {activeDropdown === 'transferToShop' && (
              <div className="mt-3 p-4 border rounded">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.transferToShop.quantity}
                      onChange={(e) => handleInputChange(e, 'transferToShop', 'quantity')}
                      className="w-full p-2 border rounded"
                    />
                    {errors['transferToShop.quantity'] && (
                      <span className="text-red-500 text-sm">{errors['transferToShop.quantity']}</span>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1">Net Weight</label>
                    <input
                      type="number"
                      value={formData.transferToShop.netWeight}
                      onChange={(e) => handleInputChange(e, 'transferToShop', 'netWeight')}
                      className="w-full p-2 border rounded"
                    />
                    {errors['transferToShop.netWeight'] && (
                      <span className="text-red-500 text-sm">{errors['transferToShop.netWeight']}</span>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1">Gross Weight</label>
                    <input
                      type="number"
                      value={formData.transferToShop.grossWeight}
                      onChange={(e) => handleInputChange(e, 'transferToShop', 'grossWeight')}
                      className="w-full p-2 border rounded"
                    />
                    {errors['transferToShop.grossWeight'] && (
                      <span className="text-red-500 text-sm">{errors['transferToShop.grossWeight']}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="mb-4 text-red-500">{errors.submit}</div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal; 