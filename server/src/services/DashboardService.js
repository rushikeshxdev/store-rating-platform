const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DashboardService {
  /**
   * Get admin dashboard statistics
   * @returns {Promise<Object>} Admin statistics (total users, stores, ratings)
   */
  async getAdminStats() {
    // Count all users
    const totalUsers = await prisma.user.count();

    // Count all stores
    const totalStores = await prisma.store.count();

    // Count all ratings
    const totalRatings = await prisma.rating.count();

    return {
      totalUsers,
      totalStores,
      totalRatings
    };
  }

  /**
   * Get store owner dashboard statistics
   * @param {number} ownerId - Store owner user ID
   * @returns {Promise<Object>} Owner statistics (average rating, ratings list)
   * @throws {Error} If user is not a store owner or store not found
   */
  async getOwnerStats(ownerId) {
    // Get the user to verify they are a store owner
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        role: true,
        storeId: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'STORE_OWNER') {
      throw new Error('User is not a store owner');
    }

    if (!user.storeId) {
      throw new Error('Store owner has no associated store');
    }

    // Calculate average rating for the store
    const ratingAggregation = await prisma.rating.aggregate({
      where: { storeId: user.storeId },
      _avg: {
        value: true
      },
      _count: {
        value: true
      }
    });

    const averageRating = ratingAggregation._count.value > 0 
      ? ratingAggregation._avg.value 
      : null;

    const totalRatings = ratingAggregation._count.value;

    // Get all ratings for the store with user information
    const ratings = await prisma.rating.findMany({
      where: { storeId: user.storeId },
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

    // Format ratings for response
    const formattedRatings = ratings.map(rating => ({
      id: rating.id,
      value: rating.value,
      userName: rating.user.name,
      userEmail: rating.user.email,
      createdAt: rating.createdAt
    }));

    return {
      averageRating,
      totalRatings,
      ratings: formattedRatings
    };
  }
}

module.exports = DashboardService;
