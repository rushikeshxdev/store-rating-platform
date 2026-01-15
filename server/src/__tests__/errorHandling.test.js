/**
 * Error Handling Verification Tests
 * Task 22.2: Error handling verification
 * Validates: Requirements 2.7, 10.7
 * 
 * This test suite verifies that:
 * - All validation error scenarios return appropriate error messages
 * - Authentication errors are handled correctly
 * - Authorization errors are handled correctly
 * - Error messages are user-friendly and informative
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const StoreController = require('../controllers/StoreController');
const RatingController = require('../controllers/RatingController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { generateToken } = require('../utils/jwtUtils');

const prisma = new PrismaClient();

// Create Express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());

  const authController = new AuthController();
  const userController = new UserController();
  const storeController = new StoreController();
  const ratingController = new RatingController();

  // Auth routes
  app.post('/api/auth/register', (req, res) => authController.register(req, res));
  app.post('/api/auth/login', (req, res) => authController.login(req, res));

  // User routes
  app.post('/api/users', authenticate, authorize('SYSTEM_ADMIN'), (req, res) => userController.createUser(req, res));
  app.put('/api/users/:id/password', authenticate, (req, res) => userController.updatePassword(req, res));

  // Store routes
  app.post('/api/stores', authenticate, authorize('SYSTEM_ADMIN'), (req, res) => storeController.createStore(req, res));

  // Rating routes
  app.post('/api/ratings', authenticate, authorize('NORMAL_USER'), (req, res) => ratingController.createRating(req, res));
  app.put('/api/ratings/:id', authenticate, authorize('NORMAL_USER'), (req, res) => ratingController.updateRating(req, res));

  return app;
}

describe('Error Handling Verification', () => {
  let app;
  let testUser;
  let testAdmin;
  let testStore;

  beforeAll(async () => {
    app = createTestApp();

    // Clean up test data
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'errortest@example.com',
            'admin@errortest.com',
            'duplicate@test.com'
          ]
        }
      }
    });
    await prisma.store.deleteMany({
      where: {
        email: {
          in: ['errorstore@test.com', 'duplicate@store.com']
        }
      }
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Error Test User With Valid Name Length',
        email: 'errortest@example.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIiIUWJ3yW', // hashed "Password1!"
        address: '123 Test Street, Test City',
        role: 'NORMAL_USER'
      }
    });

    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        name: 'Admin User With Valid Name Length Here',
        email: 'admin@errortest.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIiIUWJ3yW',
        address: '456 Admin Street, Admin City',
        role: 'SYSTEM_ADMIN'
      }
    });

    // Create test store
    testStore = await prisma.store.create({
      data: {
        name: 'Error Test Store With Valid Name Length',
        email: 'errorstore@test.com',
        address: '789 Store Avenue, Store City'
      }
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'errortest@example.com',
            'admin@errortest.com',
            'duplicate@test.com'
          ]
        }
      }
    });
    await prisma.store.deleteMany({
      where: {
        email: {
          in: ['errorstore@test.com', 'duplicate@store.com']
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('Validation Error Scenarios', () => {
    
    describe('Registration Validation Errors', () => {
      
      it('should return user-friendly error for name too short', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Short',
            email: 'test@example.com',
            password: 'Password1!',
            address: '123 Test Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.code).toBe('REGISTRATION_FAILED');
        expect(response.body.error.message).toContain('20 characters');
      });

      it('should return user-friendly error for name too long', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'A'.repeat(61),
            email: 'test@example.com',
            password: 'Password1!',
            address: '123 Test Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('60 characters');
      });

      it('should return user-friendly error for invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Valid Name With Twenty Characters',
            email: 'invalid-email-format',
            password: 'Password1!',
            address: '123 Test Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message.toLowerCase()).toContain('email');
      });

      it('should return user-friendly error for password too short', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Valid Name With Twenty Characters',
            email: 'test@example.com',
            password: 'Pass1!',
            address: '123 Test Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('8 characters');
      });

      it('should return user-friendly error for password too long', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Valid Name With Twenty Characters',
            email: 'test@example.com',
            password: 'Password1!TooLong',
            address: '123 Test Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('16 characters');
      });

      it('should return user-friendly error for password without uppercase', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Valid Name With Twenty Characters',
            email: 'test@example.com',
            password: 'password1!',
            address: '123 Test Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('uppercase');
      });

      it('should return user-friendly error for password without special character', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Valid Name With Twenty Characters',
            email: 'test@example.com',
            password: 'Password1',
            address: '123 Test Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('special character');
      });

      it('should return user-friendly error for address too long', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Valid Name With Twenty Characters',
            email: 'test@example.com',
            password: 'Password1!',
            address: 'A'.repeat(401)
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('400 characters');
      });

      it('should return user-friendly error for empty address', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Valid Name With Twenty Characters',
            email: 'test@example.com',
            password: 'Password1!',
            address: '   '
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Address');
      });
    });

    describe('Store Creation Validation Errors', () => {
      let adminToken;

      beforeAll(() => {
        adminToken = generateToken(testAdmin.id, testAdmin.role);
      });

      it('should return user-friendly error for invalid store name', async () => {
        const response = await request(app)
          .post('/api/stores')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Short',
            email: 'store@test.com',
            address: '123 Store Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('20 characters');
      });

      it('should return user-friendly error for invalid store email', async () => {
        const response = await request(app)
          .post('/api/stores')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Valid Store Name With Twenty Characters',
            email: 'invalid-email',
            address: '123 Store Street'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message.toLowerCase()).toContain('email');
      });
    });

    describe('Rating Validation Errors', () => {
      let userToken;

      beforeAll(() => {
        userToken = generateToken(testUser.id, testUser.role);
      });

      it('should return user-friendly error for missing rating value', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            storeId: testStore.id
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toContain('required');
      });

      it('should return user-friendly error for rating below 1', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            storeId: testStore.id,
            value: 0
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('between 1 and 5');
      });

      it('should return user-friendly error for rating above 5', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            storeId: testStore.id,
            value: 6
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('between 1 and 5');
      });

      it('should return user-friendly error for non-integer rating', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            storeId: testStore.id,
            value: 3.5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('integer');
      });
    });

    describe('Password Update Validation Errors', () => {
      let userToken;

      beforeAll(() => {
        userToken = generateToken(testUser.id, testUser.role);
      });

      it('should return user-friendly error for invalid new password', async () => {
        const response = await request(app)
          .put(`/api/users/${testUser.id}/password`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            newPassword: 'weak'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toBeDefined();
      });

      it('should return user-friendly error for missing new password', async () => {
        const response = await request(app)
          .put(`/api/users/${testUser.id}/password`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_PASSWORD');
        expect(response.body.error.message).toContain('required');
      });
    });
  });

  describe('Authentication Error Scenarios', () => {
    
    it('should return user-friendly error for missing authentication token', async () => {
      const response = await request(app)
        .post('/api/stores')
        .send({
          name: 'Valid Store Name With Twenty Characters',
          email: 'store@test.com',
          address: '123 Store Street'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('MISSING_TOKEN');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return user-friendly error for invalid token format', async () => {
      const response = await request(app)
        .post('/api/stores')
        .set('Authorization', 'InvalidFormat')
        .send({
          name: 'Valid Store Name With Twenty Characters',
          email: 'store@test.com',
          address: '123 Store Street'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return user-friendly error for invalid JWT token', async () => {
      const response = await request(app)
        .post('/api/stores')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send({
          name: 'Valid Store Name With Twenty Characters',
          email: 'store@test.com',
          address: '123 Store Street'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return user-friendly error for invalid login credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'errortest@example.com',
          password: 'WrongPassword1!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBeDefined();
      // Message should be generic and not reveal which field is wrong
      expect(response.body.error.message).toContain('Invalid');
    });

    it('should return user-friendly error for non-existent user login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password1!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return user-friendly error for missing login credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toContain('required');
    });
  });

  describe('Authorization Error Scenarios', () => {
    let userToken;
    let adminToken;

    beforeAll(() => {
      userToken = generateToken(testUser.id, testUser.role);
      adminToken = generateToken(testAdmin.id, testAdmin.role);
    });

    it('should return user-friendly error when normal user tries to create store', async () => {
      const response = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Valid Store Name With Twenty Characters',
          email: 'newstore@test.com',
          address: '123 New Store Street'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return user-friendly error when normal user tries to create user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New User With Valid Name Length Here',
          email: 'newuser@test.com',
          password: 'Password1!',
          address: '123 New User Street',
          role: 'NORMAL_USER'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return user-friendly error when admin tries to submit rating', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          storeId: testStore.id,
          value: 5
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBeDefined();
    });

    it('should return user-friendly error when user tries to update another user password', async () => {
      const response = await request(app)
        .put(`/api/users/${testAdmin.id}/password`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          newPassword: 'NewPassword1!'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('own password');
    });
  });

  describe('Error Message User-Friendliness', () => {
    
    it('should provide clear error structure with code and message', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short',
          email: 'test@example.com',
          password: 'Password1!',
          address: '123 Test Street'
        });

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(typeof response.body.error.code).toBe('string');
      expect(typeof response.body.error.message).toBe('string');
      expect(response.body.error.message.length).toBeGreaterThan(0);
    });

    it('should not expose internal system details in error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'errortest@example.com',
          password: 'WrongPassword1!'
        });

      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('SQL');
      expect(response.body.error.message).not.toContain('stack');
      expect(response.body.error.message).not.toContain('prisma');
    });

    it('should provide actionable error messages for validation failures', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Valid Name With Twenty Characters',
          email: 'test@example.com',
          password: 'password', // Missing uppercase and special char
          address: '123 Test Street'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBeDefined();
      // Message should indicate what's wrong
      expect(
        response.body.error.message.toLowerCase().includes('uppercase') ||
        response.body.error.message.toLowerCase().includes('special') ||
        response.body.error.message.toLowerCase().includes('character')
      ).toBe(true);
    });

    it('should use consistent error response format across all endpoints', async () => {
      const userToken = generateToken(testUser.id, testUser.role);

      // Test multiple endpoints
      const responses = await Promise.all([
        request(app).post('/api/auth/register').send({ name: 'Short' }),
        request(app).post('/api/auth/login').send({}),
        request(app).post('/api/stores').send({}),
        request(app).post('/api/ratings').set('Authorization', `Bearer ${userToken}`).send({})
      ]);

      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
      });
    });
  });
});
