import api from './api';

export const dashboardService = {
  // Get admin dashboard statistics (admin only)
  getAdminStats: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  // Get store owner dashboard statistics (store owners only)
  getOwnerStats: async () => {
    const response = await api.get('/dashboard/owner');
    return response.data;
  },
};
