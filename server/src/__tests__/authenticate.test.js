/**
 * Property-Based Tests for Authentication Middleware
 * Feature: store-rating-platform, Property 1: Authentication with valid credentials grants role-appropriate access
 * Feature: store-rating-platform, Property 2: Authentication with invalid credentials is rejected
 * Validates: Requirements 1.2, 1.3
 */

const fc = require('fast-check');
const authenticate = require('../middleware/authenticate');
const { generateToken } = require('../utils/jwtUtils');

describe('Authentication Middleware Property Tests', () => {
  
  describe('Property 1: Authentication with valid credentials grants role-appropriate access', () => {
    
    it('should grant access for any valid token with userId and role', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }), // userId
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'), // role
          (userId, role) => {
            // Generate a valid token
            const token = generateToken(userId, role);
            
            // Create mock request, response, and next
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
            
            // Call authenticate middleware
            authenticate(req, res, next);
            
            // Verify that next() was called (access granted)
            // Verify that req.user was populated with correct data
            return nextCalled === true &&
                   req.user !== undefined &&
                   req.user.userId === userId &&
                   req.user.role === role &&
                   !res.status.mock.calls.length; // No error response
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should attach correct user info to request for any valid token', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'),
          (userId, role) => {
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
            
            const next = jest.fn();
            
            authenticate(req, res, next);
            
            // Verify req.user contains the correct userId and role
            return req.user &&
                   req.user.userId === userId &&
                   req.user.role === role;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 2: Authentication with invalid credentials is rejected', () => {
    
    it('should reject requests with missing authorization header', () => {
      fc.assert(
        fc.property(
          fc.constant(undefined), // No authorization header
          () => {
            const req = {
              headers: {}
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            authenticate(req, res, next);
            
            // Verify 401 status and error response
            return res.status.mock.calls[0][0] === 401 &&
                   res.json.mock.calls[0][0].success === false &&
                   res.json.mock.calls[0][0].error.code === 'MISSING_TOKEN' &&
                   !next.mock.calls.length; // next() should not be called
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject requests with malformed authorization header', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string().filter(s => !s.startsWith('Bearer ')), // Invalid format
            fc.constant('Bearer'), // Missing token
            fc.constant(''), // Empty string
            fc.string().map(s => `InvalidPrefix ${s}`) // Wrong prefix
          ),
          (authHeader) => {
            const req = {
              headers: {
                authorization: authHeader
              }
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            authenticate(req, res, next);
            
            // Verify 401 status and error response
            return res.status.mock.calls[0][0] === 401 &&
                   res.json.mock.calls[0][0].success === false &&
                   !next.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject requests with invalid JWT tokens', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }).filter(s => {
            // Filter out strings that might accidentally be valid JWTs
            // Also filter out whitespace-only strings
            const trimmed = s.trim();
            return trimmed.length > 0 && (!s.includes('.') || s.split('.').length !== 3);
          }),
          (invalidToken) => {
            const req = {
              headers: {
                authorization: `Bearer ${invalidToken}`
              }
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            authenticate(req, res, next);
            
            // Verify 401 status and error response (any error code is acceptable)
            return res.status.mock.calls[0][0] === 401 &&
                   res.json.mock.calls[0][0].success === false &&
                   res.json.mock.calls[0][0].error !== undefined &&
                   !next.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject requests with tampered JWT tokens', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'),
          fc.string({ minLength: 1, maxLength: 10 }),
          (userId, role, randomSuffix) => {
            // Generate a valid token then tamper with it
            const validToken = generateToken(userId, role);
            const tamperedToken = validToken + randomSuffix;
            
            const req = {
              headers: {
                authorization: `Bearer ${tamperedToken}`
              }
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            authenticate(req, res, next);
            
            // Verify 401 status and error response
            return res.status.mock.calls[0][0] === 401 &&
                   res.json.mock.calls[0][0].success === false &&
                   !next.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not call next() for any invalid authentication attempt', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(undefined), // No header
            fc.string(), // Random string
            fc.constant('') // Empty string
          ),
          (authHeader) => {
            const req = {
              headers: authHeader !== undefined ? { authorization: authHeader } : {}
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            authenticate(req, res, next);
            
            // Verify next() was never called
            return next.mock.calls.length === 0;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
