/**
 * Property-Based Tests for User Registration
 * Feature: store-rating-platform, Property 6: Valid registration creates Normal User account
 * Feature: store-rating-platform, Property 7: Invalid registration prevents account creation
 * Validates: Requirements 2.6, 2.7
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const UserService = require('../services/UserService');

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

describe('Property 6: Valid registration creates Normal User account', () => {
  
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

  it('should create a Normal User account for any valid registration data', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        async (userData) => {
          try {
            // Create user
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Verify user was created
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.name).toBe(userData.name.trim());
            expect(user.email).toBe(userData.email);
            expect(user.address).toBe(userData.address.trim());
            expect(user.role).toBe('NORMAL_USER');
            expect(user.password).toBeUndefined(); // Password should not be returned

            // Verify user exists in database
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            });
            expect(dbUser).toBeDefined();
            expect(dbUser.role).toBe('NORMAL_USER');

            // Clean up this specific user
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            // If error occurs with valid data, test fails
            console.error('Unexpected error with valid data:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should return user data without password for any valid registration', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        async (userData) => {
          try {
            const user = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Verify password is not in returned object
            expect(user.password).toBeUndefined();
            expect(user).not.toHaveProperty('password');

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
  }, 30000);
});

describe('Property 7: Invalid registration prevents account creation', () => {
  
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

  it('should reject registration with invalid name (too short or too long)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 19 }),
          fc.string({ minLength: 61, maxLength: 100 })
        ),
        validEmailArbitrary,
        validPasswordArbitrary,
        validAddressArbitrary,
        async (invalidName, email, password, address) => {
          try {
            await userService.createUser({
              name: invalidName,
              email,
              password,
              address,
              role: 'NORMAL_USER'
            });
            // If no error thrown, test fails
            return false;
          } catch (error) {
            // Should throw error for invalid name
            expect(error.message).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject registration with invalid email format', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        fc.string().filter(s => !s.includes('@')),
        validPasswordArbitrary,
        validAddressArbitrary,
        async (name, invalidEmail, password, address) => {
          try {
            await userService.createUser({
              name,
              email: invalidEmail,
              password,
              address,
              role: 'NORMAL_USER'
            });
            // If no error thrown, test fails
            return false;
          } catch (error) {
            // Should throw error for invalid email
            expect(error.message).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject registration with invalid password (too short, too long, or missing requirements)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        validEmailArbitrary,
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 7 }),
          fc.string({ minLength: 17, maxLength: 30 }),
          fc.string({ minLength: 8, maxLength: 16 }).filter(s => !/[A-Z]/.test(s)),
          fc.string({ minLength: 8, maxLength: 16 }).filter(s => !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s))
        ),
        validAddressArbitrary,
        async (name, email, invalidPassword, address) => {
          try {
            await userService.createUser({
              name,
              email,
              password: invalidPassword,
              address,
              role: 'NORMAL_USER'
            });
            // If no error thrown, test fails
            return false;
          } catch (error) {
            // Should throw error for invalid password
            expect(error.message).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject registration with invalid address (too long or empty)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        validEmailArbitrary,
        validPasswordArbitrary,
        fc.oneof(
          fc.string({ minLength: 401, maxLength: 500 }),
          fc.constant(''),
          fc.constant('   ')
        ),
        async (name, email, password, invalidAddress) => {
          try {
            await userService.createUser({
              name,
              email,
              password,
              address: invalidAddress,
              role: 'NORMAL_USER'
            });
            // If no error thrown, test fails
            return false;
          } catch (error) {
            // Should throw error for invalid address
            expect(error.message).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject registration with duplicate email', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataArbitrary,
        async (userData) => {
          try {
            // Create first user
            const firstUser = await userService.createUser({
              ...userData,
              role: 'NORMAL_USER'
            });

            // Try to create second user with same email
            try {
              await userService.createUser({
                name: userData.name,
                email: userData.email, // Same email
                password: userData.password,
                address: userData.address,
                role: 'NORMAL_USER'
              });
              // If no error thrown, test fails
              await prisma.user.delete({ where: { id: firstUser.id } });
              return false;
            } catch (error) {
              // Should throw error for duplicate email
              expect(error.message).toContain('Email already exists');
              await prisma.user.delete({ where: { id: firstUser.id } });
              return true;
            }
          } catch (error) {
            console.error('Unexpected error in duplicate email test:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should not create any user record when validation fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 19 }).filter(s => s.trim().length < 20), // Invalid name (ensure trimmed length is < 20)
        validEmailArbitrary,
        validPasswordArbitrary,
        validAddressArbitrary,
        async (invalidName, email, password, address) => {
          const userCountBefore = await prisma.user.count();

          try {
            await userService.createUser({
              name: invalidName,
              email,
              password,
              address,
              role: 'NORMAL_USER'
            });
            return false;
          } catch (error) {
            // Verify no user was created
            const userCountAfter = await prisma.user.count();
            expect(userCountAfter).toBe(userCountBefore);
            return true;
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
