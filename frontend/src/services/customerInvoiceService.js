import api from './api';

// Create a new customer invoice
export const createCustomerInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/customer-invoices', invoiceData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error creating invoice');
  }
};

// Get all customer invoices with optional filtering
export const getCustomerInvoices = async (filters = {}) => {
  try {
    const response = await api.get('/customer-invoices', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error fetching invoices');
  }
};

// Get customer invoices by customer ID
export const getCustomerInvoicesByCustomer = async (customerId) => {
  try {
    const response = await api.get(`/customer-invoices/customer/${customerId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error fetching customer invoices');
  }
};

// Get a single customer invoice by ID
export const getCustomerInvoiceById = async (id) => {
  try {
    const response = await api.get(`/customer-invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error fetching invoice details');
  }
};

// Update a customer invoice
export const updateCustomerInvoice = async (id, invoiceData) => {
  try {
    const response = await api.put(`/customer-invoices/${id}`, invoiceData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error updating invoice');
  }
};

// Update a customer invoice with inventory adjustments
export const updateCustomerInvoiceWithInventory = async (id, invoiceData) => {
  try {
    const response = await api.put(`/customer-invoices/${id}/with-inventory`, invoiceData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error updating invoice with inventory');
  }
};

// Delete a customer invoice
export const deleteCustomerInvoice = async (id) => {
  try {
    const response = await api.delete(`/customer-invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error deleting invoice');
  }
};

// Add a payment to a customer invoice
export const addPaymentToCustomerInvoice = async (invoiceId, paymentData) => {
  try {
    const response = await api.post(`/customer-invoices/${invoiceId}/payments`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error adding payment');
  }
};

// Update customer invoice due date
export const updateCustomerInvoiceDueDate = async (invoiceId, dueDateData) => {
  try {
    const response = await api.patch(`/customer-invoices/${invoiceId}/due-date`, dueDateData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error updating due date');
  }
}; 