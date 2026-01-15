/**
 * Property-Based Tests for Rating Modification
 * Feature: store-rating-platform, Property 20: Rating modifications update the rating value
 * Validates: Requirements 7.5
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const RatingService = require('../services/RatingService');

const prisma = new PrismaClient();
const ratingService = new RatingService();

describe('Rating Modification Property Tests', () => {
  
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

  describe('Property 20: Rating modifications update the rating value', () => {
    
    // Generator for valid rating values (1-5)
    const validRatingArbitrary = fc.integer({ min: 1, max: 5 });

    it('should update rating value for any valid new rating', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validRatingArbitrary,
          async (initialRating, newRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Rating Modification Valid Name',
                  email: `rating-mod-test-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Rating Modification',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Rating Modification Valid Name',
                  email: `rating-mod-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Rating Modification'
                }
              });

              // Create initial rating
              const initialRatingObj = await ratingService.createRating(user.id, store.id, initialRating);

              // Verify initial rating was created with correct value
              const initialCorrect = initialRatingObj.value === initialRating;

              // Update the rating
              const updatedRating = await ratingService.updateRating(initialRatingObj.id, user.id, newRating);

              // Verify the rating was updated with new value
              const updateCorrect = updatedRating.id === initialRatingObj.id &&
                                   updatedRating.value === newRating &&
                                   updatedRating.userId === user.id &&
                                   updatedRating.storeId === store.id;

              // Verify the updated rating is persisted in database
              const dbRating = await prisma.rating.findUnique({
                where: { id: initialRatingObj.id }
              });

              const persistedCorrect = dbRating !== null &&
                                      dbRating.value === newRating &&
                                      dbRating.id === initialRatingObj.id;

              // Verify only one rating exists (no duplicate created)
              const allRatings = await prisma.rating.findMany({
                where: {
                  userId: user.id,
                  storeId: store.id
                }
              });

              const onlyOneRating = allRatings.length === 1;

              // Clean up
              await prisma.rating.delete({ where: { id: initialRatingObj.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return initialCorrect && updateCorrect && persistedCorrect && onlyOneRating;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'rating-mod-test' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'rating-mod-store' } }
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

    it('should allow multiple modifications to the same rating', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validRatingArbitrary, { minLength: 2, maxLength: 5 }),
          async (ratingSequence) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Multiple Mods Valid Name',
                  email: `multi-mod-test-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Multiple Mods',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Multiple Mods Valid Name',
                  email: `multi-mod-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Multiple Mods'
                }
              });

              // Create initial rating with first value
              let currentRating = await ratingService.createRating(user.id, store.id, ratingSequence[0]);

              // Apply each subsequent rating value as an update
              for (let i = 1; i < ratingSequence.length; i++) {
                currentRating = await ratingService.updateRating(currentRating.id, user.id, ratingSequence[i]);
                
                // Verify the value was updated
                if (currentRating.value !== ratingSequence[i]) {
                  // Clean up and fail
                  await prisma.rating.delete({ where: { id: currentRating.id } });
                  await prisma.store.delete({ where: { id: store.id } });
                  await prisma.user.delete({ where: { id: user.id } });
                  return false;
                }
              }

              // Verify final value matches last in sequence
              const finalValue = ratingSequence[ratingSequence.length - 1];
              const finalCorrect = currentRating.value === finalValue;

              // Verify only one rating exists
              const allRatings = await prisma.rating.findMany({
                where: {
                  userId: user.id,
                  storeId: store.id
                }
              });

              const onlyOneRating = allRatings.length === 1;

              // Clean up
              await prisma.rating.delete({ where: { id: currentRating.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return finalCorrect && onlyOneRating;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'multi-mod-test' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'multi-mod-store' } }
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

    it('should reject modification with invalid rating values', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          fc.integer().filter(n => n < 1 || n > 5),
          async (initialRating, invalidNewRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Invalid Mod Valid Name',
                  email: `invalid-mod-test-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Invalid Mod',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Invalid Mod Valid Name',
                  email: `invalid-mod-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Invalid Mod'
                }
              });

              // Create initial rating
              const initialRatingObj = await ratingService.createRating(user.id, store.id, initialRating);

              // Try to update with invalid rating
              let errorThrown = false;
              try {
                await ratingService.updateRating(initialRatingObj.id, user.id, invalidNewRating);
              } catch (error) {
                errorThrown = error.message && 
                             (error.message.includes('between 1 and 5') ||
                              error.message.includes('Rating'));
              }

              // Verify original rating value is unchanged
              const dbRating = await prisma.rating.findUnique({
                where: { id: initialRatingObj.id }
              });

              const valueUnchanged = dbRating.value === initialRating;

              // Clean up
              await prisma.rating.delete({ where: { id: initialRatingObj.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return errorThrown && valueUnchanged;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'invalid-mod-test' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'invalid-mod-store' } }
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

    it('should reject modification by non-owner of the rating', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validRatingArbitrary,
          async (initialRating, newRating) => {
            try {
              // Create first user (rating owner)
              const user1 = await prisma.user.create({
                data: {
                  name: 'Test User One For Non-Owner Valid Name',
                  email: `non-owner-user1-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User One Address For Non-Owner',
                  role: 'NORMAL_USER'
                }
              });

              // Create second user (non-owner)
              const user2 = await prisma.user.create({
                data: {
                  name: 'Test User Two For Non-Owner Valid Name',
                  email: `non-owner-user2-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User Two Address For Non-Owner',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Non-Owner Valid Name',
                  email: `non-owner-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For Non-Owner'
                }
              });

              // Create rating by user1
              const rating = await ratingService.createRating(user1.id, store.id, initialRating);

              // Try to update rating by user2 (should fail)
              let errorThrown = false;
              try {
                await ratingService.updateRating(rating.id, user2.id, newRating);
              } catch (error) {
                errorThrown = error.message && error.message.includes('only update your own');
              }

              // Verify original rating value is unchanged
              const dbRating = await prisma.rating.findUnique({
                where: { id: rating.id }
              });

              const valueUnchanged = dbRating.value === initialRating &&
                                    dbRating.userId === user1.id;

              // Clean up
              await prisma.rating.delete({ where: { id: rating.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user1.id } });
              await prisma.user.delete({ where: { id: user2.id } });

              return errorThrown && valueUnchanged;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'non-owner-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'non-owner-store' } }
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

    it('should reject modification of non-existent rating', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 999999, max: 9999999 }), // Non-existent rating ID
          validRatingArbitrary,
          async (nonExistentRatingId, newRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Non-Existent Rating Valid Name',
                  email: `non-existent-rating-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Non-Existent Rating',
                  role: 'NORMAL_USER'
                }
              });

              // Try to update non-existent rating
              let errorThrown = false;
              try {
                await ratingService.updateRating(nonExistentRatingId, user.id, newRating);
              } catch (error) {
                errorThrown = error.message && error.message.includes('Rating not found');
              }

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });

              return errorThrown;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'non-existent-rating' } }
                });
                
                for (const user of users) {
                  await prisma.rating.deleteMany({ where: { userId: user.id } });
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

    it('should preserve rating ID and relationships after modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validRatingArbitrary,
          async (initialRating, newRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For ID Preservation Valid Name',
                  email: `id-preserve-test-${Date.now()}-${Math.random()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For ID Preservation',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For ID Preservation Valid Name',
                  email: `id-preserve-store-${Date.now()}-${Math.random()}@example.com`,
                  address: 'Test Store Address For ID Preservation'
                }
              });

              // Create initial rating
              const initialRatingObj = await ratingService.createRating(user.id, store.id, initialRating);
              const originalId = initialRatingObj.id;
              const originalUserId = initialRatingObj.userId;
              const originalStoreId = initialRatingObj.storeId;

              // Update the rating
              const updatedRating = await ratingService.updateRating(originalId, user.id, newRating);

              // Verify ID and relationships are preserved
              const idPreserved = updatedRating.id === originalId;
              const userIdPreserved = updatedRating.userId === originalUserId;
              const storeIdPreserved = updatedRating.storeId === originalStoreId;

              // Clean up
              await prisma.rating.delete({ where: { id: originalId } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return idPreserved && userIdPreserved && storeIdPreserved;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'id-preserve-test' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'id-preserve-store' } }
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
