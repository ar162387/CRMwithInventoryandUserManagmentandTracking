import api from './api';

/**
 * Logs in a user.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{token: string, user: object}>} The auth token and user data.
 */
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    // Assuming the backend returns { token, user } upon successful login
    if (response.data && response.data.token) {
      // Store the token (e.g., in localStorage)
      localStorage.setItem('token', response.data.token);
      // Optionally store user info as well (be mindful of sensitive data)
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data; // Return the full response data (token and user)
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
    // Re-throw the error or return a specific error object
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

/**
 * Logs out the current user.
 */
export const logout = () => {
  // Clear the token and user info from storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Optional: Make an API call to invalidate the token on the backend if needed
  // Optional: Redirect to login page
};

/**
 * Gets the currently stored user info.
 * @returns {object|null} User object or null.
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user data from localStorage", error);
    return null;
  }
};

/**
 * Gets the currently stored token.
 * @returns {string|null} Auth token or null.
 */
export const getToken = () => {
  return localStorage.getItem('token');
}; 