const UserService = require('../services/UserService');
const StoreService = require('../services/StoreService');

const userService = new UserService();
const storeService = new StoreService();

class UserController {
  /**
   * Create a new user (admin only)
   * POST /api/users
   */
  async createUser(req, res) {
    try {
      const { name, email, password, address, role, storeId } = req.body;

      // Validate role if provided
      const validRoles = ['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid role. Must be SYSTEM_ADMIN, NORMAL_USER, or STORE_OWNER'
          }
        });
      }

      // Create user with specified role
      const user = await userService.createUser({
        name,
        email,
        password,
        address,
        role: role || 'NORMAL_USER',
        storeId
      });

      res.status(201).json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'USER_CREATION_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Get all users with optional filters and sorting (admin only)
   * GET /api/users
   */
  async getAllUsers(req, res) {
    try {
      const { name, email, address, role, sortBy, sortOrder } = req.query;

      const users = await userService.getAllUsers({
        name,
        email,
        address,
        role,
        sortBy,
        sortOrder
      });

      // For store owners, include their store's average rating
      const usersWithRatings = await Promise.all(
        users.map(async (user) => {
          if (user.role === 'STORE_OWNER' && user.storeId) {
            const averageRating = await storeService.calculateAverageRating(user.storeId);
            return {
              ...user,
              averageRating
            };
          }
          return user;
        })
      );

      res.status(200).json({
        success: true,
        data: {
          users: usersWithRatings
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_USERS_FAILED',
          message: 'An error occurred while fetching users'
        }
      });
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/users/:id
   */
  async getUserById(req, res) {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID'
          }
        });
      }

      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // If user is a store owner, include their store's average rating
      let userData = { ...user };
      if (user.role === 'STORE_OWNER' && user.storeId) {
        const averageRating = await storeService.calculateAverageRating(user.storeId);
        userData.averageRating = averageRating;
      }

      res.status(200).json({
        success: true,
        data: {
          user: userData
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_USER_FAILED',
          message: 'An error occurred while fetching user'
        }
      });
    }
  }

  /**
   * Update user password (authenticated users)
   * PUT /api/users/:id/password
   */
  async updatePassword(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID'
          }
        });
      }

      // Check if the authenticated user is updating their own password
      // or if they are an admin
      if (req.user.userId !== userId && req.user.role !== 'SYSTEM_ADMIN') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own password'
          }
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PASSWORD',
            message: 'New password is required'
          }
        });
      }

      const updatedUser = await userService.updatePassword(userId, newPassword);

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser
        },
        message: 'Password updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_UPDATE_FAILED',
          message: error.message
        }
      });
    }
  }
}

module.exports = UserController;
