/**
 * Property-Based Tests for Authorization Middleware
 * Feature: store-rating-platform, Property 4: Unauthorized access to role-specific endpoints is prevented
 * Validates: Requirements 1.5
 */

const fc = require('fast-check');
const authorize = require('../middleware/authorize');

describe('Authorization Middleware Property Tests', () => {
  
  describe('Property 4: Unauthorized access to role-specific endpoints is prevented', () => {
    
    it('should reject access when user role is not in allowed roles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }), // userId
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'), // user's actual role
          fc.array(fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'), { minLength: 1, maxLength: 2 }), // allowed roles
          (userId, userRole, allowedRoles) => {
            // Only test cases where user's role is NOT in allowed roles
            if (allowedRoles.includes(userRole)) {
              return true; // Skip this case
            }
            
            const req = {
              user: {
                userId: userId,
                role: userRole
              }
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            // Create authorization middleware with allowed roles
            const authMiddleware = authorize(...allowedRoles);
            authMiddleware(req, res, next);
            
            // Verify 403 status and error response
            return res.status.mock.calls[0][0] === 403 &&
                   res.json.mock.calls[0][0].success === false &&
                   res.json.mock.calls[0][0].error.code === 'FORBIDDEN' &&
                   !next.mock.calls.length; // next() should not be called
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should grant access when user role is in allowed roles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }), // userId
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'), // role
          (userId, role) => {
            const req = {
              user: {
                userId: userId,
                role: role
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
            
            // Create authorization middleware that allows this specific role
            const authMiddleware = authorize(role);
            authMiddleware(req, res, next);
            
            // Verify that next() was called (access granted)
            return nextCalled === true &&
                   !res.status.mock.calls.length; // No error response
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject access when req.user is not set (unauthenticated)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'), { minLength: 1, maxLength: 3 }),
          (allowedRoles) => {
            const req = {}; // No user property
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            const authMiddleware = authorize(...allowedRoles);
            authMiddleware(req, res, next);
            
            // Verify 401 status (unauthenticated)
            return res.status.mock.calls[0][0] === 401 &&
                   res.json.mock.calls[0][0].success === false &&
                   res.json.mock.calls[0][0].error.code === 'UNAUTHENTICATED' &&
                   !next.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should work correctly with multiple allowed roles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'),
          (userId, userRole) => {
            // Test with all three roles allowed
            const req = {
              user: {
                userId: userId,
                role: userRole
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
            
            // Allow all roles
            const authMiddleware = authorize('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER');
            authMiddleware(req, res, next);
            
            // Should always grant access since all roles are allowed
            return nextCalled === true &&
                   !res.status.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should enforce role restrictions for SYSTEM_ADMIN only endpoints', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('NORMAL_USER', 'STORE_OWNER'), // Non-admin roles
          (userId, userRole) => {
            const req = {
              user: {
                userId: userId,
                role: userRole
              }
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            // Only allow SYSTEM_ADMIN
            const authMiddleware = authorize('SYSTEM_ADMIN');
            authMiddleware(req, res, next);
            
            // Should reject non-admin users
            return res.status.mock.calls[0][0] === 403 &&
                   res.json.mock.calls[0][0].success === false &&
                   !next.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should enforce role restrictions for NORMAL_USER only endpoints', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('SYSTEM_ADMIN', 'STORE_OWNER'), // Non-normal-user roles
          (userId, userRole) => {
            const req = {
              user: {
                userId: userId,
                role: userRole
              }
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            // Only allow NORMAL_USER
            const authMiddleware = authorize('NORMAL_USER');
            authMiddleware(req, res, next);
            
            // Should reject non-normal users
            return res.status.mock.calls[0][0] === 403 &&
                   res.json.mock.calls[0][0].success === false &&
                   !next.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should enforce role restrictions for STORE_OWNER only endpoints', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER'), // Non-store-owner roles
          (userId, userRole) => {
            const req = {
              user: {
                userId: userId,
                role: userRole
              }
            };
            
            const res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis()
            };
            
            const next = jest.fn();
            
            // Only allow STORE_OWNER
            const authMiddleware = authorize('STORE_OWNER');
            authMiddleware(req, res, next);
            
            // Should reject non-store-owners
            return res.status.mock.calls[0][0] === 403 &&
                   res.json.mock.calls[0][0].success === false &&
                   !next.mock.calls.length;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
