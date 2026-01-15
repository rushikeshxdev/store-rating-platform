/**
 * Property-Based Tests for Rating Display
 * Feature: store-rating-platform, Property 18: Store view indicates rating status for user
 * Validates: Requirements 7.1, 7.2
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const StoreService = require('../services/StoreService');
const RatingService = require('../services/RatingService');

const prisma = new PrismaClient();
const storeService = new StoreService();
const ratingService = new RatingService();

describe('Rating Display Property Tests', () => {
  
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

  describe('Property 18: Store view indicates rating status for user', () => {
    
    // Generator for valid rating values (1-5)
    const validRatingArbitrary = fc.integer({ min: 1, max: 5 });

    // Generator for valid user names (20-60 characters)
    const validUserNameArbitrary = fc.string({ minLength: 20, maxLength: 60 })
      .filter(s => s.trim().length >= 20 && s.trim().length <= 60);

    // Generator for valid store names (20-60 characters)
    const validStoreNameArbitrary = fc.string({ minLength: 20, maxLength: 60 })
      .filter(s => s.trim().length >= 20 && s.trim().length <= 60);

    // Generator for valid addresses (1-400 characters)
    const validAddressArbitrary = fc.string({ minLength: 20, maxLength: 400 })
      .filter(s => s.trim().length > 0 && s.trim().length <= 400);

    // Generator for valid passwords (8-16 chars, uppercase, special char)
    const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 16 })
      .map(s => s + 'A!') // Ensure uppercase and special char
      .filter(s => s.length >= 8 && s.length <= 16);

    // Generator for unique email addresses
    const uniqueEmailArbitrary = fc.integer({ min: 1, max: 1000000 })
      .map(n => `user${n}@example.com`);

    it('should indicate no rating when user has not rated the store', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserNameArbitrary,
          uniqueEmailArbitrary,
          validPasswordArbitrary,
          validAddressArbitrary,
          validStoreNameArbitrary,
          uniqueEmailArbitrary,
          validAddressArbitrary,
          async (userName, userEmail, password, userAddress, storeName, storeEmail, storeAddress) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: userName.trim(),
                  email: userEmail,
                  password: password,
                  address: userAddress.trim(),
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: storeName.trim(),
                  email: storeEmail,
                  address: storeAddress.trim()
                }
              });

              // Get store with ratings for this user (who hasn't rated yet)
              const storeView = await storeService.getStoreWithRatings(store.id, user.id);

              // Verify store view indicates no rating
              const indicatesNoRating = storeView !== null &&
                                       storeView.userRating === null &&
                                       storeView.id === store.id;

              // Clean up
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return indicatesNoRating;
            } catch (error) {
              // If error is due to duplicate email, skip this test case
              if (error.message && error.message.includes('Unique constraint')) {
                return true;
              }
              console.error('Test failed with error:', error.message);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should indicate rating exists and include rating value when user has rated the store', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validUserNameArbitrary,
          uniqueEmailArbitrary,
          validPasswordArbitrary,
          validAddressArbitrary,
          validStoreNameArbitrary,
          uniqueEmailArbitrary,
          validAddressArbitrary,
          async (ratingValue, userName, userEmail, password, userAddress, storeName, storeEmail, storeAddress) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: userName.trim(),
                  email: userEmail,
                  password: password,
                  address: userAddress.trim(),
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: storeName.trim(),
                  email: storeEmail,
                  address: storeAddress.trim()
                }
              });

              // User submits a rating
              const rating = await ratingService.createRating(user.id, store.id, ratingValue);

              // Get store with ratings for this user
              const storeView = await storeService.getStoreWithRatings(store.id, user.id);

              // Verify store view indicates rating exists and includes the value
              const indicatesRatingExists = storeView !== null &&
                                           storeView.userRating !== null &&
                                           storeView.userRating.id === rating.id &&
                                           storeView.userRating.value === ratingValue &&
                                           storeView.id === store.id;

              // Clean up
              await prisma.rating.delete({ where: { id: rating.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return indicatesRatingExists;
            } catch (error) {
              // If error is due to duplicate email, skip this test case
              if (error.message && error.message.includes('Unique constraint')) {
                return true;
              }
              console.error('Test failed with error:', error.message);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should show different rating status for different users viewing the same store', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          async (ratingValue) => {
            try {
              // Create two different users
              const user1 = await prisma.user.create({
                data: {
                  name: 'Test User One For Rating Display Valid Name',
                  email: `rating-display-user1-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User One Address For Rating Display',
                  role: 'NORMAL_USER'
                }
              });

              const user2 = await prisma.user.create({
                data: {
                  name: 'Test User Two For Rating Display Valid Name',
                  email: `rating-display-user2-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User Two Address For Rating Display',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Rating Display Valid Name',
                  email: `rating-display-store-${Date.now()}@example.com`,
                  address: 'Test Store Address For Rating Display'
                }
              });

              // Only user1 submits a rating
              const rating = await ratingService.createRating(user1.id, store.id, ratingValue);

              // Get store view for user1 (who has rated)
              const storeViewUser1 = await storeService.getStoreWithRatings(store.id, user1.id);

              // Get store view for user2 (who has not rated)
              const storeViewUser2 = await storeService.getStoreWithRatings(store.id, user2.id);

              // Verify user1 sees their rating
              const user1SeesRating = storeViewUser1 !== null &&
                                     storeViewUser1.userRating !== null &&
                                     storeViewUser1.userRating.value === ratingValue;

              // Verify user2 sees no rating
              const user2SeesNoRating = storeViewUser2 !== null &&
                                       storeViewUser2.userRating === null;

              // Clean up
              await prisma.rating.delete({ where: { id: rating.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user1.id } });
              await prisma.user.delete({ where: { id: user2.id } });

              return user1SeesRating && user2SeesNoRating;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'rating-display-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'rating-display-store' } }
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

    it('should correctly update rating status when user modifies their rating', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validRatingArbitrary,
          async (initialRating, updatedRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Rating Update Display Valid Name',
                  email: `rating-update-display-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Rating Update Display',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Rating Update Display Valid Name',
                  email: `rating-update-store-${Date.now()}@example.com`,
                  address: 'Test Store Address For Rating Update Display'
                }
              });

              // User submits initial rating
              const rating = await ratingService.createRating(user.id, store.id, initialRating);

              // Get store view - should show initial rating
              const storeViewBefore = await storeService.getStoreWithRatings(store.id, user.id);
              const showsInitialRating = storeViewBefore !== null &&
                                        storeViewBefore.userRating !== null &&
                                        storeViewBefore.userRating.value === initialRating;

              // User updates their rating
              await ratingService.updateRating(rating.id, user.id, updatedRating);

              // Get store view again - should show updated rating
              const storeViewAfter = await storeService.getStoreWithRatings(store.id, user.id);
              const showsUpdatedRating = storeViewAfter !== null &&
                                        storeViewAfter.userRating !== null &&
                                        storeViewAfter.userRating.value === updatedRating;

              // Clean up
              await prisma.rating.delete({ where: { id: rating.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return showsInitialRating && showsUpdatedRating;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'rating-update-display' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'rating-update-store' } }
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

    it('should handle store view without userId parameter', async () => {
      await fc.assert(
        fc.asyncProperty(
          validStoreNameArbitrary,
          uniqueEmailArbitrary,
          validAddressArbitrary,
          async (storeName, storeEmail, storeAddress) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: storeName.trim(),
                  email: storeEmail,
                  address: storeAddress.trim()
                }
              });

              // Get store without userId (public view)
              const storeView = await storeService.getStoreWithRatings(store.id);

              // Verify store view returns store data without userRating
              const validPublicView = storeView !== null &&
                                     storeView.id === store.id &&
                                     storeView.userRating === null;

              // Clean up
              await prisma.store.delete({ where: { id: store.id } });

              return validPublicView;
            } catch (error) {
              // If error is due to duplicate email, skip this test case
              if (error.message && error.message.includes('Unique constraint')) {
                return true;
              }
              console.error('Test failed with error:', error.message);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
