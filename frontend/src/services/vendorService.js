import api from './api';

// Get all vendors
export const getVendors = async () => {
  try {
    const response = await api.get('/vendors');
    return response.data;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
};

// Get a single vendor
export const getVendor = async (id) => {
  try {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching vendor ${id}:`, error);
    throw error;
  }
};

// Create a new vendor
export const createVendor = async (vendorData) => {
  try {
    const response = await api.post('/vendors', vendorData);
    return response.data;
  } catch (error) {
    console.error('Error creating vendor:', error);
    throw error;
  }
};

// Update a vendor
export const updateVendor = async (id, vendorData) => {
  try {
    const response = await api.put(`/vendors/${id}`, vendorData);
    return response.data;
  } catch (error) {
    console.error(`Error updating vendor ${id}:`, error);
    throw error;
  }
};

// Delete a vendor
export const deleteVendor = async (id) => {
  try {
    const response = await api.delete(`/vendors/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting vendor ${id}:`, error);
    throw error;
  }
};

// Search vendors
export const searchVendors = async (query) => {
  try {
    const response = await api.get(`/vendors/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching vendors:', error);
    throw error;
  }
}; 