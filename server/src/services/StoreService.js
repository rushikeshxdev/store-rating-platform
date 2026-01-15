const { PrismaClient } = require('@prisma/client');
const { validateName, validateEmail, validateAddress } = require('../utils/validationUtils');

const prisma = new PrismaClient();

class StoreService {
  /**
   * Create a new store with validation
   * @param {Object} storeData - Store data
   * @param {string} storeData.name - Store name (20-60 characters)
   * @param {string} storeData.email - Store email
   * @param {string} storeData.address - Store address (max 400 characters)
   * @returns {Promise<Object>} Created store
   * @throws {Error} If validation fails or email already exists
   */
  async createStore(storeData) {
    const { name, email, address } = storeData;

    // Validate all fields
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error);
    }

    const addressValidation = validateAddress(address);
    if (!addressValidation.valid) {
      throw new Error(addressValidation.error);
    }

    // Check if email already exists
    const existingStore = await prisma.store.findUnique({
      where: { email }
    });

    if (existingStore) {
      throw new Error('Store email already exists');
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        email,
        address: address.trim()
      }
    });

    return store;
  }

  /**
   * Get store by ID
   * @param {number} id - Store ID
   * @returns {Promise<Object|null>} Store object or null if not found
   */
  async getStoreById(id) {
    const store = await prisma.store.findUnique({
      where: { id }
    });

    return store;
  }

  /**
   * Get all stores with optional filters, sorting, and search
   * @param {Object} options - Query options
   * @param {string} [options.name] - Filter by name (partial match)
   * @param {string} [options.email] - Filter by email (partial match)
   * @param {string} [options.address] - Filter by address (partial match)
   * @param {string} [options.search] - Search by name or address (partial match)
   * @param {string} [options.sortBy] - Field to sort by (name, email, createdAt)
   * @param {string} [options.sortOrder] - Sort order (asc or desc)
   * @returns {Promise<Array>} Array of stores
   */
  async getAllStores(options = {}) {
    const { name, email, address, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where clause
    const where = {};

    if (search) {
      // Search in both name and address
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    } else {
      // Individual filters
      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }

      if (email) {
        where.email = { contains: email, mode: 'insensitive' };
      }

      if (address) {
        where.address = { contains: address, mode: 'insensitive' };
      }
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Query stores
    const stores = await prisma.store.findMany({
      where,
      orderBy
    });

    return stores;
  }

  /**
   * Get store with ratings and calculate average
   * @param {number} storeId - Store ID
   * @param {number} [userId] - Optional user ID to include user's rating
   * @returns {Promise<Object|null>} Store with ratings data or null if not found
   */
  async getStoreWithRatings(storeId, userId = null) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        ratings: true
      }
    });

    if (!store) {
      return null;
    }

    // Calculate average rating
    const averageRating = await this.calculateAverageRating(storeId);

    // Find user's rating if userId provided
    let userRating = null;
    if (userId) {
      const rating = await prisma.rating.findUnique({
        where: {
          userId_storeId: {
            userId,
            storeId
          }
        }
      });
      userRating = rating ? { id: rating.id, value: rating.value } : null;
    }

    return {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      averageRating,
      userRating,
      totalRatings: store.ratings.length,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    };
  }

  /**
   * Calculate average rating for a store
   * @param {number} storeId - Store ID
   * @returns {Promise<number|null>} Average rating or null if no ratings
   */
  async calculateAverageRating(storeId) {
    const result = await prisma.rating.aggregate({
      where: { storeId },
      _avg: {
        value: true
      },
      _count: {
        value: true
      }
    });

    // Return null if no ratings, otherwise return the average
    return result._count.value > 0 ? result._avg.value : null;
  }
}

module.exports = StoreService;
