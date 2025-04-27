import api from './api';

// Get all items
export const getItems = async () => {
  try {
    const response = await api.get('/items');
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// Get a single item
export const getItem = async (id) => {
  try {
    const response = await api.get(`/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    throw error;
  }
};

// Create a new item
export const createItem = async (itemData) => {
  try {
    const response = await api.post('/items', itemData);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

// Update an item
export const updateItem = async (id, itemData) => {
  try {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating item ${id}:`, error);
    throw error;
  }
};

// Delete an item
export const deleteItem = async (id) => {
  try {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error);
    throw error;
  }
};

// Search items
export const searchItems = async (query) => {
  try {
    const response = await api.get(`/items/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
}; 