import api from './api';

/**
 * Fetches all users from the API (Admin only).
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch users');
  }
};

/**
 * Fetches a single user by ID from the API (Admin only).
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<Object>} A promise that resolves to the user object.
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch user');
  }
};

/**
 * Creates a new user via the API (Admin only).
 * @param {Object} userData - The user data (username, fullname, password, role).
 * @returns {Promise<Object>} A promise that resolves to the API response (e.g., success message, userId).
 */
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create user');
  }
};

/**
 * Updates an existing user via the API (Admin only).
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updateData - The data to update (fullname, role, password - send only fields to change).
 * @returns {Promise<Object>} A promise that resolves to the API response (e.g., success message, updated user).
 */
export const updateUser = async (userId, updateData) => {
  try {
    // Only send non-empty fields
    const filteredUpdateData = Object.entries(updateData)
      .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    console.log('Updating user with data:', {
      userId,
      filteredUpdateData,
      hasPermissions: 'permissions' in filteredUpdateData,
      permissionsValue: filteredUpdateData.permissions
    });

    if (Object.keys(filteredUpdateData).length === 0) {
      console.warn('Update user called with no data to update.');
    }

    const response = await api.put(`/users/${userId}`, filteredUpdateData);
    console.log('Update user response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update user');
  }
};

/**
 * Deletes a user via the API (Admin only).
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<Object>} A promise that resolves to the API response (e.g., success message).
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to delete user');
  }
}; 