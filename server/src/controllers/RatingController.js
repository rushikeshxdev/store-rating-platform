const RatingService = require('../services/RatingService');
const { PrismaClient } = require('@prisma/client');

const ratingService = new RatingService();
const prisma = new PrismaClient();

class RatingController {
  /**
   * Create a new rating (normal users only)
   * POST /api/ratings
   */
  async createRating(req, res) {
    try {
      const { storeId, value } = req.body;
      const userId = req.user.userId; // From authentication middleware

      // Validate input
      if (!storeId || value === undefined || value === null) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Store ID and rating value are required'
          }
        });
      }

      // Create rating
      const rating = await ratingService.createRating(userId, storeId, value);

      res.status(201).json({
        success: true,
        data: {
          rating
        }
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_RATING',
            message: error.message
          }
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'RATING_CREATION_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Update an existing rating (normal users only)
   * PUT /api/ratings/:id
   */
  async updateRating(req, res) {
    try {
      const ratingId = parseInt(req.params.id);
      const { value } = req.body;
      const userId = req.user.userId; // From authentication middleware

      // Validate input
      if (isNaN(ratingId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RATING_ID',
            message: 'Invalid rating ID'
          }
        });
      }

      if (value === undefined || value === null) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Rating value is required'
          }
        });
      }

      // Update rating
      const rating = await ratingService.updateRating(ratingId, userId, value);

      res.status(200).json({
        success: true,
        data: {
          rating
        }
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RATING_NOT_FOUND',
            message: error.message
          }
        });
      }

      if (error.message.includes('only update your own')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message
          }
        });
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'RATING_UPDATE_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Get all ratings for a store (store owners only for their store)
   * GET /api/ratings/store/:storeId
   */
  async getRatingsForStore(req, res) {
    try {
      const storeId = parseInt(req.params.storeId);
      const userId = req.user.userId; // From authentication middleware
      const userRole = req.user.role;

      // Validate input
      if (isNaN(storeId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STORE_ID',
            message: 'Invalid store ID'
          }
        });
      }

      // Check if store exists
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          owner: true
        }
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STORE_NOT_FOUND',
            message: 'Store not found'
          }
        });
      }

      // Authorization check: Only store owner can view ratings for their store
      // (or system admin if we want to allow that)
      if (userRole === 'STORE_OWNER') {
        if (!store.owner || store.owner.id !== userId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only view ratings for your own store'
            }
          });
        }
      } else if (userRole !== 'SYSTEM_ADMIN') {
        // Only store owners and admins can access this endpoint
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource'
          }
        });
      }

      // Get ratings
      const ratings = await ratingService.getRatingsForStore(storeId);

      res.status(200).json({
        success: true,
        data: {
          ratings
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_RATINGS_FAILED',
          message: 'An error occurred while fetching ratings'
        }
      });
    }
  }
}

module.exports = RatingController;
