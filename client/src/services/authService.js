import api from './api';

export const authService = {
  // Register a new normal user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login with email and password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Logout current user
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user information
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
