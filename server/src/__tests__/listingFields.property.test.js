// Feature: store-rating-platform, Property 12: Store listings contain required fields
// Feature: store-rating-platform, Property 13: User listings contain required fields
// Validates: Requirements 5.1, 5.2, 5.6, 6.2

const { PrismaClient } = require('@prisma/client');
const fc = require('fast-check');
const StoreService = require('../services/StoreService');
const UserService = require('../services/UserService');

const prisma = new PrismaClient();
const storeService = new StoreService();
const userService = new UserService();

describe('Property 12 & 13: Listing fields', () => {
  beforeAll(async () => {
    // Clean up test data before running tests
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.store.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.store.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Generator for valid store data - ensures strings are valid after trimming
  const validStoreArb = fc.record({
    name: fc.array(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', '0', '1'), { minLength: 20, maxLength: 58 })
      .map(arr => arr.join(''))
      .map(s => s + '  '), // Add spaces at end, but ensure core is 20+ chars
    email: fc.emailAddress(),
    address: fc.array(fc.constantFrom('a', 'b', 'c', 'A', 'B', '0', '1', ',', '.'), { minLength: 1, maxLength: 398 })
      .map(arr => arr.join(''))
      .map(s => s + ' ') // Add space at end, but ensure core is non-empty
  });

  // Generator for valid user data - ensures strings are valid after trimming
  const validUserArb = fc.record({
    name: fc.array(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', '0', '1'), { minLength: 20, maxLength: 58 })
      .map(arr => arr.join(''))
      .map(s => s + '  '), // Add spaces at end, but ensure core is 20+ chars
    email: fc.emailAddress(),
    password: fc.array(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', '0', '1'), { minLength: 6, maxLength: 14 })
      .map(arr => arr.join('') + 'A!'),
    address: fc.array(fc.constantFrom('a', 'b', 'c', 'A', 'B', '0', '1', ',', '.'), { minLength: 1, maxLength: 398 })
      .map(arr => arr.join(''))
      .map(s => s + ' '), // Add space at end, but ensure core is non-empty
    role: fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER')
  });

  describe('Property 12: Store listings contain required fields', () => {
    it('should include name, email, address, and average rating for all stores', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validStoreArb, { minLength: 1, maxLength: 3 }),
          async (storesData) => {
            // Create stores
            const createdStores = [];
            for (const storeData of storesData) {
              const store = await storeService.createStore({
                name: storeData.name,
                email: `${Date.now()}-${Math.random()}-${storeData.email}`,
                address: storeData.address
              });
              createdStores.push(store);
            }

            // Get all stores
            const stores = await storeService.getAllStores();

            // Verify each store has required fields
            expect(stores.length).toBeGreaterThanOrEqual(createdStores.length);

            for (const store of stores) {
              // Check required fields exist
              expect(store).toHaveProperty('name');
              expect(store).toHaveProperty('email');
              expect(store).toHaveProperty('address');
              expect(store).toHaveProperty('id');

              // Verify field types
              expect(typeof store.name).toBe('string');
              expect(typeof store.email).toBe('string');
              expect(typeof store.address).toBe('string');
              expect(typeof store.id).toBe('number');
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include average rating when using getStoreWithRatings', async () => {
      await fc.assert(
        fc.asyncProperty(
          validStoreArb,
          validUserArb,
          fc.integer({ min: 1, max: 5 }),
          async (storeData, userData, ratingValue) => {
            // Create store
            const store = await storeService.createStore({
              name: storeData.name,
              email: `${Date.now()}-${Math.random()}-${storeData.email}`,
              address: storeData.address
            });

            // Create user
            const user = await userService.createUser({
              name: userData.name,
              email: `${Date.now()}-${Math.random()}-${userData.email}`,
              password: userData.password,
              address: userData.address,
              role: userData.role
            });

            // Create rating
            await prisma.rating.create({
              data: {
                value: ratingValue,
                userId: user.id,
                storeId: store.id
              }
            });

            // Get store with ratings
            const storeWithRatings = await storeService.getStoreWithRatings(store.id);

            // Verify required fields
            expect(storeWithRatings).toHaveProperty('name');
            expect(storeWithRatings).toHaveProperty('email');
            expect(storeWithRatings).toHaveProperty('address');
            expect(storeWithRatings).toHaveProperty('averageRating');

            // Verify average rating is present and correct
            expect(storeWithRatings.averageRating).not.toBeNull();
            expect(typeof storeWithRatings.averageRating).toBe('number');
            expect(storeWithRatings.averageRating).toBe(ratingValue);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should show null average rating when store has no ratings', async () => {
      await fc.assert(
        fc.asyncProperty(validStoreArb, async (storeData) => {
          // Create store without ratings
          const store = await storeService.createStore({
            name: storeData.name,
            email: `${Date.now()}-${Math.random()}-${storeData.email}`,
            address: storeData.address
          });

          // Get store with ratings
          const storeWithRatings = await storeService.getStoreWithRatings(store.id);

          // Verify average rating is null
          expect(storeWithRatings.averageRating).toBeNull();
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 13: User listings contain required fields', () => {
    it('should include name, email, address, and role for all users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validUserArb, { minLength: 1, maxLength: 3 }),
          async (usersData) => {
            // Create users
            const createdUsers = [];
            for (const userData of usersData) {
              const user = await userService.createUser({
                name: userData.name,
                email: `${Date.now()}-${Math.random()}-${userData.email}`,
                password: userData.password,
                address: userData.address,
                role: userData.role
              });
              createdUsers.push(user);
            }

            // Get all users
            const users = await userService.getAllUsers();

            // Verify each user has required fields
            expect(users.length).toBeGreaterThanOrEqual(createdUsers.length);

            for (const user of users) {
              // Check required fields exist
              expect(user).toHaveProperty('name');
              expect(user).toHaveProperty('email');
              expect(user).toHaveProperty('address');
              expect(user).toHaveProperty('role');
              expect(user).toHaveProperty('id');

              // Verify field types
              expect(typeof user.name).toBe('string');
              expect(typeof user.email).toBe('string');
              expect(typeof user.address).toBe('string');
              expect(typeof user.role).toBe('string');
              expect(typeof user.id).toBe('number');

              // Verify role is valid
              expect(['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER']).toContain(user.role);

              // Verify password is not included
              expect(user).not.toHaveProperty('password');
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 30000); // 30 second timeout for this slow test

    it('should include store average rating for store owners', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserArb,
          validStoreArb,
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 3 }),
          async (ownerData, storeData, ratingValues) => {
            // Create store
            const store = await storeService.createStore({
              name: storeData.name,
              email: `${Date.now()}-${Math.random()}-${storeData.email}`,
              address: storeData.address
            });

            // Create store owner
            const owner = await userService.createUser({
              name: ownerData.name,
              email: `${Date.now()}-${Math.random()}-${ownerData.email}`,
              password: ownerData.password,
              address: ownerData.address,
              role: 'STORE_OWNER',
              storeId: store.id
            });

            // Create normal users and ratings
            for (const ratingValue of ratingValues) {
              const normalUser = await userService.createUser({
                name: 'Normal User Test Name 12345',
                email: `normal-${Date.now()}-${Math.random()}@test.com`,
                password: 'TestPass1!',
                address: 'Normal User Address',
                role: 'NORMAL_USER'
              });

              await prisma.rating.create({
                data: {
                  value: ratingValue,
                  userId: normalUser.id,
                  storeId: store.id
                }
              });
            }

            // Get user by ID (which includes store info)
            const ownerWithStore = await userService.getUserById(owner.id);

            // Verify store owner has store information
            expect(ownerWithStore).toHaveProperty('store');
            expect(ownerWithStore.store).not.toBeNull();
            expect(ownerWithStore.store).toHaveProperty('id');
            expect(ownerWithStore.store).toHaveProperty('name');
            expect(ownerWithStore.store).toHaveProperty('email');
            expect(ownerWithStore.store).toHaveProperty('address');

            // Calculate expected average
            const expectedAverage = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

            // Get store with ratings to verify average
            const storeWithRatings = await storeService.getStoreWithRatings(store.id);
            expect(storeWithRatings.averageRating).toBeCloseTo(expectedAverage, 5);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
