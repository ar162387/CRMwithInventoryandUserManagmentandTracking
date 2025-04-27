import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const BalanceEntryModal = ({ isOpen, onClose, onSave, editingEntry = null }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    type: 'addition'
  });

  const [errors, setErrors] = useState({});

  // When editing entry changes, update form data
  useEffect(() => {
    if (editingEntry) {
      setFormData({
        amount: editingEntry.amount,
        date: new Date(editingEntry.date).toISOString().split('T')[0],
        remarks: editingEntry.remarks,
        type: editingEntry.type
      });
    } else {
      // Reset form when not editing
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        type: 'addition'
      });
    }
  }, [editingEntry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is filled
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.remarks.trim()) {
      newErrors.remarks = 'Remarks are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      onSave({
        ...formData,
        amount: Number(formData.amount)
      });
    } else {
      toast.error('Please fill all required fields correctly');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingEntry ? 'Edit Balance Entry' : 'Add Balance Entry'}
                </h3>

                <div className="mt-4">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="addition">Addition</option>
                        <option value="subtraction">Subtraction</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount (Rupees)
                      </label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md ${errors.amount ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                        min="0.01"
                        step="0.01"
                      />
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md ${errors.date ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                        Remarks
                      </label>
                      <textarea
                        id="remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        rows="3"
                        className={`mt-1 block w-full rounded-md ${errors.remarks ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                      ></textarea>
                      {errors.remarks && (
                        <p className="mt-1 text-sm text-red-600">{errors.remarks}</p>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {editingEntry ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceEntryModal; 