import api from './api';

const balanceService = {
  // Get total balance
  getTotalBalance: async () => {
    try {
      const response = await api.get('/balance/total');
      return response.data;
    } catch (error) {
      console.error('Error fetching total balance:', error);
      throw error;
    }
  },

  // Get all balance entries with pagination
  getAllBalanceEntries: async (page = 1, limit = 10, dateFilter = null, remarksFilter = null) => {
    try {
      let url = `/balance?page=${page}&limit=${limit}`;

      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }

      if (remarksFilter) {
        url += `&remarks=${remarksFilter}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching balance entries:', error);
      throw error;
    }
  },

  // Add a balance entry
  addBalanceEntry: async (entry) => {
    try {
      const response = await api.post('/balance', entry);
      return response.data;
    } catch (error) {
      console.error('Error adding balance entry:', error);
      throw error;
    }
  },

  // Update a balance entry
  updateBalanceEntry: async (id, entry) => {
    try {
      const response = await api.put(`/balance/${id}`, entry);
      return response.data;
    } catch (error) {
      console.error('Error updating balance entry:', error);
      throw error;
    }
  },

  // Delete a balance entry
  deleteBalanceEntry: async (id) => {
    try {
      const response = await api.delete(`/balance/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting balance entry:', error);
      throw error;
    }
  }
};

export default balanceService; 