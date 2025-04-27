import React, { useState, useEffect } from 'react';
import { updateVendor } from '../../services/vendorService';

const EditVendorModal = ({ vendor, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    vendorName: '',
    phoneNumber: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set form data when the vendor prop changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        vendorName: vendor.vendorName || '',
        phoneNumber: vendor.phoneNumber || '',
        city: vendor.city || ''
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate vendorName (required field)
    if (!formData.vendorName.trim()) {
      setError('Vendor Name is required');
      return;
    }

    try {
      setLoading(true);
      await updateVendor(vendor._id, formData);
      setError(null);
      onSave(); // Close modal and refresh list
    } catch (err) {
      console.error('Error updating vendor:', err);
      setError(err.response?.data?.message || 'Failed to update vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Edit Vendor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p>{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vendorName">
                Vendor Name *
              </label>
              <input
                type="text"
                id="vendorName"
                name="vendorName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.vendorName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Updating...
                </div>
              ) : (
                'Update Vendor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVendorModal; 