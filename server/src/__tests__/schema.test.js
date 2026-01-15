// Feature: store-rating-platform, Property 28: Referential integrity is maintained
// Validates: Requirements 11.6

const { PrismaClient } = require('@prisma/client');
const fc = require('fast-check');

const prisma = new PrismaClient();

describe('Property 28: Referential integrity is maintained', () => {
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

  it('should reject ratings with non-existent userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (ratingValue) => {
          // Create a store
          const store = await prisma.store.create({
            data: {
              name: 'Test Store for Non-existent User',
              email: `store-${Date.now()}-${Math.random()}@test.com`,
              address: 'Test Address for Store'
            }
          });

          // Try to create a rating with a non-existent userId (e.g., 999999)
          const nonExistentUserId = 999999;

          await expect(
            prisma.rating.create({
              data: {
                value: ratingValue,
                userId: nonExistentUserId,
                storeId: store.id
              }
            })
          ).rejects.toThrow();

          // Clean up
          await prisma.store.delete({ where: { id: store.id } });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject ratings with non-existent storeId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (ratingValue) => {
          // Create a user
          const user = await prisma.user.create({
            data: {
              name: 'Test User for Non-existent Store',
              email: `user-${Date.now()}-${Math.random()}@test.com`,
              password: 'hashedPassword123',
              address: 'Test Address for User'
            }
          });

          // Try to create a rating with a non-existent storeId (e.g., 999999)
          const nonExistentStoreId = 999999;

          await expect(
            prisma.rating.create({
              data: {
                value: ratingValue,
                userId: user.id,
                storeId: nonExistentStoreId
              }
            })
          ).rejects.toThrow();

          // Clean up
          await prisma.user.delete({ where: { id: user.id } });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should cascade delete ratings when user is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (ratingValue) => {
          // Create a user and store
          const user = await prisma.user.create({
            data: {
              name: 'Test User for Cascade Delete',
              email: `user-cascade-${Date.now()}-${Math.random()}@test.com`,
              password: 'hashedPassword123',
              address: 'Test Address for Cascade User'
            }
          });

          const store = await prisma.store.create({
            data: {
              name: 'Test Store for Cascade Delete',
              email: `store-cascade-${Date.now()}-${Math.random()}@test.com`,
              address: 'Test Address for Cascade Store'
            }
          });

          // Create a rating
          const rating = await prisma.rating.create({
            data: {
              value: ratingValue,
              userId: user.id,
              storeId: store.id
            }
          });

          // Delete the user
          await prisma.user.delete({ where: { id: user.id } });

          // Verify the rating was cascade deleted
          const deletedRating = await prisma.rating.findUnique({
            where: { id: rating.id }
          });

          expect(deletedRating).toBeNull();

          // Clean up store
          await prisma.store.delete({ where: { id: store.id } });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should cascade delete ratings when store is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (ratingValue) => {
          // Create a user and store
          const user = await prisma.user.create({
            data: {
              name: 'Test User for Store Cascade Delete',
              email: `user-store-cascade-${Date.now()}-${Math.random()}@test.com`,
              password: 'hashedPassword123',
              address: 'Test Address for Store Cascade User'
            }
          });

          const store = await prisma.store.create({
            data: {
              name: 'Test Store for Store Cascade Delete',
              email: `store-store-cascade-${Date.now()}-${Math.random()}@test.com`,
              address: 'Test Address for Store Cascade Store'
            }
          });

          // Create a rating
          const rating = await prisma.rating.create({
            data: {
              value: ratingValue,
              userId: user.id,
              storeId: store.id
            }
          });

          // Delete the store
          await prisma.store.delete({ where: { id: store.id } });

          // Verify the rating was cascade deleted
          const deletedRating = await prisma.rating.findUnique({
            where: { id: rating.id }
          });

          expect(deletedRating).toBeNull();

          // Clean up user
          await prisma.user.delete({ where: { id: user.id } });
        }
      ),
      { numRuns: 10 }
    );
  });
});
