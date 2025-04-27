import api from './api';

// Get all commissioners
export const getCommissioners = async () => {
  try {
    const response = await api.get('/commissioners');
    return response.data;
  } catch (error) {
    console.error('Error fetching commissioners:', error);
    throw error;
  }
};

// Get a commissioner by ID
export const getCommissioner = async (id) => {
  try {
    const response = await api.get(`/commissioners/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching commissioner:', error);
    throw error;
  }
};

// Create a new commissioner
export const createCommissioner = async (commissionerData) => {
  try {
    const response = await api.post('/commissioners', commissionerData);
    return response.data;
  } catch (error) {
    console.error('Error creating commissioner:', error);
    throw error;
  }
};

// Update a commissioner
export const updateCommissioner = async (id, commissionerData) => {
  try {
    const response = await api.put(`/commissioners/${id}`, commissionerData);
    return response.data;
  } catch (error) {
    console.error('Error updating commissioner:', error);
    throw error;
  }
};

// Delete a commissioner
export const deleteCommissioner = async (id) => {
  try {
    const response = await api.delete(`/commissioners/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting commissioner:', error);
    throw error;
  }
};

// Add a payment to a commissioner
export const addCommissionerPayment = async (id, paymentData) => {
  try {
    const response = await api.post(`/commissioners/${id}/payments`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error adding commissioner payment:', error);
    throw error;
  }
};

// Set due date for a commissioner
export const setCommissionerDueDate = async (id, dueDateData) => {
  try {
    const response = await api.post(`/commissioners/${id}/due-date`, dueDateData);
    return response.data;
  } catch (error) {
    console.error('Error setting commissioner due date:', error);
    throw error;
  }
};

// Search commissioners
export const searchCommissioners = async (query) => {
  try {
    const response = await api.get(`/commissioners/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching commissioners:', error);
    throw error;
  }
}; 