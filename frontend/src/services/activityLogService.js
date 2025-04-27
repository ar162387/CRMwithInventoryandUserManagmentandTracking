import api from './api';

/**
 * Fetches all activity logs from the API (Authenticated users).
 * @returns {Promise<Array>} A promise that resolves to an array of activity log objects.
 */
export const getActivityLogs = async () => {
  try {
    const response = await api.get('/activity-log');
    return response.data;
  } catch (error) {
    console.error('Error fetching activity logs:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch activity logs');
  }
}; 