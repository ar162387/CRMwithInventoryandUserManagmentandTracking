import api from './api';

// Get all commissioner invoices
export const getCommissionerInvoices = async () => {
  try {
    const response = await api.get('/commissioner-invoices');
    return response.data;
  } catch (error) {
    console.error('Error fetching commissioner invoices:', error);
    throw error;
  }
};

// Get a commissioner invoice by ID
export const getCommissionerInvoice = async (id) => {
  try {
    const response = await api.get(`/commissioner-invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching commissioner invoice:', error);
    throw error;
  }
};

// Get invoices for a specific commissioner
export const getInvoicesByCommissioner = async (commissionerId) => {
  try {
    const response = await api.get(`/commissioner-invoices/commissioner/${commissionerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching commissioner invoices:', error);
    throw error;
  }
};

// Create a new commissioner invoice
export const createCommissionerInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/commissioner-invoices', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error creating commissioner invoice:', error);
    throw error;
  }
};

// Update a commissioner invoice
export const updateCommissionerInvoice = async (id, invoiceData) => {
  try {
    const response = await api.put(`/commissioner-invoices/${id}`, invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error updating commissioner invoice:', error);
    throw error;
  }
};

// Delete a commissioner invoice
export const deleteCommissionerInvoice = async (id) => {
  try {
    const response = await api.delete(`/commissioner-invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting commissioner invoice:', error);
    throw error;
  }
}; 