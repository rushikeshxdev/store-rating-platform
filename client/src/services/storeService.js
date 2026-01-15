import api from './api';

export const storeService = {
  // Create a new store (admin only)
  createStore: async (storeData) => {
    const response = await api.post('/stores', storeData);
    return response.data;
  },

  // Get all stores with optional filters, sorting, and search
  getAllStores: async (filters = {}, sorting = {}) => {
    const params = new URLSearchParams();
    
    // Add filters/search
    if (filters.name) params.append('name', filters.name);
    if (filters.email) params.append('email', filters.email);
    if (filters.address) params.append('address', filters.address);
    if (filters.search) params.append('search', filters.search);
    
    // Add sorting
    if (sorting.field) params.append('sortBy', sorting.field);
    if (sorting.direction) params.append('sortOrder', sorting.direction);
    
    const response = await api.get(`/stores?${params.toString()}`);
    return response.data.data.stores;
  },

  // Get store by ID
  getStoreById: async (storeId) => {
    const response = await api.get(`/stores/${storeId}`);
    return response.data;
  },
};
