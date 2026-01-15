/**
 * Property-Based Tests for Average Rating Calculation
 * Feature: store-rating-platform, Property 23: Average rating calculation is accurate
 * Validates: Requirements 8.2, 8.3, 8.4, 12.1, 12.2, 12.3
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const RatingService = require('../services/RatingService');
const StoreService = require('../services/StoreService');

const prisma = new PrismaClient();
const ratingService = new RatingService();
const storeService = new StoreService();

describe('Average Rating Calculation Property Tests', () => {
  
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

  describe('Property 23: Average rating calculation is accurate', () => {
    
    // Generator for valid rating values (1-5)
    const validRatingArbitrary = fc.integer({ min: 1, max: 5 });

    // Generator for arrays of ratings (1-10 ratings)
    const ratingsArrayArbitrary = fc.array(validRatingArbitrary, { minLength: 1, maxLength: 10 });

    it('should calculate accurate average for any set of ratings', async () => {
      await fc.assert(
        fc.asyncProperty(
          ratingsArrayArbitrary,
          async (ratingValues) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Average Calculation Valid Name',
                  email: `avg-calc-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Average Calculation'
                }
              });

              // Create users and ratings
              const createdRatings = [];
              for (let i = 0; i < ratingValues.length; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Average Calc Valid Name`,
                    email: `avg-calc-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Average Calc`,
                    role: 'NORMAL_USER'
                  }
                });

                const rating = await ratingService.createRating(user.id, store.id, ratingValues[i]);
                createdRatings.push({ rating, user });
              }

              // Calculate expected average
              const sum = ratingValues.reduce((acc, val) => acc + val, 0);
              const expectedAverage = sum / ratingValues.length;

              // Get calculated average from service
              const calculatedAverage = await storeService.calculateAverageRating(store.id);

              // Verify average is accurate (within floating point precision)
              const isAccurate = Math.abs(calculatedAverage - expectedAverage) < 0.0001;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              for (const { user } of createdRatings) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return isAccurate;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'avg-calc-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'avg-calc-store' } }
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

    it('should return null for stores with no ratings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            try {
              // Create a store with no ratings
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For No Ratings Valid Name',
                  email: `no-ratings-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For No Ratings'
                }
              });

              // Get average rating (should be null)
              const averageRating = await storeService.calculateAverageRating(store.id);

              // Verify average is null
              const isNull = averageRating === null;

              // Clean up
              await prisma.store.delete({ where: { id: store.id } });

              return isNull;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'no-ratings-store' } }
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

    it('should recalculate average when new rating is added', async () => {
      await fc.assert(
        fc.asyncProperty(
          ratingsArrayArbitrary,
          validRatingArbitrary,
          async (initialRatings, newRating) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Add Rating Valid Name',
                  email: `add-rating-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Add Rating'
                }
              });

              // Create initial ratings
              const createdUsers = [];
              for (let i = 0; i < initialRatings.length; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Add Rating Valid Name`,
                    email: `add-rating-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Add Rating`,
                    role: 'NORMAL_USER'
                  }
                });

                await ratingService.createRating(user.id, store.id, initialRatings[i]);
                createdUsers.push(user);
              }

              // Calculate initial average
              const initialSum = initialRatings.reduce((acc, val) => acc + val, 0);
              const initialExpectedAverage = initialSum / initialRatings.length;
              const initialCalculatedAverage = await storeService.calculateAverageRating(store.id);
              const initialAccurate = Math.abs(initialCalculatedAverage - initialExpectedAverage) < 0.0001;

              // Add new rating
              const newUser = await prisma.user.create({
                data: {
                  name: 'Test User New For Add Rating Valid Name',
                  email: `add-rating-new-user-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User New Address For Add Rating',
                  role: 'NORMAL_USER'
                }
              });

              await ratingService.createRating(newUser.id, store.id, newRating);
              createdUsers.push(newUser);

              // Calculate new average
              const newSum = initialSum + newRating;
              const newExpectedAverage = newSum / (initialRatings.length + 1);
              const newCalculatedAverage = await storeService.calculateAverageRating(store.id);
              const newAccurate = Math.abs(newCalculatedAverage - newExpectedAverage) < 0.0001;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return initialAccurate && newAccurate;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'add-rating-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'add-rating-store' } }
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

    it('should recalculate average when rating is modified', async () => {
      await fc.assert(
        fc.asyncProperty(
          ratingsArrayArbitrary,
          fc.integer({ min: 0, max: 9 }),
          validRatingArbitrary,
          async (initialRatings, indexToModify, newValue) => {
            // Skip if array is empty or index is out of bounds
            if (initialRatings.length === 0 || indexToModify >= initialRatings.length) {
              return true;
            }

            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Modify Rating Valid Name',
                  email: `modify-rating-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Modify Rating'
                }
              });

              // Create ratings
              const createdData = [];
              for (let i = 0; i < initialRatings.length; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Modify Rating Valid Name`,
                    email: `modify-rating-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Modify Rating`,
                    role: 'NORMAL_USER'
                  }
                });

                const rating = await ratingService.createRating(user.id, store.id, initialRatings[i]);
                createdData.push({ user, rating });
              }

              // Calculate initial average
              const initialSum = initialRatings.reduce((acc, val) => acc + val, 0);
              const initialExpectedAverage = initialSum / initialRatings.length;
              const initialCalculatedAverage = await storeService.calculateAverageRating(store.id);
              const initialAccurate = Math.abs(initialCalculatedAverage - initialExpectedAverage) < 0.0001;

              // Modify one rating
              const ratingToModify = createdData[indexToModify].rating;
              const userWhoOwnsRating = createdData[indexToModify].user;
              await ratingService.updateRating(ratingToModify.id, userWhoOwnsRating.id, newValue);

              // Calculate new average
              const modifiedRatings = [...initialRatings];
              modifiedRatings[indexToModify] = newValue;
              const newSum = modifiedRatings.reduce((acc, val) => acc + val, 0);
              const newExpectedAverage = newSum / modifiedRatings.length;
              const newCalculatedAverage = await storeService.calculateAverageRating(store.id);
              const newAccurate = Math.abs(newCalculatedAverage - newExpectedAverage) < 0.0001;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              for (const { user } of createdData) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return initialAccurate && newAccurate;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'modify-rating-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'modify-rating-store' } }
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

    it('should handle edge case of single rating', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          async (singleRating) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Single Rating Valid Name',
                  email: `single-rating-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Single Rating'
                }
              });

              // Create one user and rating
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Single Rating Valid Name',
                  email: `single-rating-user-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User Address For Single Rating',
                  role: 'NORMAL_USER'
                }
              });

              await ratingService.createRating(user.id, store.id, singleRating);

              // Average should equal the single rating
              const calculatedAverage = await storeService.calculateAverageRating(store.id);
              const isCorrect = calculatedAverage === singleRating;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              await prisma.user.delete({ where: { id: user.id } });
              await prisma.store.delete({ where: { id: store.id } });

              return isCorrect;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'single-rating-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'single-rating-store' } }
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

    it('should handle all ratings being the same value', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          fc.integer({ min: 2, max: 10 }),
          async (ratingValue, count) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Same Ratings Valid Name',
                  email: `same-ratings-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Same Ratings'
                }
              });

              // Create multiple users with same rating value
              const createdUsers = [];
              for (let i = 0; i < count; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Same Ratings Valid Name`,
                    email: `same-ratings-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Same Ratings`,
                    role: 'NORMAL_USER'
                  }
                });

                await ratingService.createRating(user.id, store.id, ratingValue);
                createdUsers.push(user);
              }

              // Average should equal the rating value
              const calculatedAverage = await storeService.calculateAverageRating(store.id);
              const isCorrect = calculatedAverage === ratingValue;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return isCorrect;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'same-ratings-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'same-ratings-store' } }
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

    it('should handle extreme values (all 1s and all 5s)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(1, 5),
          fc.integer({ min: 2, max: 10 }),
          async (extremeValue, count) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Extreme Values Valid Name',
                  email: `extreme-values-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Extreme Values'
                }
              });

              // Create multiple users with extreme rating value
              const createdUsers = [];
              for (let i = 0; i < count; i++) {
                const user = await prisma.user.create({
                  data: {
                    name: `Test User ${i} For Extreme Values Valid Name`,
                    email: `extreme-values-user-${i}-${Date.now()}-${Math.random()}@example.com`,
                    password: 'Password123!',
                    address: `Test User ${i} Address For Extreme Values`,
                    role: 'NORMAL_USER'
                  }
                });

                await ratingService.createRating(user.id, store.id, extremeValue);
                createdUsers.push(user);
              }

              // Average should equal the extreme value
              const calculatedAverage = await storeService.calculateAverageRating(store.id);
              const isCorrect = calculatedAverage === extremeValue;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              for (const user of createdUsers) {
                await prisma.user.delete({ where: { id: user.id } });
              }
              await prisma.store.delete({ where: { id: store.id } });

              return isCorrect;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'extreme-values-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'extreme-values-store' } }
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
});
