/**
 * Property-Based Tests for Rating Submission
 * Feature: store-rating-platform, Property 19: Valid ratings are accepted and persisted
 * Feature: store-rating-platform, Property 21: Duplicate ratings for same store are prevented
 * Validates: Requirements 7.3, 7.4, 7.6
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const RatingService = require('../services/RatingService');

const prisma = new PrismaClient();
const ratingService = new RatingService();

describe('Rating Submission Property Tests', () => {
  
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

  describe('Property 19: Valid ratings are accepted and persisted', () => {
    
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

    it('should accept and persist valid ratings for any user and store', async () => {
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

              // Submit rating
              const rating = await ratingService.createRating(user.id, store.id, ratingValue);

              // Verify rating was created successfully
              const isCreated = rating !== null &&
                               rating.id !== undefined &&
                               rating.value === ratingValue &&
                               rating.userId === user.id &&
                               rating.storeId === store.id;

              // Verify rating is persisted in database
              const dbRating = await prisma.rating.findUnique({
                where: { id: rating.id }
              });

              const isPersisted = dbRating !== null &&
                                 dbRating.value === ratingValue &&
                                 dbRating.userId === user.id &&
                                 dbRating.storeId === store.id;

              // Verify rating can be retrieved by user and store
              const retrievedRating = await ratingService.getRatingByUserAndStore(user.id, store.id);
              const isRetrievable = retrievedRating !== null &&
                                   retrievedRating.id === rating.id &&
                                   retrievedRating.value === ratingValue;

              // Clean up
              await prisma.rating.delete({ where: { id: rating.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return isCreated && isPersisted && isRetrievable;
            } catch (error) {
              // If error is due to duplicate email, skip this test case
              if (error.message && error.message.includes('Unique constraint')) {
                return true;
              }
              // Any other error means the test failed
              console.error('Test failed with error:', error.message);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept all valid rating values (1-5)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(1, 2, 3, 4, 5),
          async (ratingValue) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Rating Values With Valid Name',
                  email: `rating-value-test-${ratingValue}-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Rating Values',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Rating Values With Valid Name',
                  email: `rating-store-${ratingValue}-${Date.now()}@example.com`,
                  address: 'Test Store Address For Rating Values'
                }
              });

              // Submit rating
              const rating = await ratingService.createRating(user.id, store.id, ratingValue);

              // Verify rating value is correct
              const isCorrectValue = rating.value === ratingValue;

              // Clean up
              await prisma.rating.delete({ where: { id: rating.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return isCorrectValue;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject invalid rating values outside 1-5 range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer().filter(n => n < 1 || n > 5),
          async (invalidRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Invalid Rating With Valid Name',
                  email: `invalid-rating-test-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Invalid Rating',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Invalid Rating With Valid Name',
                  email: `invalid-rating-store-${Date.now()}@example.com`,
                  address: 'Test Store Address For Invalid Rating'
                }
              });

              // Try to submit invalid rating
              await ratingService.createRating(user.id, store.id, invalidRating);

              // Clean up
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw validation error
              const isValidationError = error.message && 
                                       (error.message.includes('between 1 and 5') ||
                                        error.message.includes('Rating'));

              // Clean up if user and store were created
              try {
                const user = await prisma.user.findFirst({
                  where: { email: `invalid-rating-test-${Date.now()}@example.com` }
                });
                const store = await prisma.store.findFirst({
                  where: { email: `invalid-rating-store-${Date.now()}@example.com` }
                });
                if (store) await prisma.store.delete({ where: { id: store.id } });
                if (user) await prisma.user.delete({ where: { id: user.id } });
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return isValidationError;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject non-integer rating values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 1.1, max: 4.9 }).filter(n => !Number.isInteger(n)),
          async (nonIntegerRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Non-Integer Rating Valid Name',
                  email: `non-integer-rating-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Non-Integer Rating',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Non-Integer Rating Valid Name',
                  email: `non-integer-store-${Date.now()}@example.com`,
                  address: 'Test Store Address For Non-Integer Rating'
                }
              });

              // Try to submit non-integer rating
              await ratingService.createRating(user.id, store.id, nonIntegerRating);

              // Clean up
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw validation error
              const isValidationError = error.message && 
                                       (error.message.includes('integer') ||
                                        error.message.includes('Rating'));

              // Clean up if user and store were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'non-integer-rating' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'non-integer-store' } }
                });
                for (const store of stores) {
                  await prisma.store.delete({ where: { id: store.id } });
                }
                for (const user of users) {
                  await prisma.user.delete({ where: { id: user.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return isValidationError;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject ratings for non-existent users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 999999, max: 9999999 }), // Non-existent user ID
          validRatingArbitrary,
          async (nonExistentUserId, ratingValue) => {
            try {
              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Non-Existent User Valid Name',
                  email: `non-existent-user-store-${Date.now()}@example.com`,
                  address: 'Test Store Address For Non-Existent User'
                }
              });

              // Try to submit rating with non-existent user
              await ratingService.createRating(nonExistentUserId, store.id, ratingValue);

              // Clean up
              await prisma.store.delete({ where: { id: store.id } });

              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw user not found error
              const isUserNotFoundError = error.message && error.message.includes('User not found');

              // Clean up if store was created
              try {
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'non-existent-user-store' } }
                });
                for (const store of stores) {
                  await prisma.store.delete({ where: { id: store.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return isUserNotFoundError;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject ratings for non-existent stores', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 999999, max: 9999999 }), // Non-existent store ID
          validRatingArbitrary,
          async (nonExistentStoreId, ratingValue) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Non-Existent Store Valid Name',
                  email: `non-existent-store-user-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Non-Existent Store',
                  role: 'NORMAL_USER'
                }
              });

              // Try to submit rating with non-existent store
              await ratingService.createRating(user.id, nonExistentStoreId, ratingValue);

              // Clean up
              await prisma.user.delete({ where: { id: user.id } });

              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw store not found error
              const isStoreNotFoundError = error.message && error.message.includes('Store not found');

              // Clean up if user was created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'non-existent-store-user' } }
                });
                for (const user of users) {
                  await prisma.user.delete({ where: { id: user.id } });
                }
              } catch (cleanupError) {
                // Ignore cleanup errors
              }

              return isStoreNotFoundError;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 21: Duplicate ratings for same store are prevented', () => {
    
    const validRatingArbitrary = fc.integer({ min: 1, max: 5 });

    it('should prevent duplicate ratings for the same user and store', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validRatingArbitrary,
          async (firstRating, secondRating) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Duplicate Rating Valid Name',
                  email: `duplicate-rating-test-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Duplicate Rating',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Duplicate Rating Valid Name',
                  email: `duplicate-rating-store-${Date.now()}@example.com`,
                  address: 'Test Store Address For Duplicate Rating'
                }
              });

              // Submit first rating
              const rating1 = await ratingService.createRating(user.id, store.id, firstRating);

              // Verify first rating was created
              const firstRatingCreated = rating1 !== null && rating1.value === firstRating;

              // Try to submit second rating for the same user and store
              let duplicateRejected = false;
              try {
                await ratingService.createRating(user.id, store.id, secondRating);
                // If no error was thrown, duplicate was not prevented
                duplicateRejected = false;
              } catch (error) {
                // Should throw duplicate rating error
                duplicateRejected = error.message && 
                                   (error.message.includes('already exists') ||
                                    error.message.includes('duplicate'));
              }

              // Verify only one rating exists in database
              const allRatings = await prisma.rating.findMany({
                where: {
                  userId: user.id,
                  storeId: store.id
                }
              });

              const onlyOneRating = allRatings.length === 1;

              // Clean up
              await prisma.rating.deleteMany({
                where: {
                  userId: user.id,
                  storeId: store.id
                }
              });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return firstRatingCreated && duplicateRejected && onlyOneRating;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'duplicate-rating-test' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'duplicate-rating-store' } }
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

    it('should allow the same user to rate different stores', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validRatingArbitrary,
          async (rating1, rating2) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For Multiple Stores Valid Name',
                  email: `multi-store-rating-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For Multiple Stores',
                  role: 'NORMAL_USER'
                }
              });

              // Create two different stores
              const store1 = await prisma.store.create({
                data: {
                  name: 'Test Store One For Multi Rating Valid Name',
                  email: `multi-rating-store1-${Date.now()}@example.com`,
                  address: 'Test Store One Address For Multi Rating'
                }
              });

              const store2 = await prisma.store.create({
                data: {
                  name: 'Test Store Two For Multi Rating Valid Name',
                  email: `multi-rating-store2-${Date.now()}@example.com`,
                  address: 'Test Store Two Address For Multi Rating'
                }
              });

              // Submit rating for first store
              const ratingForStore1 = await ratingService.createRating(user.id, store1.id, rating1);

              // Submit rating for second store (should succeed)
              const ratingForStore2 = await ratingService.createRating(user.id, store2.id, rating2);

              // Verify both ratings were created
              const bothCreated = ratingForStore1 !== null && 
                                 ratingForStore2 !== null &&
                                 ratingForStore1.storeId === store1.id &&
                                 ratingForStore2.storeId === store2.id;

              // Verify both ratings exist in database
              const dbRatings = await prisma.rating.findMany({
                where: { userId: user.id }
              });

              const bothPersisted = dbRatings.length === 2;

              // Clean up
              await prisma.rating.deleteMany({ where: { userId: user.id } });
              await prisma.store.delete({ where: { id: store1.id } });
              await prisma.store.delete({ where: { id: store2.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return bothCreated && bothPersisted;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'multi-store-rating' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'multi-rating-store' } }
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

    it('should allow different users to rate the same store', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          validRatingArbitrary,
          async (rating1, rating2) => {
            try {
              // Create two different users
              const user1 = await prisma.user.create({
                data: {
                  name: 'Test User One For Same Store Valid Name',
                  email: `same-store-user1-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User One Address For Same Store',
                  role: 'NORMAL_USER'
                }
              });

              const user2 = await prisma.user.create({
                data: {
                  name: 'Test User Two For Same Store Valid Name',
                  email: `same-store-user2-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test User Two Address For Same Store',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For Multiple Users Valid Name',
                  email: `same-store-rating-${Date.now()}@example.com`,
                  address: 'Test Store Address For Multiple Users'
                }
              });

              // Submit rating from first user
              const ratingFromUser1 = await ratingService.createRating(user1.id, store.id, rating1);

              // Submit rating from second user (should succeed)
              const ratingFromUser2 = await ratingService.createRating(user2.id, store.id, rating2);

              // Verify both ratings were created
              const bothCreated = ratingFromUser1 !== null && 
                                 ratingFromUser2 !== null &&
                                 ratingFromUser1.userId === user1.id &&
                                 ratingFromUser2.userId === user2.id;

              // Verify both ratings exist in database
              const dbRatings = await prisma.rating.findMany({
                where: { storeId: store.id }
              });

              const bothPersisted = dbRatings.length === 2;

              // Clean up
              await prisma.rating.deleteMany({ where: { storeId: store.id } });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user1.id } });
              await prisma.user.delete({ where: { id: user2.id } });

              return bothCreated && bothPersisted;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'same-store-user' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'same-store-rating' } }
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

    it('should enforce unique constraint at database level', async () => {
      await fc.assert(
        fc.asyncProperty(
          validRatingArbitrary,
          async (ratingValue) => {
            try {
              // Create a normal user
              const user = await prisma.user.create({
                data: {
                  name: 'Test User For DB Constraint Valid Name',
                  email: `db-constraint-test-${Date.now()}@example.com`,
                  password: 'Password123!',
                  address: 'Test Address For DB Constraint',
                  role: 'NORMAL_USER'
                }
              });

              // Create a store
              const store = await prisma.store.create({
                data: {
                  name: 'Test Store For DB Constraint Valid Name',
                  email: `db-constraint-store-${Date.now()}@example.com`,
                  address: 'Test Store Address For DB Constraint'
                }
              });

              // Submit first rating
              await ratingService.createRating(user.id, store.id, ratingValue);

              // Try to bypass service layer and create duplicate directly in DB
              let dbConstraintEnforced = false;
              try {
                await prisma.rating.create({
                  data: {
                    value: ratingValue,
                    userId: user.id,
                    storeId: store.id
                  }
                });
                // If no error, constraint was not enforced
                dbConstraintEnforced = false;
              } catch (error) {
                // Should throw unique constraint violation
                dbConstraintEnforced = error.code === 'P2002' || 
                                      error.message.includes('Unique constraint');
              }

              // Clean up
              await prisma.rating.deleteMany({
                where: {
                  userId: user.id,
                  storeId: store.id
                }
              });
              await prisma.store.delete({ where: { id: store.id } });
              await prisma.user.delete({ where: { id: user.id } });

              return dbConstraintEnforced;
            } catch (error) {
              console.error('Test failed with error:', error.message);
              
              // Clean up if entities were created
              try {
                const users = await prisma.user.findMany({
                  where: { email: { contains: 'db-constraint-test' } }
                });
                const stores = await prisma.store.findMany({
                  where: { email: { contains: 'db-constraint-store' } }
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
