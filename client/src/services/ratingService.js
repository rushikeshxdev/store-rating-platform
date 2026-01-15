import api from './api';

export const ratingService = {
  // Submit a new rating (normal users only)
  createRating: async (ratingData) => {
    const response = await api.post('/ratings', ratingData);
    return response.data;
  },

  // Update an existing rating (normal users only)
  updateRating: async (ratingId, ratingData) => {
    const response = await api.put(`/ratings/${ratingId}`, ratingData);
    return response.data;
  },

  // Get ratings for a specific store (store owners only)
  getRatingsForStore: async (storeId) => {
    const response = await api.get(`/ratings/store/${storeId}`);
    return response.data;
  },
};
