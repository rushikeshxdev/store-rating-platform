const StoreService = require('../services/StoreService');

const storeService = new StoreService();

class StoreController {
  /**
   * Create a new store (admin only)
   * POST /api/stores
   */
  async createStore(req, res) {
    try {
      const { name, email, address } = req.body;

      // Create store
      const store = await storeService.createStore({
        name,
        email,
        address
      });

      res.status(201).json({
        success: true,
        data: {
          store
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STORE_CREATION_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Get all stores with optional filters and sorting
   * GET /api/stores
   */
  async getAllStores(req, res) {
    try {
      const { name, email, address, search, sortBy, sortOrder } = req.query;
      const userId = req.user?.userId; // Get user ID from auth middleware

      const stores = await storeService.getAllStores({
        name,
        email,
        address,
        search,
        sortBy,
        sortOrder
      });

      // For each store, calculate average rating
      const storesWithRatings = await Promise.all(
        stores.map(async (store) => {
          const averageRating = await storeService.calculateAverageRating(store.id);
          
          // Get user's rating and total ratings if userId is available
          let userRating = null;
          let totalRatings = 0;
          if (userId) {
            const storeWithRatings = await storeService.getStoreWithRatings(store.id, userId);
            userRating = storeWithRatings?.userRating || null;
            totalRatings = storeWithRatings?.totalRatings || 0;
          } else {
            // If no userId, just get total ratings
            const storeWithRatings = await storeService.getStoreWithRatings(store.id);
            totalRatings = storeWithRatings?.totalRatings || 0;
          }

          return {
            id: store.id,
            name: store.name,
            email: store.email,
            address: store.address,
            averageRating,
            userRating,
            totalRatings,
            createdAt: store.createdAt,
            updatedAt: store.updatedAt
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          stores: storesWithRatings
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_STORES_FAILED',
          message: 'An error occurred while fetching stores'
        }
      });
    }
  }

  /**
   * Get store by ID with ratings
   * GET /api/stores/:id
   */
  async getStoreById(req, res) {
    try {
      const storeId = parseInt(req.params.id);
      const userId = req.user?.userId; // Get user ID from auth middleware

      if (isNaN(storeId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STORE_ID',
            message: 'Invalid store ID'
          }
        });
      }

      const store = await storeService.getStoreWithRatings(storeId, userId);

      if (!store) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STORE_NOT_FOUND',
            message: 'Store not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          store
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_STORE_FAILED',
          message: 'An error occurred while fetching store'
        }
      });
    }
  }
}

module.exports = StoreController;
