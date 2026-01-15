/**
 * Property-Based Tests for Password Management
 * Feature: store-rating-platform, Property 25: Password updates work for authenticated users
 * Feature: store-rating-platform, Property 26: Invalid password updates are rejected
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const UserService = require('../services/UserService');
const { comparePassword } = require('../utils/passwordUtils');

const prisma = new PrismaClient();
const userService = new UserService();

// Generator for valid names (20-60 characters)
const validNameArbitrary = fc.string({ minLength: 20, maxLength: 60 })
  .filter(s => s.trim().length >= 20 && s.trim().length <= 60);

// Generator for valid emails
const validEmailArbitrary = fc.emailAddress();

// Generator for valid passwords (8-16 chars with uppercase and special char)
const validPasswordArbitrary = fc.string({ minLength: 6, maxLength: 14 })
  .map(base => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const special = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
    const upperChar = uppercase[Math.floor(Math.random() * uppercase.length)];
    const specialChar = special[Math.floor(Math.random() * special.length)];
    return base + upperChar + specialChar;
  });

// Generator for valid addresses (1-400 characters, non-empty)
const validAddressArbitrary = fc.string({ minLength: 1, maxLength: 400 })
  .filter(s => s.trim().length > 0);

// Generator for valid user data
const validUserDataArbitrary = fc.record({
  name: validNameArbitrary,
  email: validEmailArbitrary,
  password: validPasswordArbitrary,
  address: validAddressArbitrary
});

describe('Property 25: Password updates work for authenticated users', () => {
  
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

  it('should successfully update password for any authenticated user with valid new password', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        validPasswordArbitrary,
        async (userData, newPassword) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Update the password
            const updatedUser = await userService.updatePassword(user.id, newPassword);

            // Verify the update was successful
            expect(updatedUser).toBeDefined();
            expect(updatedUser.id).toBe(user.id);
            expect(updatedUser.email).toBe(user.email);
            expect(updatedUser.password).toBeUndefined(); // Password should not be returned

            // Verify the new password works by fetching user with password and comparing
            const userWithPassword = await prisma.user.findUnique({
              where: { id: user.id }
            });

            const passwordMatches = await comparePassword(newPassword, userWithPassword.password);
            expect(passwordMatches).toBe(true);

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error with valid password update:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should allow password update for any user role (NORMAL_USER, STORE_OWNER, SYSTEM_ADMIN)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        fc.constantFrom('NORMAL_USER', 'STORE_OWNER', 'SYSTEM_ADMIN'),
        validPasswordArbitrary,
        async (userData, role, newPassword) => {
          try {
            // Create a user with specific role
            const user = await userService.createUser({
              ...userData,
              role
            });

            // Update the password
            const updatedUser = await userService.updatePassword(user.id, newPassword);

            // Verify the update was successful
            expect(updatedUser).toBeDefined();
            expect(updatedUser.id).toBe(user.id);
            expect(updatedUser.role).toBe(role);

            // Verify the new password is correctly hashed
            const userWithPassword = await prisma.user.findUnique({
              where: { id: user.id }
            });

            const passwordMatches = await comparePassword(newPassword, userWithPassword.password);
            expect(passwordMatches).toBe(true);

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error with role-based password update:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should not return password in response for any password update', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        validPasswordArbitrary,
        async (userData, newPassword) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Update the password
            const updatedUser = await userService.updatePassword(user.id, newPassword);

            // Verify password is not in returned object
            expect(updatedUser.password).toBeUndefined();
            expect(updatedUser).not.toHaveProperty('password');

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should allow multiple password updates for the same user', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        fc.array(validPasswordArbitrary, { minLength: 2, maxLength: 3 }),
        async (userData, newPasswords) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Update password multiple times
            for (const newPassword of newPasswords) {
              const updatedUser = await userService.updatePassword(user.id, newPassword);
              expect(updatedUser).toBeDefined();

              // Verify the latest password works
              const userWithPassword = await prisma.user.findUnique({
                where: { id: user.id }
              });

              const passwordMatches = await comparePassword(newPassword, userWithPassword.password);
              expect(passwordMatches).toBe(true);
            }

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error with multiple password updates:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);
});

describe('Property 26: Invalid password updates are rejected', () => {
  
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

  it('should reject password updates with invalid length (too short or too long)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 7 }),
          fc.string({ minLength: 17, maxLength: 30 })
        ),
        async (userData, invalidPassword) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Try to update with invalid password
            try {
              await userService.updatePassword(user.id, invalidPassword);
              // If no error thrown, test fails
              await prisma.user.delete({ where: { id: user.id } });
              return false;
            } catch (error) {
              // Should throw error for invalid password
              expect(error.message).toBeDefined();
              expect(error.message).toContain('Password');

              // Verify password was not changed
              const userWithPassword = await prisma.user.findUnique({
                where: { id: user.id }
              });

              // Original password should still work
              const originalPasswordMatches = await comparePassword(userData.password, userWithPassword.password);
              expect(originalPasswordMatches).toBe(true);

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });
              return true;
            }
          } catch (error) {
            console.error('Unexpected error in test setup:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should reject password updates missing uppercase letter', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        fc.string({ minLength: 8, maxLength: 16 }).filter(s => !/[A-Z]/.test(s)),
        async (userData, invalidPassword) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Try to update with password missing uppercase
            try {
              await userService.updatePassword(user.id, invalidPassword);
              // If no error thrown, test fails
              await prisma.user.delete({ where: { id: user.id } });
              return false;
            } catch (error) {
              // Should throw error for invalid password
              expect(error.message).toBeDefined();
              expect(error.message).toContain('Password');

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });
              return true;
            }
          } catch (error) {
            console.error('Unexpected error in test setup:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should reject password updates missing special character', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        fc.string({ minLength: 8, maxLength: 16 }).filter(s => !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)),
        async (userData, invalidPassword) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Try to update with password missing special character
            try {
              await userService.updatePassword(user.id, invalidPassword);
              // If no error thrown, test fails
              await prisma.user.delete({ where: { id: user.id } });
              return false;
            } catch (error) {
              // Should throw error for invalid password
              expect(error.message).toBeDefined();
              expect(error.message).toContain('Password');

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });
              return true;
            }
          } catch (error) {
            console.error('Unexpected error in test setup:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should reject password updates for non-existent users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 999999, max: 9999999 }), // Non-existent user ID
        validPasswordArbitrary,
        async (nonExistentUserId, newPassword) => {
          try {
            await userService.updatePassword(nonExistentUserId, newPassword);
            // If no error thrown, test fails
            return false;
          } catch (error) {
            // Should throw error for non-existent user
            expect(error.message).toBeDefined();
            expect(error.message).toContain('User not found');
            return true;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should not modify database when password validation fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        fc.string({ minLength: 0, maxLength: 7 }), // Invalid password (too short)
        async (userData, invalidPassword) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Get original password hash
            const originalUser = await prisma.user.findUnique({
              where: { id: user.id }
            });
            const originalPasswordHash = originalUser.password;

            // Try to update with invalid password
            try {
              await userService.updatePassword(user.id, invalidPassword);
              await prisma.user.delete({ where: { id: user.id } });
              return false;
            } catch (error) {
              // Verify password hash was not changed
              const unchangedUser = await prisma.user.findUnique({
                where: { id: user.id }
              });
              expect(unchangedUser.password).toBe(originalPasswordHash);

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });
              return true;
            }
          } catch (error) {
            console.error('Unexpected error in test setup:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should return specific error messages for different validation failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 7 }), // Too short
          fc.string({ minLength: 17, maxLength: 30 }), // Too long
          fc.string({ minLength: 8, maxLength: 16 }).filter(s => !/[A-Z]/.test(s)), // No uppercase
          fc.string({ minLength: 8, maxLength: 16 }).filter(s => !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)) // No special char
        ),
        async (userData, invalidPassword) => {
          try {
            // Create a user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Try to update with invalid password
            try {
              await userService.updatePassword(user.id, invalidPassword);
              await prisma.user.delete({ where: { id: user.id } });
              return false;
            } catch (error) {
              // Should have a specific error message
              expect(error.message).toBeDefined();
              expect(error.message.length).toBeGreaterThan(0);
              expect(error.message).toContain('Password');

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });
              return true;
            }
          } catch (error) {
            console.error('Unexpected error in test setup:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);
});
