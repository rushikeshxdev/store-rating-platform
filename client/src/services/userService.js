import api from './api';

export const userService = {
  // Create a new user (admin only)
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Get all users with optional filters and sorting (admin only)
  getAllUsers: async (filters = {}, sorting = {}) => {
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.name) params.append('name', filters.name);
    if (filters.email) params.append('email', filters.email);
    if (filters.address) params.append('address', filters.address);
    if (filters.role) params.append('role', filters.role);
    
    // Add sorting
    if (sorting.field) params.append('sortBy', sorting.field);
    if (sorting.direction) params.append('sortOrder', sorting.direction);
    
    const response = await api.get(`/users?${params.toString()}`);
    return response.data.data.users;
  },

  // Get user by ID (admin only)
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data.data.user;
  },

  // Update user password
  updatePassword: async (userId, passwordData) => {
    const response = await api.put(`/users/${userId}/password`, passwordData);
    return response.data;
  },
};
