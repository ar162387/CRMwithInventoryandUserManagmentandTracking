import api from './api';

// Get all customers
export const getCustomers = async () => {
  try {
    const response = await api.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Get a single customer
export const getCustomer = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};

// Create a new customer
export const createCustomer = async (customerData) => {
  try {
    const response = await api.post('/customers', customerData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error);
    throw error;
  }
};

// Search customers
export const searchCustomers = async (query) => {
  try {
    const response = await api.get(`/customers/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
}; 