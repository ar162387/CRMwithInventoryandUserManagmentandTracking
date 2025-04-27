import api from './api';

// Create a new vendor invoice
export const createVendorInvoice = async (invoiceData) => {
  try {
    console.log('Creating vendor invoice with data:', invoiceData);
    const response = await api.post('/vendor-invoices', invoiceData);
    console.log('Vendor invoice created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating vendor invoice:', error);
    throw error.response?.data || error.message;
  }
};

// Get all vendor invoices
export const getVendorInvoices = async () => {
  try {
    const response = await api.get('/vendor-invoices');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get vendor invoices by vendor ID
export const getVendorInvoicesByVendor = async (vendorId) => {
  try {
    const response = await api.get(`/vendor-invoices/vendor/${vendorId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get a specific vendor invoice by ID
export const getVendorInvoiceById = async (id) => {
  try {
    const response = await api.get(`/vendor-invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update vendor invoice payment
export const updateVendorInvoicePayment = async (id, paymentData) => {
  try {
    console.log('Updating vendor invoice payment for ID:', id);
    console.log('Payment data being sent:', paymentData);

    const response = await api.patch(`/vendor-invoices/${id}/payment`, paymentData);

    console.log('Payment update successful, updated invoice:', response.data);
    console.log('New payment status:', response.data.status);
    console.log('Total paid amount:', response.data.totalPaidAmount);
    console.log('Remaining amount:', response.data.remainingAmount);

    return response.data;
  } catch (error) {
    console.error('Error updating vendor invoice payment:', error);
    console.error('Request was for invoice ID:', id);
    console.error('Payment data was:', paymentData);
    throw error.response?.data || error.message;
  }
};

// Search vendor invoices
export const searchVendorInvoices = async (query) => {
  try {
    const response = await api.get(`/vendor-invoices/search?query=${query}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete a vendor invoice
export const deleteVendorInvoice = async (id) => {
  try {
    const response = await api.delete(`/vendor-invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting vendor invoice:', error.response?.data || error.message);
    throw error; // Throw the full error object to access response details
  }
};

// Update a vendor invoice
export const updateVendorInvoice = async (id, invoiceData) => {
  try {
    console.log('Updating vendor invoice with ID:', id, 'Data:', invoiceData);
    const response = await api.put(`/vendor-invoices/${id}`, invoiceData);
    console.log('Vendor invoice updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating vendor invoice:', error);
    throw error.response?.data || error.message;
  }
}; 