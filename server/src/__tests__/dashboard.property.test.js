/**
 * Property-Based Tests for Dashboard Statistics
 * Feature: store-rating-platform
 * Property 11: Dashboard statistics accurately count entities
 * Property 22: Store owners see all ratings for their store
 * Property 24: Store owners can only access their own store data
 * Validates: Requirements 4.1, 4.2, 4.3, 8.1, 8.5
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const DashboardService = require('../services/DashboardService');

const prisma = new PrismaClient();
const dashboardService = new DashboardService();

describe('Dashboard Statistics Property Tests', () => {
  
  beforeAll(async () => {
    // Clean up test data before running tests
    await prisma.rating.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await prisma.rating.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Property 11: Dashboard statistics accurately count entities', () => {
    
    // Generator for number of entities to create
    const entityCountArbitrary = fc.integer({ min: 1, max: 10 });
    
    it('should accurately count all users in the system', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityCountArbitrary,
          async (userCount) => {
            try {
              // Get initial count
              const initialStats = await dashboardService.getAdminStats();
              const initialUserCount = initialStats.totalUsers;

              // Create users
              const createdUsers = [];
              for (let i = 0; i < userCount; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Count Property Valid Name`,
                    email: `count-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Count Property`,
                    role: 'NORMAL_USER'
                  }
                });
                createdUsers.push(user);
              }

              // Get new stats
              const newStats = await dashboardService.getAdminStats();
              const newUserCount = newStats.totalUsers;

              // Verify count increased by exactly userCount
              const isAccurate = (newUserCount - initialUserCount) === userCount;

              // Clean up
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }

              return isAccurate;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'count-user' } }
                });
                for (const user of users) {
                  await prisma.user.delete({ where: { id: user.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accurately count all stores in the system', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityCountArbitrary,
          async (storeCount) => {
            try {
              // Get initial count
              const initialStats = await dashboardService.getAdminStats();
              const initialStoreCount = initialStats.totalStores;

              // Create stores
              const createdStores = [];
              for (let i = 0; i < storeCount; i++) {
                const store = await prisma.store.create({
                  data: {
                    name: `Test Store ${i} For Count Property Valid Name`,
                    email: `count-store-${i}-${Date.now()}-${Math.random()}@example.com`,
                    address: `Test Store ${i} Address For Count Property`
                  }
                });
                createdStores.push(store);
              }

              // Get new stats
              const newStats = await dashboardService.getAdminStats();
              const newStoreCount = newStats.totalStores;

              // Verify count increased by exactly storeCount
              const isAccurate = (newStoreCount - initialStoreCount) === storeCount;

              // Clean up
              for (const store of createdStores) {
                await prisma.store.delete({ where: { id: store.id } });
              }

              return isAccurate;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'count-store' } }
                });
                for (const store of stores) {
                  await prisma.store.delete({ where: { id: store.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accurately count all ratings in the system', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityCountArbitrary,
          async (ratingCount) => {
            try {
              // Get initial count
              const initialStats = await dashboardService.getAdminStats();
              const initialRatingCount = initialStats.totalRatings;

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Rating Count Property Valid Name',
                  email: `rating-count-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Rating Count Property'
                }
              });

              // Create users and ratings
              const createdUsers = [];
              for (let i = 0; i < ratingCount; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Rating Count Property Valid Name`,
                    email: `rating-count-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Rating Count Property`,
                    role: 'NORMAL_USER'
                  }
                });

                await prisma.rating.create({
                  data: {
                    value: (i % 5) + 1, // Cycle through 1-5
                    userId: user.id,
                    storeId: store.id
                  }
                });

                createdUsers.push(user);
              }

              // Get new stats
              const newStats = await dashboardService.getAdminStats();
              const newRatingCount = newStats.totalRatings;

              // Verify count increased by exactly ratingCount
              const isAccurate = (newRatingCount - initialRatingCount) === ratingCount;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return isAccurate;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'rating-count-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'rating-count-store' } }
                });
                
                for (const user of users) {
                  await prisma.rating.deleteMany({ where: { userId: user.id } });
                  await prisma.user.delete({ where: { id: user.id } });
                }
                for (const store of stores) {
                  await prisma.rating.deleteMany({ where: { storeId: store.id } });
                  await prisma.store.delete({ where: { id: store.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accurately count all entity types simultaneously', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityCountArbitrary,
          entityCountArbitrary,
          entityCountArbitrary,
          async (userCount, storeCount, ratingsPerStore) => {
            try {
              // Get initial counts
              const initialStats = await dashboardService.getAdminStats();

              // Create users
              const createdUsers = [];
              for (let i = 0; i < userCount; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Multi Count Property Valid Name`,
                    email: `multi-count-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Multi Count Property`,
                    role: 'NORMAL_USER'
                  }
                });
                createdUsers.push(user);
              }

              // Create stores
              const createdStores = [];
              for (let i = 0; i < storeCount; i++) {
                const store = await prisma.store.create({
                  data: {
                    name: `Test Store ${i} For Multi Count Property Valid Name`,
                    email: `multi-count-store-${i}-${Date.now()}-${Math.random()}@example.com`,
                    address: `Test Store ${i} Address For Multi Count Property`
                  }
                });
                createdStores.push(store);
              }

              // Create ratings (ratingsPerStore for each store)
              let totalRatingsCreated = 0;
              for (const store of createdStores) {
                for (let i = 0; i < ratingsPerStore && i < createdUsers.length; i++) {
                  await prisma.rating.create({
                    data: {
                      value: (i % 5) + 1,
                      userId: createdUsers[i].id,
                      storeId: store.id
                    }
                  });
                  totalRatingsCreated++;
                }
              }

              // Get new stats
              const newStats = await dashboardService.getAdminStats();

              // Verify all counts
              const usersAccurate = (newStats.totalUsers - initialStats.totalUsers) === userCount;
              const storesAccurate = (newStats.totalStores - initialStats.totalStores) === storeCount;
              const ratingsAccurate = (newStats.totalRatings - initialStats.totalRatings) === totalRatingsCreated;

              // Clean up
              for (const store of createdStores) {
                await prisma.rating.deleteMany({ where: { storeId: store.id } });
                await prisma.store.delete({ where: { id: store.id } });
              }
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }

              return usersAccurate && storesAccurate && ratingsAccurate;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'multi-count-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'multi-count-store' } }
                });
                
                for (const user of users) {
                  await prisma.rating.deleteMany({ where: { userId: user.id } });
                  await prisma.user.delete({ where: { id: user.id } });
                }
                for (const store of stores) {
                  await prisma.rating.deleteMany({ where: { storeId: store.id } });
                  await prisma.store.delete({ where: { id: store.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 22: Store owners see all ratings for their store', () => {
    
    // Generator for rating values
    const validRatingArbitrary = fc.integer({ min: 1, max: 5 });
    
    // Generator for arrays of ratings
    const ratingsArrayArbitrary = fc.array(validRatingArbitrary, { minLength: 1, maxLength: 10 });

    it('should return all ratings for store owner\'s store', async () => {
      await fc.assert(
        fc.asyncProperty(
          ratingsArrayArbitrary,
          async (ratingValues) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Owner Ratings Property Valid Name',
                  email: `owner-ratings-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Owner Ratings Property'
                }
              });

              // Create store owner
              const owner = await prisma.user.create({
                data: {
                  name: 'Test Owner For Ratings Property Valid Name',
                  email: `owner-ratings-owner-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Owner Address For Ratings Property',
                  role: 'STORE_OWNER',
                  storeId: store.id
                }
              });

              // Create users and ratings
              const createdUsers = [];
              for (let i = 0; i < ratingValues.length; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Owner Ratings Property Valid Name`,
                    email: `owner-ratings-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Owner Ratings Property`,
                    role: 'NORMAL_USER'
                  }
                });

                await prisma.rating.create({
                  data: {
                    value: ratingValues[i],
                    userId: user.id,
                    storeId: store.id
                  }
                });

                createdUsers.push(user);
              }

              // Get owner stats
              const stats = await dashboardService.getOwnerStats(owner.id);

              // Verify all ratings are returned
              const allRatingsReturned = stats.ratings.length === ratingValues.length;
              
              // Verify each rating is present
              const allValuesPresent = ratingValues.every(value => 
                stats.ratings.some(rating => rating.value === value)
              );

              // Verify total count matches
              const countMatches = stats.totalRatings === ratingValues.length;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              await prisma.user.delete({ where: { id: owner.id } });
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return allRatingsReturned && allValuesPresent && countMatches;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'owner-ratings' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'owner-ratings-store' } }
                });
                
                for (const user of users) {
                  await prisma.rating.deleteMany({ where: { userId: user.id } });
                  await prisma.user.delete({ where: { id: user.id } });
                }
                for (const store of stores) {
                  await prisma.rating.deleteMany({ where: { storeId: store.id } });
                  await prisma.store.delete({ where: { id: store.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include user information with each rating', async () => {
      await fc.assert(
        fc.asyncProperty(
          ratingsArrayArbitrary,
          async (ratingValues) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For User Info Property Valid Name',
                  email: `user-info-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For User Info Property'
                }
              });

              // Create store owner
              const owner = await prisma.user.create({
                data: {
                  name: 'Test Owner For User Info Property Valid Name',
                  email: `user-info-owner-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Owner Address For User Info Property',
                  role: 'STORE_OWNER',
                  storeId: store.id
                }
              });

              // Create users and ratings
              const createdUsers = [];
              for (let i = 0; i < ratingValues.length; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For User Info Property Valid Name`,
                    email: `user-info-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For User Info Property`,
                    role: 'NORMAL_USER'
                  }
                });

                await prisma.rating.create({
                  data: {
                    value: ratingValues[i],
                    userId: user.id,
                    storeId: store.id
                  }
                });

                createdUsers.push(user);
              }

              // Get owner stats
              const stats = await dashboardService.getOwnerStats(owner.id);

              // Verify each rating has user information
              const allHaveUserInfo = stats.ratings.every(rating => 
                rating.userName && 
                rating.userEmail && 
                typeof rating.value === 'number' &&
                rating.createdAt
              );

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              await prisma.user.delete({ where: { id: owner.id } });
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return allHaveUserInfo;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'user-info' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'user-info-store' } }
                });
                
                for (const user of users) {
                  await prisma.rating.deleteMany({ where: { userId: user.id } });
                  await prisma.user.delete({ where: { id: user.id } });
                }
                for (const store of stores) {
                  await prisma.rating.deleteMany({ where: { storeId: store.id } });
                  await prisma.store.delete({ where: { id: store.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 24: Store owners can only access their own store data', () => {
    
    it('should reject access when user is not a store owner', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('NORMAL_USER', 'SYSTEM_ADMIN'),
          async (role) => {
            try {
              // Create a user with non-owner role
              const user = await prisma.user.create({
                data: {
                  name: 'Test Non-Owner For Access Property Valid Name',
                  email: `access-non-owner-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Non-Owner Address For Access Property',
                  role: role
                }
              });

              // Attempt to get owner stats should throw error
              let errorThrown = false;
              try {
                await dashboardService.getOwnerStats(user.id);
              } catch (error) {
                errorThrown = error.message === 'User is not a store owner';
              }

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });

              return errorThrown;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'access-non-owner' } }
                });
                for (const user of users) {
                  await prisma.user.delete({ where: { id: user.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should only return ratings for owner\'s own store, not other stores', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          async (ownStoreRatingCount, otherStoreRatingCount) => {
            try {
              // Create owner's store
              const ownStore = await prisma.store.create({
                data: {
                  name: 'Test Own Store For Isolation Property Valid Name',
                  email: `isolation-own-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Own Store Address For Isolation Property'
                }
              });

              // Create store owner
              const owner = await prisma.user.create({
                data: {
                  name: 'Test Owner For Isolation Property Valid Name',
                  email: `isolation-owner-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Owner Address For Isolation Property',
                  role: 'STORE_OWNER',
                  storeId: ownStore.id
                }
              });

              // Create another store
              const otherStore = await prisma.store.create({
                data: {
                  name: 'Test Other Store For Isolation Property Valid Name',
                  email: `isolation-other-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Other Store Address For Isolation Property'
                }
              });

              // Create users and ratings for own store
              const ownStoreUsers = [];
              for (let i = 0; i < ownStoreRatingCount; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Own Store Isolation Property Valid Name`,
                    email: `isolation-own-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Own Store Isolation Property`,
                    role: 'NORMAL_USER'
                  }
                });

                await prisma.rating.create({
                  data: {
                    value: (i % 5) + 1,
                    userId: user.id,
                    storeId: ownStore.id
                  }
                });

                ownStoreUsers.push(user);
              }

              // Create users and ratings for other store
              const otherStoreUsers = [];
              for (let i = 0; i < otherStoreRatingCount; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Other Store Isolation Property Valid Name`,
                    email: `isolation-other-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Other Store Isolation Property`,
                    role: 'NORMAL_USER'
                  }
                });

                await prisma.rating.create({
                  data: {
                    value: (i % 5) + 1,
                    userId: user.id,
                    storeId: otherStore.id
                  }
                });

                otherStoreUsers.push(user);
              }

              // Get owner stats
              const stats = await dashboardService.getOwnerStats(owner.id);

              // Verify only own store ratings are returned
              const onlyOwnStoreRatings = stats.ratings.length === ownStoreRatingCount;
              const totalCountCorrect = stats.totalRatings === ownStoreRatingCount;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: ownStore.id } });
              await prisma.rating.deleteMany({ where: { storeId: otherStore.id } });
              await prisma.user.delete({ where: { id: owner.id } });
              for (const user of ownStoreUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              for (const user of otherStoreUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: ownStore.id } });
              await prisma.store.delete({ where: { id: otherStore.id } });

              return onlyOwnStoreRatings && totalCountCorrect;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'isolation' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'isolation' } }
                });
                
                for (const user of users) {
                  await prisma.rating.deleteMany({ where: { userId: user.id } });
                  await prisma.user.delete({ where: { id: user.id } });
                }
                for (const store of stores) {
                  await prisma.rating.deleteMany({ where: { storeId: store.id } });
                  await prisma.store.delete({ where: { id: store.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject access for store owner without associated store', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            try {
              // Create a store owner without a store
              const owner = await prisma.user.create({
                data: {
                  name: 'Test Owner Without Store For Access Property Valid Name',
                  email: `access-no-store-owner-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Owner Without Store Address For Access Property',
                  role: 'STORE_OWNER',
                  storeId: null
                }
              });

              // Attempt to get owner stats should throw error
              let errorThrown = false;
              try {
                await dashboardService.getOwnerStats(owner.id);
              } catch (error) {
                errorThrown = error.message === 'Store owner has no associated store';
              }

              // Clean up
              await prisma.user.delete({ where: { id: owner.id } });

              return errorThrown;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'access-no-store-owner' } }
                });
                for (const user of users) {
                  await prisma.user.delete({ where: { id: user.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
