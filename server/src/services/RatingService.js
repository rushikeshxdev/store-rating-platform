const { PrismaClient } = require('@prisma/client');
const { validateRating } = require('../utils/validationUtils');

const prisma = new PrismaClient();

class RatingService {
  /**
   * Create a new rating with validation
   * @param {number} userId - User ID
   * @param {number} storeId - Store ID
   * @param {number} value - Rating value (1-5)
   * @returns {Promise<Object>} Created rating
   * @throws {Error} If validation fails, user/store not found, or duplicate rating exists
   */
  async createRating(userId, storeId, value) {
    // Validate rating value
    const ratingValidation = validateRating(value);
    if (!ratingValidation.valid) {
      throw new Error(ratingValidation.error);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new Error('Store not found');
    }

    // Check if rating already exists for this user and store
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId
        }
      }
    });

    if (existingRating) {
      throw new Error('Rating already exists for this store. Use update instead.');
    }

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        value,
        userId,
        storeId
      }
    });

    return rating;
  }

  /**
   * Update an existing rating
   * @param {number} ratingId - Rating ID
   * @param {number} userId - User ID (for authorization check)
   * @param {number} value - New rating value (1-5)
   * @returns {Promise<Object>} Updated rating
   * @throws {Error} If validation fails, rating not found, or user doesn't own the rating
   */
  async updateRating(ratingId, userId, value) {
    // Validate rating value
    const ratingValidation = validateRating(value);
    if (!ratingValidation.valid) {
      throw new Error(ratingValidation.error);
    }

    // Check if rating exists
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId }
    });

    if (!rating) {
      throw new Error('Rating not found');
    }

    // Check if the user owns this rating
    if (rating.userId !== userId) {
      throw new Error('You can only update your own ratings');
    }

    // Update rating
    const updatedRating = await prisma.rating.update({
      where: { id: ratingId },
      data: { value }
    });

    return updatedRating;
  }

  /**
   * Get rating by user and store
   * @param {number} userId - User ID
   * @param {number} storeId - Store ID
   * @returns {Promise<Object|null>} Rating object or null if not found
   */
  async getRatingByUserAndStore(userId, storeId) {
    const rating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId
        }
      }
    });

    return rating;
  }

  /**
   * Get all ratings for a store
   * @param {number} storeId - Store ID
   * @returns {Promise<Array>} Array of ratings with user information
   */
  async getRatingsForStore(storeId) {
    const ratings = await prisma.rating.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return ratings;
  }

  /**
   * Get user's ratings for multiple stores (batch fetch)
   * @param {number} userId - User ID
   * @param {Array<number>} storeIds - Array of store IDs
   * @returns {Promise<Array>} Array of ratings
   */
  async getUserRatingsForStores(userId, storeIds) {
    const ratings = await prisma.rating.findMany({
      where: {
        userId,
        storeId: {
          in: storeIds
        }
      }
    });

    return ratings;
  }
}

module.exports = RatingService;
