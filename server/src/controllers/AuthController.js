const UserService = require('../services/UserService');
const { comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');

const userService = new UserService();

class AuthController {
  /**
   * Register a new normal user
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { name, email, password, address } = req.body;

      // Create user with NORMAL_USER role
      const user = await userService.createUser({
        name,
        email,
        password,
        address,
        role: 'NORMAL_USER'
      });

      // Generate token
      const token = generateToken(user.id, user.role);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            role: user.role
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message
        }
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('Login attempt for email:', email);

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Email and password are required'
          }
        });
      }

      // Get user with password
      const user = await userService.getUserByEmail(email, true);

      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Generate token
      const token = generateToken(user.id, user.role);

      console.log('Login successful for user:', email, 'Role:', user.role);

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            role: user.role,
            storeId: user.storeId
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'An error occurred during login'
        }
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   * Note: With JWT, logout is primarily handled client-side by removing the token
   * This endpoint exists for consistency and can be extended for token blacklisting
   */
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // This endpoint can be extended to implement token blacklisting if needed
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'An error occurred during logout'
        }
      });
    }
  }

  /**
   * Get current authenticated user
   * GET /api/auth/me
   * Requires authentication middleware
   */
  async me(req, res) {
    try {
      // req.user is set by authentication middleware
      const userId = req.user.userId;

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

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            role: user.role,
            storeId: user.storeId
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_USER_FAILED',
          message: 'An error occurred while fetching user data'
        }
      });
    }
  }
}

module.exports = AuthController;
