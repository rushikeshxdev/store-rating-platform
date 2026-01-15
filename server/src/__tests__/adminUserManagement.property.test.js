/**
 * Property-Based Tests for Admin User Management
 * Feature: store-rating-platform, Property 8: System administrators can create users with any role
 * Feature: store-rating-platform, Property 9: Admin-created users follow same validation rules
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7
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

// Generator for valid user roles
const validRoleArbitrary = fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER');

// Generator for valid user data with role
const validUserDataWithRoleArbitrary = fc.record({
  name: validNameArbitrary,
  email: validEmailArbitrary,
  password: validPasswordArbitrary,
  address: validAddressArbitrary,
  role: validRoleArbitrary
});

describe('Property 8: System administrators can create users with any role', () => {
  
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

  it('should create users with SYSTEM_ADMIN role when specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        validEmailArbitrary,
        validPasswordArbitrary,
        validAddressArbitrary,
        async (name, email, password, address) => {
          try {
            // Create user with SYSTEM_ADMIN role
            const user = await userService.createUser({
              name,
              email,
              password,
              address,
              role: 'SYSTEM_ADMIN'
            });

            // Verify user was created with correct role
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.role).toBe('SYSTEM_ADMIN');
            expect(user.name).toBe(name.trim());
            expect(user.email).toBe(email);
            expect(user.address).toBe(address.trim());

            // Verify in database
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            });
            expect(dbUser).toBeDefined();
            expect(dbUser.role).toBe('SYSTEM_ADMIN');

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error creating SYSTEM_ADMIN:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should create users with NORMAL_USER role when specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        validEmailArbitrary,
        validPasswordArbitrary,
        validAddressArbitrary,
        async (name, email, password, address) => {
          try {
            // Create user with NORMAL_USER role
            const user = await userService.createUser({
              name,
              email,
              password,
              address,
              role: 'NORMAL_USER'
            });

            // Verify user was created with correct role
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.role).toBe('NORMAL_USER');

            // Verify in database
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            });
            expect(dbUser).toBeDefined();
            expect(dbUser.role).toBe('NORMAL_USER');

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error creating NORMAL_USER:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should create users with STORE_OWNER role when specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        validEmailArbitrary,
        validPasswordArbitrary,
        validAddressArbitrary,
        async (name, email, password, address) => {
          try {
            // Create user with STORE_OWNER role
            const user = await userService.createUser({
              name,
              email,
              password,
              address,
              role: 'STORE_OWNER'
            });

            // Verify user was created with correct role
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.role).toBe('STORE_OWNER');

            // Verify in database
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            });
            expect(dbUser).toBeDefined();
            expect(dbUser.role).toBe('STORE_OWNER');

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error creating STORE_OWNER:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should create users with any valid role for any valid user data', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataWithRoleArbitrary,
        async (userData) => {
          try {
            // Create user with specified role
            const user = await userService.createUser(userData);

            // Verify user was created with correct role
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.role).toBe(userData.role);
            expect(user.name).toBe(userData.name.trim());
            expect(user.email).toBe(userData.email);
            expect(user.address).toBe(userData.address.trim());
            expect(user.password).toBeUndefined(); // Password should not be returned

            // Verify in database
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            });
            expect(dbUser).toBeDefined();
            expect(dbUser.role).toBe(userData.role);

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error creating user with role:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);
});

describe('Property 9: Admin-created users follow same validation rules', () => {
  
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

  it('should reject admin-created users with invalid name (too short or too long)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 19 }),
          fc.string({ minLength: 61, maxLength: 100 })
        ),
        validEmailArbitrary,
        validPasswordArbitrary,
        validAddressArbitrary,
        validRoleArbitrary,
        async (invalidName, email, password, address, role) => {
          try {
            await userService.createUser({
              name: invalidName,
              email,
              password,
              address,
              role
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

  it('should reject admin-created users with invalid email format', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        fc.string().filter(s => !s.includes('@')),
        validPasswordArbitrary,
        validAddressArbitrary,
        validRoleArbitrary,
        async (name, invalidEmail, password, address, role) => {
          try {
            await userService.createUser({
              name,
              email: invalidEmail,
              password,
              address,
              role
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

  it('should reject admin-created users with invalid password', async () => {
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
        validRoleArbitrary,
        async (name, email, invalidPassword, address, role) => {
          try {
            await userService.createUser({
              name,
              email,
              password: invalidPassword,
              address,
              role
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

  it('should reject admin-created users with invalid address', async () => {
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
        validRoleArbitrary,
        async (name, email, password, invalidAddress, role) => {
          try {
            await userService.createUser({
              name,
              email,
              password,
              address: invalidAddress,
              role
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

  it('should reject admin-created users with duplicate email regardless of role', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataWithRoleArbitrary,
        validRoleArbitrary,
        async (userData, secondRole) => {
          try {
            // Create first user with one role
            const firstUser = await userService.createUser(userData);

            // Try to create second user with same email but different role
            try {
              await userService.createUser({
                name: userData.name,
                email: userData.email, // Same email
                password: userData.password,
                address: userData.address,
                role: secondRole // Different role
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

  it('should apply same validation rules regardless of role being created', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserDataWithRoleArbitrary,
        async (userData) => {
          try {
            // Create user with any role
            const user = await userService.createUser(userData);

            // Verify all validation rules were applied
            expect(user.name.length).toBeGreaterThanOrEqual(20);
            expect(user.name.length).toBeLessThanOrEqual(60);
            expect(user.email).toContain('@');
            expect(user.address.length).toBeGreaterThan(0);
            expect(user.address.length).toBeLessThanOrEqual(400);
            expect(user.password).toBeUndefined(); // Password should be hashed and not returned

            // Verify password was hashed (check in database)
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            });
            expect(dbUser.password).toBeDefined();
            expect(dbUser.password).not.toBe(userData.password); // Should be hashed

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });

            return true;
          } catch (error) {
            console.error('Unexpected error in validation test:', error.message);
            return false;
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should not create any user record when validation fails for admin-created users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 19 }).filter(s => s.trim().length < 20), // Invalid name
        validEmailArbitrary,
        validPasswordArbitrary,
        validAddressArbitrary,
        validRoleArbitrary,
        async (invalidName, email, password, address, role) => {
          const userCountBefore = await prisma.user.count();

          try {
            await userService.createUser({
              name: invalidName,
              email,
              password,
              address,
              role
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
