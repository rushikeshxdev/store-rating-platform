const DashboardService = require('../services/DashboardService');

const dashboardService = new DashboardService();

class DashboardController {
  /**
   * Get admin dashboard statistics
   * GET /api/dashboard/admin
   * Requires authentication and SYSTEM_ADMIN role
   */
  async getAdminDashboard(req, res) {
    try {
      const stats = await dashboardService.getAdminStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ADMIN_STATS_FAILED',
          message: 'An error occurred while fetching admin statistics'
        }
      });
    }
  }

  /**
   * Get store owner dashboard statistics
   * GET /api/dashboard/owner
   * Requires authentication and STORE_OWNER role
   */
  async getOwnerDashboard(req, res) {
    try {
      // req.user is set by authentication middleware
      const ownerId = req.user.userId;

      const stats = await dashboardService.getOwnerStats(ownerId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: error.message
          }
        });
      }

      if (error.message === 'User is not a store owner' || 
          error.message === 'Store owner has no associated store') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_OWNER_STATS_FAILED',
          message: 'An error occurred while fetching owner statistics'
        }
      });
    }
  }
}

module.exports = DashboardController;
