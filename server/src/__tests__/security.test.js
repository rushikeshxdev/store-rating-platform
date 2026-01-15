/**
 * Security Verification Tests
 * Task 22.3: Security verification
 * Validates: Requirements 1.2, 1.4, 1.5
 * 
 * This test suite verifies:
 * - Passwords are hashed (never stored in plain text)
 * - JWT tokens work correctly
 * - Role-based access control is enforced
 * - Input sanitization is applied
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken, verifyToken } = require('../utils/jwtUtils');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRating
} = require('../utils/validationUtils');
const UserService = require('../services/UserService');

const prisma = new PrismaClient();
const userService = new UserService();

describe('Security Verification Tests', () => {
  
  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.store.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and disconnect after all tests
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Password Hashing Security', () => {
    
    it('should never store passwords in plain text', async () => {
      const plainPassword = 'TestPassword123!';
      const userData = {
        name: 'Test User With Valid Name Length',
        email: 'test@example.com',
        password: plainPassword,
        address: '123 Test Street, Test City, Test State 12345',
        role: 'NORMAL_USER'
      };

      // Create user
      const user = await userService.createUser(userData);

      // Fetch user from database with password
      const userFromDb = await prisma.user.findUnique({
        where: { id: user.id }
      });

      // Verify password is hashed (not equal to plain text)
      expect(userFromDb.password).not.toBe(plainPassword);
      expect(userFromDb.password).toBeDefined();
      expect(userFromDb.password.length).toBeGreaterThan(plainPassword.length);
      
      // Verify it's a bcrypt hash (starts with $2b$ or $2a$)
      expect(userFromDb.password).toMatch(/^\$2[ab]\$/);
    });

    it('should use bcrypt with 12 salt rounds', async () => {
      const plainPassword = 'SecurePass456!';
      
      // Hash password
      const hashedPassword = await hashPassword(plainPassword);
      
      // Verify it's a bcrypt hash with correct salt rounds
      // Bcrypt hash format: $2b$12$... where 12 is the salt rounds
      expect(hashedPassword).toMatch(/^\$2[ab]\$12\$/);
    });

    it('should verify passwords correctly using bcrypt compare', async () => {
      const plainPassword = 'MyPassword789!';
      const hashedPassword = await hashPassword(plainPassword);

      // Correct password should match
      const correctMatch = await comparePassword(plainPassword, hashedPassword);
      expect(correctMatch).toBe(true);

      // Incorrect password should not match
      const incorrectMatch = await comparePassword('WrongPassword!', hashedPassword);
      expect(incorrectMatch).toBe(false);
    });

    it('should generate different hashes for the same password (salt)', async () => {
      const plainPassword = 'SamePassword123!';
      
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      // Hashes should be different due to different salts
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      expect(await comparePassword(plainPassword, hash1)).toBe(true);
      expect(await comparePassword(plainPassword, hash2)).toBe(true);
    });

    it('should never return password in API responses', async () => {
      const userData = {
        name: 'Another Test User Name Here',
        email: 'nopassword@example.com',
        password: 'NoReturn123!',
        address: '456 Privacy Lane, Secure City, Safe State 67890',
        role: 'NORMAL_USER'
      };

      // Create user
      const user = await userService.createUser(userData);

      // Verify password is not in returned object
      expect(user.password).toBeUndefined();
      expect(user).not.toHaveProperty('password');

      // Get user by ID
      const fetchedUser = await userService.getUserById(user.id);
      expect(fetchedUser.password).toBeUndefined();
      expect(fetchedUser).not.toHaveProperty('password');
    });
  });

  describe('JWT Token Security', () => {
    
    it('should generate valid JWT tokens with userId and role', () => {
      const userId = 123;
      const role = 'NORMAL_USER';

      const token = generateToken(userId, role);

      // Verify token is a string
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Verify token has JWT format (three parts separated by dots)
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should verify and decode valid JWT tokens correctly', () => {
      const userId = 456;
      const role = 'SYSTEM_ADMIN';

      const token = generateToken(userId, role);
      const decoded = verifyToken(token);

      // Verify decoded payload contains correct data
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
      expect(decoded.exp).toBeDefined(); // Expiration time
      expect(decoded.iat).toBeDefined(); // Issued at time
    });

    it('should reject invalid JWT tokens', () => {
      const invalidTokens = [
        'invalid.token.here',
        'not-a-jwt',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      ];

      invalidTokens.forEach(invalidToken => {
        expect(() => verifyToken(invalidToken)).toThrow();
      });
    });

    it('should reject tampered JWT tokens', () => {
      const userId = 789;
      const role = 'STORE_OWNER';

      const validToken = generateToken(userId, role);
      
      // Tamper with the token
      const tamperedToken = validToken + 'tampered';

      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it('should include expiration in JWT tokens', () => {
      const userId = 999;
      const role = 'NORMAL_USER';

      const token = generateToken(userId, role);
      const decoded = verifyToken(token);

      // Verify expiration exists and is in the future
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should work with authentication middleware', () => {
      const userId = 111;
      const role = 'SYSTEM_ADMIN';
      const token = generateToken(userId, role);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      authenticate(req, res, next);

      // Verify authentication succeeded
      expect(nextCalled).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(userId);
      expect(req.user.role).toBe(role);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    
    it('should enforce SYSTEM_ADMIN only access', () => {
      const adminMiddleware = authorize('SYSTEM_ADMIN');

      // Test with SYSTEM_ADMIN - should pass
      const adminReq = {
        user: { userId: 1, role: 'SYSTEM_ADMIN' }
      };
      const adminRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      let adminNextCalled = false;
      const adminNext = () => { adminNextCalled = true; };

      adminMiddleware(adminReq, adminRes, adminNext);
      expect(adminNextCalled).toBe(true);

      // Test with NORMAL_USER - should fail
      const userReq = {
        user: { userId: 2, role: 'NORMAL_USER' }
      };
      const userRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const userNext = jest.fn();

      adminMiddleware(userReq, userRes, userNext);
      expect(userRes.status).toHaveBeenCalledWith(403);
      expect(userNext).not.toHaveBeenCalled();

      // Test with STORE_OWNER - should fail
      const ownerReq = {
        user: { userId: 3, role: 'STORE_OWNER' }
      };
      const ownerRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const ownerNext = jest.fn();

      adminMiddleware(ownerReq, ownerRes, ownerNext);
      expect(ownerRes.status).toHaveBeenCalledWith(403);
      expect(ownerNext).not.toHaveBeenCalled();
    });

    it('should enforce NORMAL_USER only access', () => {
      const userMiddleware = authorize('NORMAL_USER');

      // Test with NORMAL_USER - should pass
      const userReq = {
        user: { userId: 1, role: 'NORMAL_USER' }
      };
      const userRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      let userNextCalled = false;
      const userNext = () => { userNextCalled = true; };

      userMiddleware(userReq, userRes, userNext);
      expect(userNextCalled).toBe(true);

      // Test with SYSTEM_ADMIN - should fail
      const adminReq = {
        user: { userId: 2, role: 'SYSTEM_ADMIN' }
      };
      const adminRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const adminNext = jest.fn();

      userMiddleware(adminReq, adminRes, adminNext);
      expect(adminRes.status).toHaveBeenCalledWith(403);
      expect(adminNext).not.toHaveBeenCalled();
    });

    it('should enforce STORE_OWNER only access', () => {
      const ownerMiddleware = authorize('STORE_OWNER');

      // Test with STORE_OWNER - should pass
      const ownerReq = {
        user: { userId: 1, role: 'STORE_OWNER' }
      };
      const ownerRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      let ownerNextCalled = false;
      const ownerNext = () => { ownerNextCalled = true; };

      ownerMiddleware(ownerReq, ownerRes, ownerNext);
      expect(ownerNextCalled).toBe(true);

      // Test with NORMAL_USER - should fail
      const userReq = {
        user: { userId: 2, role: 'NORMAL_USER' }
      };
      const userRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const userNext = jest.fn();

      ownerMiddleware(userReq, userRes, userNext);
      expect(userRes.status).toHaveBeenCalledWith(403);
      expect(userNext).not.toHaveBeenCalled();
    });

    it('should support multiple allowed roles', () => {
      const multiRoleMiddleware = authorize('SYSTEM_ADMIN', 'STORE_OWNER');

      // Test with SYSTEM_ADMIN - should pass
      const adminReq = {
        user: { userId: 1, role: 'SYSTEM_ADMIN' }
      };
      const adminRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      let adminNextCalled = false;
      const adminNext = () => { adminNextCalled = true; };

      multiRoleMiddleware(adminReq, adminRes, adminNext);
      expect(adminNextCalled).toBe(true);

      // Test with STORE_OWNER - should pass
      const ownerReq = {
        user: { userId: 2, role: 'STORE_OWNER' }
      };
      const ownerRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      let ownerNextCalled = false;
      const ownerNext = () => { ownerNextCalled = true; };

      multiRoleMiddleware(ownerReq, ownerRes, ownerNext);
      expect(ownerNextCalled).toBe(true);

      // Test with NORMAL_USER - should fail
      const userReq = {
        user: { userId: 3, role: 'NORMAL_USER' }
      };
      const userRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const userNext = jest.fn();

      multiRoleMiddleware(userReq, userRes, userNext);
      expect(userRes.status).toHaveBeenCalledWith(403);
      expect(userNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
      const middleware = authorize('NORMAL_USER');

      const req = {}; // No user property
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Input Sanitization and Validation', () => {
    
    it('should validate and reject invalid names', () => {
      const invalidNames = [
        'Short', // Too short
        'a'.repeat(61), // Too long
        '', // Empty
        null,
        undefined,
        123, // Not a string
        true // Not a string
      ];

      invalidNames.forEach(name => {
        const result = validateName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should validate and accept valid names', () => {
      const validNames = [
        'Valid Name With Twenty Characters',
        'a'.repeat(20),
        'a'.repeat(60),
        'John Doe Smith Johnson Williams'
      ];

      validNames.forEach(name => {
        const result = validateName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should validate and reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'no-at-sign.com',
        '',
        null,
        undefined,
        123
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should validate and accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@test-domain.org',
        'info@company.io'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should validate and reject invalid passwords', () => {
      const invalidPasswords = [
        'short', // Too short
        'a'.repeat(17), // Too long
        'nouppercase123!', // No uppercase
        'NoSpecialChar123', // No special character
        '',
        null,
        undefined
      ];

      invalidPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should validate and accept valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'Secure@Pass1',
        'MyP@ssw0rd',
        'Test#1234ABC'
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should validate and reject invalid addresses', () => {
      const invalidAddresses = [
        '', // Empty
        '   ', // Whitespace only
        'a'.repeat(401), // Too long
        null,
        undefined,
        123
      ];

      invalidAddresses.forEach(address => {
        const result = validateAddress(address);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should validate and accept valid addresses', () => {
      const validAddresses = [
        '123 Main St',
        'a'.repeat(400),
        '456 Oak Avenue, Suite 100, City, State 12345',
        'Short'
      ];

      validAddresses.forEach(address => {
        const result = validateAddress(address);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should validate and reject invalid ratings', () => {
      const invalidRatings = [
        0, // Too low
        6, // Too high
        -1, // Negative
        1.5, // Not an integer
        3.7, // Not an integer
        '3', // String
        null,
        undefined,
        true
      ];

      invalidRatings.forEach(rating => {
        const result = validateRating(rating);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should validate and accept valid ratings', () => {
      const validRatings = [1, 2, 3, 4, 5];

      validRatings.forEach(rating => {
        const result = validateRating(rating);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should prevent SQL injection through Prisma ORM', async () => {
      // Prisma uses parameterized queries, so SQL injection should not be possible
      // Test with malicious input
      const maliciousEmail = "admin@test.com'; DROP TABLE users; --";
      
      const userData = {
        name: 'Test User For SQL Injection Test',
        email: maliciousEmail,
        password: 'TestPass123!',
        address: '123 Security Test Street, Safe City, Secure State',
        role: 'NORMAL_USER'
      };

      try {
        // This should either create a user with the literal email string
        // or fail validation, but should NOT execute SQL injection
        await userService.createUser(userData);
        
        // If it succeeds, verify the email was stored literally
        const user = await prisma.user.findFirst({
          where: { email: maliciousEmail }
        });
        
        if (user) {
          expect(user.email).toBe(maliciousEmail);
          await prisma.user.delete({ where: { id: user.id } });
        }
      } catch (error) {
        // If it fails, that's also acceptable (validation might reject it)
        expect(error).toBeDefined();
      }

      // Verify users table still exists and is functional
      const userCount = await prisma.user.count();
      expect(typeof userCount).toBe('number');
    });
  });

  describe('Integrated Security Flow', () => {
    
    it('should enforce complete security chain: validation -> hashing -> JWT -> RBAC', async () => {
      // Step 1: Create user with validation
      const userData = {
        name: 'Complete Security Test User Name',
        email: 'security@test.com',
        password: 'SecurePass123!',
        address: '789 Security Boulevard, Test City, Test State 11111',
        role: 'NORMAL_USER'
      };

      const user = await userService.createUser(userData);

      // Step 2: Verify password is hashed
      const userFromDb = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(userFromDb.password).not.toBe(userData.password);
      expect(userFromDb.password).toMatch(/^\$2[ab]\$/);

      // Step 3: Generate JWT token
      const token = generateToken(user.id, user.role);
      expect(token).toBeDefined();

      // Step 4: Verify JWT token
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.role).toBe(user.role);

      // Step 5: Test authentication middleware
      const authReq = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const authRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      let authNextCalled = false;
      const authNext = () => { authNextCalled = true; };

      authenticate(authReq, authRes, authNext);
      expect(authNextCalled).toBe(true);
      expect(authReq.user).toBeDefined();

      // Step 6: Test authorization middleware (should pass for NORMAL_USER)
      const normalUserMiddleware = authorize('NORMAL_USER');
      const authzRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      let authzNextCalled = false;
      const authzNext = () => { authzNextCalled = true; };

      normalUserMiddleware(authReq, authzRes, authzNext);
      expect(authzNextCalled).toBe(true);

      // Step 7: Test authorization middleware (should fail for SYSTEM_ADMIN)
      const adminMiddleware = authorize('SYSTEM_ADMIN');
      const adminRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const adminNext = jest.fn();

      adminMiddleware(authReq, adminRes, adminNext);
      expect(adminRes.status).toHaveBeenCalledWith(403);
      expect(adminNext).not.toHaveBeenCalled();
    });
  });
});
