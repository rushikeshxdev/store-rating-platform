// Feature: store-rating-platform, Property 27: Data persistence round-trip
// Validates: Requirements 11.5

const { PrismaClient } = require('@prisma/client');
const fc = require('fast-check');

const prisma = new PrismaClient();

describe('Property 27: Data persistence round-trip', () => {
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

  // Generator for valid user data
  const validUserArb = fc.record({
    name: fc.string({ minLength: 20, maxLength: 60 }),
    email: fc.emailAddress(),
    password: fc.string({ minLength: 8, maxLength: 16 }),
    address: fc.string({ minLength: 1, maxLength: 400 }),
    role: fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER')
  });

  // Generator for valid store data
  const validStoreArb = fc.record({
    name: fc.string({ minLength: 20, maxLength: 60 }),
    email: fc.emailAddress(),
    address: fc.string({ minLength: 1, maxLength: 400 })
  });

  // Generator for valid rating value
  const validRatingArb = fc.integer({ min: 1, max: 5 });

  it('should persist and retrieve user data correctly', async () => {
    await fc.assert(
      fc.asyncProperty(validUserArb, async (userData) => {
        // Create user
        const createdUser = await prisma.user.create({
          data: {
            name: userData.name,
            email: `${Date.now()}-${Math.random()}-${userData.email}`,
            password: userData.password,
            address: userData.address,
            role: userData.role
          }
        });

        // Query for the user immediately after creation
        const retrievedUser = await prisma.user.findUnique({
          where: { id: createdUser.id }
        });

        // Verify data matches
        expect(retrievedUser).not.toBeNull();
        expect(retrievedUser.name).toBe(userData.name);
        expect(retrievedUser.email).toBe(createdUser.email);
        expect(retrievedUser.password).toBe(userData.password);
        expect(retrievedUser.address).toBe(userData.address);
        expect(retrievedUser.role).toBe(userData.role);
      }),
      { numRuns: 10 }
    );
  });

  it('should persist and retrieve store data correctly', async () => {
    await fc.assert(
      fc.asyncProperty(validStoreArb, async (storeData) => {
        // Create store
        const createdStore = await prisma.store.create({
          data: {
            name: storeData.name,
            email: `${Date.now()}-${Math.random()}-${storeData.email}`,
            address: storeData.address
          }
        });

        // Query for the store immediately after creation
        const retrievedStore = await prisma.store.findUnique({
          where: { id: createdStore.id }
        });

        // Verify data matches
        expect(retrievedStore).not.toBeNull();
        expect(retrievedStore.name).toBe(storeData.name);
        expect(retrievedStore.email).toBe(createdStore.email);
        expect(retrievedStore.address).toBe(storeData.address);
      }),
      { numRuns: 10 }
    );
  });

  it('should persist and retrieve rating data correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserArb,
        validStoreArb,
        validRatingArb,
        async (userData, storeData, ratingValue) => {
          // Create user and store first
          const user = await prisma.user.create({
            data: {
              name: userData.name,
              email: `${Date.now()}-${Math.random()}-${userData.email}`,
              password: userData.password,
              address: userData.address,
              role: userData.role
            }
          });

          const store = await prisma.store.create({
            data: {
              name: storeData.name,
              email: `${Date.now()}-${Math.random()}-${storeData.email}`,
              address: storeData.address
            }
          });

          // Create rating
          const createdRating = await prisma.rating.create({
            data: {
              value: ratingValue,
              userId: user.id,
              storeId: store.id
            }
          });

          // Query for the rating immediately after creation
          const retrievedRating = await prisma.rating.findUnique({
            where: { id: createdRating.id }
          });

          // Verify data matches
          expect(retrievedRating).not.toBeNull();
          expect(retrievedRating.value).toBe(ratingValue);
          expect(retrievedRating.userId).toBe(user.id);
          expect(retrievedRating.storeId).toBe(store.id);
        }
      ),
      { numRuns: 10 }
    );
  });
});
