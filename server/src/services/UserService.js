const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/passwordUtils');
const { validateName, validateEmail, validatePassword, validateAddress } = require('../utils/validationUtils');

const prisma = new PrismaClient();

class UserService {
  /**
   * Create a new user with validation
   * @param {Object} userData - User data
   * @param {string} userData.name - User name (20-60 characters)
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password (8-16 chars, uppercase, special char)
   * @param {string} userData.address - User address (max 400 characters)
   * @param {string} userData.role - User role (SYSTEM_ADMIN, NORMAL_USER, STORE_OWNER)
   * @param {number} [userData.storeId] - Store ID for store owners
   * @returns {Promise<Object>} Created user (without password)
   * @throws {Error} If validation fails or email already exists
   */
  async createUser(userData) {
    const { name, email, password, address, role = 'NORMAL_USER', storeId } = userData;

    // Validate all fields
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    const addressValidation = validateAddress(address);
    if (!addressValidation.valid) {
      throw new Error(addressValidation.error);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        address: address.trim(),
        role,
        storeId: storeId || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        storeId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object (without password) or null if not found
   */
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true
          }
        }
      }
    });

    return user;
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @param {boolean} includePassword - Whether to include password in result
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByEmail(email, includePassword = false) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: includePassword,
        address: true,
        role: true,
        storeId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Updated user (without password)
   * @throws {Error} If validation fails or user not found
   */
  async updatePassword(userId, newPassword) {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Check if user exists and get current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if new password is same as current password
    const { comparePassword } = require('../utils/passwordUtils');
    const isSamePassword = await comparePassword(newPassword, user.password);
    
    if (isSamePassword) {
      throw new Error('New password cannot be the same as your current password. Please choose a different password.');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        storeId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  /**
   * Get all users with optional filters and sorting
   * @param {Object} options - Query options
   * @param {string} [options.name] - Filter by name (partial match)
   * @param {string} [options.email] - Filter by email (partial match)
   * @param {string} [options.address] - Filter by address (partial match)
   * @param {string} [options.role] - Filter by role (exact match)
   * @param {string} [options.sortBy] - Field to sort by (name, email, createdAt)
   * @param {string} [options.sortOrder] - Sort order (asc or desc)
   * @returns {Promise<Array>} Array of users (without passwords)
   */
  async getAllUsers(options = {}) {
    const { name, email, address, role, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where clause
    const where = {};

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (address) {
      where.address = { contains: address, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Query users
    const users = await prisma.user.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        storeId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return users;
  }
}

module.exports = UserService;
