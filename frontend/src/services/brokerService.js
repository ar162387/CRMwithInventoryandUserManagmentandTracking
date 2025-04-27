import api from './api';

// Get all brokers
export const getBrokers = async () => {
  try {
    const response = await api.get('/brokers');
    return response.data;
  } catch (error) {
    console.error('Error fetching brokers:', error);
    throw error;
  }
};

// Get a single broker
export const getBroker = async (id) => {
  try {
    const response = await api.get(`/brokers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching broker ${id}:`, error);
    throw error;
  }
};

// Create a new broker
export const createBroker = async (brokerData) => {
  try {
    const response = await api.post('/brokers', brokerData);
    return response.data;
  } catch (error) {
    console.error('Error creating broker:', error);
    throw error;
  }
};

// Update a broker
export const updateBroker = async (id, brokerData) => {
  try {
    const response = await api.put(`/brokers/${id}`, brokerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating broker ${id}:`, error);
    throw error;
  }
};

// Delete a broker
export const deleteBroker = async (id) => {
  try {
    const response = await api.delete(`/brokers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting broker ${id}:`, error);
    throw error;
  }
};

// Search brokers
export const searchBrokers = async (query) => {
  try {
    const response = await api.get(`/brokers/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching brokers:', error);
    throw error;
  }
}; 