import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;

      // Ensure permissions is an object
      if (!userData.permissions || typeof userData.permissions !== 'object') {
        userData.permissions = {};
      }

      console.log('Fetched user data:', userData);
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.message || 'Failed to fetch user data');
      setLoading(false);
      throw err;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);

      // Ensure we have the complete user data including permissions
      console.log('Login user data:', user);

      // Make sure permissions is an object
      if (!user.permissions || typeof user.permissions !== 'object') {
        user.permissions = {};
      }

      // Set user data immediately after login
      setUser(user);

      // Fetch fresh user data to ensure we have the latest permissions
      await fetchUserData();

      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/update-password', {
        currentPassword,
        newPassword
      });
      // Log out the user after successful password update
      logout();
      return true;
    } catch (err) {
      console.error('Error updating password:', err);
      throw new Error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updatePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 