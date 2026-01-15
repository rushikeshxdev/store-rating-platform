/**
 * Property-Based Tests for Sorting Functionality
 * Feature: store-rating-platform, Property 15: Sorting orders results correctly
 * Validates: Requirements 5.5, 6.6
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const StoreService = require('../services/StoreService');
const UserService = require('../services/UserService');

const prisma = new PrismaClient();
const storeService = new StoreService();
const userService = new UserService();

describe('Property 15: Sorting orders results correctly', () => {
  
  let testStores = [];
  let testUsers = [];

  beforeAll(async () => {
    // Clean up test data before running tests
    await prisma.rating.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    // Create diverse test stores for sorting tests
    const storeData = [
      {
        name: 'Alpha Electronics Store Valid Name',
        email: 'alpha@sorting.com',
        address: 'Alpha Street 100, Alpha City, State'
      },
      {
        name: 'Beta Technology Store Valid Name',
        email: 'beta@sorting.com',
        address: 'Beta Avenue 200, Beta City, State'
      },
      {
        name: 'Charlie Computers Store Valid Name',
        email: 'charlie@sorting.com',
        address: 'Charlie Road 300, Charlie City, State'
      },
      {
        name: 'Delta Digital Store Valid Name',
        email: 'delta@sorting.com',
        address: 'Delta Boulevard 400, Delta City, State'
      },
      {
        name: 'Echo Electronics Store Valid Name',
        email: 'echo@sorting.com',
        address: 'Echo Lane 500, Echo City, State'
      }
    ];

    for (const data of storeData) {
      const store = await storeService.createStore(data);
      testStores.push(store);
    }

    // Create diverse test users for sorting tests
    const userData = [
      {
        name: 'Alice Anderson User Valid Name',
        email: 'alice@sortingtest.com',
        password: 'Password1!',
        address: 'Alice Street 100, Alice City, State',
        role: 'NORMAL_USER'
      },
      {
        name: 'Bob Brown User Valid Name Here',
        email: 'bob@sortingtest.com',
        password: 'Password2!',
        address: 'Bob Avenue 200, Bob City, State',
        role: 'SYSTEM_ADMIN'
      },
      {
        name: 'Charlie Chen User Valid Name',
        email: 'charlie@sortingtest.com',
        password: 'Password3!',
        address: 'Charlie Road 300, Charlie City, State',
        role: 'STORE_OWNER'
      },
      {
        name: 'Diana Davis User Valid Name',
        email: 'diana@sortingtest.com',
        password: 'Password4!',
        address: 'Diana Boulevard 400, Diana City, State',
        role: 'NORMAL_USER'
      },
      {
        name: 'Edward Evans User Valid Name',
        email: 'edward@sortingtest.com',
        password: 'Password5!',
        address: 'Edward Lane 500, Edward City, State',
        role: 'SYSTEM_ADMIN'
      }
    ];

    for (const data of userData) {
      const user = await userService.createUser(data);
      testUsers.push(user);
    }
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await prisma.rating.deleteMany({});
    for (const store of testStores) {
      await prisma.store.delete({ where: { id: store.id } });
    }
    for (const user of testUsers) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    testStores = [];
    testUsers = [];
    await prisma.$disconnect();
  });

  describe('Store Sorting', () => {
    
    it('should sort stores by name in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const stores = await storeService.getAllStores({
              sortBy: 'name',
              sortOrder: 'asc'
            });

            if (stores.length < 2) {
              return true; // Can't verify sorting with less than 2 items
            }

            // Verify stores are sorted in ascending order by name
            for (let i = 0; i < stores.length - 1; i++) {
              const current = stores[i].name.toLowerCase();
              const next = stores[i + 1].name.toLowerCase();

              if (current > next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort stores by name in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const stores = await storeService.getAllStores({
              sortBy: 'name',
              sortOrder: 'desc'
            });

            if (stores.length < 2) {
              return true; // Can't verify sorting with less than 2 items
            }

            // Verify stores are sorted in descending order by name
            for (let i = 0; i < stores.length - 1; i++) {
              const current = stores[i].name.toLowerCase();
              const next = stores[i + 1].name.toLowerCase();

              if (current < next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort stores by email in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const stores = await storeService.getAllStores({
              sortBy: 'email',
              sortOrder: 'asc'
            });

            if (stores.length < 2) {
              return true;
            }

            // Verify stores are sorted in ascending order by email
            for (let i = 0; i < stores.length - 1; i++) {
              const current = stores[i].email.toLowerCase();
              const next = stores[i + 1].email.toLowerCase();

              if (current > next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort stores by email in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const stores = await storeService.getAllStores({
              sortBy: 'email',
              sortOrder: 'desc'
            });

            if (stores.length < 2) {
              return true;
            }

            // Verify stores are sorted in descending order by email
            for (let i = 0; i < stores.length - 1; i++) {
              const current = stores[i].email.toLowerCase();
              const next = stores[i + 1].email.toLowerCase();

              if (current < next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort stores by createdAt in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const stores = await storeService.getAllStores({
              sortBy: 'createdAt',
              sortOrder: 'asc'
            });

            if (stores.length < 2) {
              return true;
            }

            // Verify stores are sorted in ascending order by createdAt
            for (let i = 0; i < stores.length - 1; i++) {
              const current = new Date(stores[i].createdAt).getTime();
              const next = new Date(stores[i + 1].createdAt).getTime();

              if (current > next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort stores by createdAt in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const stores = await storeService.getAllStores({
              sortBy: 'createdAt',
              sortOrder: 'desc'
            });

            if (stores.length < 2) {
              return true;
            }

            // Verify stores are sorted in descending order by createdAt
            for (let i = 0; i < stores.length - 1; i++) {
              const current = new Date(stores[i].createdAt).getTime();
              const next = new Date(stores[i + 1].createdAt).getTime();

              if (current < next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain sort order when combined with filters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('asc', 'desc'),
          fc.constantFrom('Store', 'Electronics', 'Valid'),
          async (sortOrder, filterTerm) => {
            const stores = await storeService.getAllStores({
              name: filterTerm,
              sortBy: 'name',
              sortOrder
            });

            if (stores.length < 2) {
              return true;
            }

            // Verify stores are sorted correctly
            for (let i = 0; i < stores.length - 1; i++) {
              const current = stores[i].name.toLowerCase();
              const next = stores[i + 1].name.toLowerCase();

              if (sortOrder === 'asc') {
                if (current > next) return false;
              } else {
                if (current < next) return false;
              }
            }

            // Verify all stores match the filter
            const allMatch = stores.every(store =>
              store.name.toLowerCase().includes(filterTerm.toLowerCase())
            );

            return allMatch;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('User Sorting', () => {
    
    it('should sort users by name in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const users = await userService.getAllUsers({
              sortBy: 'name',
              sortOrder: 'asc'
            });

            if (users.length < 2) {
              return true;
            }

            // Verify users are sorted in ascending order by name
            for (let i = 0; i < users.length - 1; i++) {
              const current = users[i].name.toLowerCase();
              const next = users[i + 1].name.toLowerCase();

              if (current > next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort users by name in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const users = await userService.getAllUsers({
              sortBy: 'name',
              sortOrder: 'desc'
            });

            if (users.length < 2) {
              return true;
            }

            // Verify users are sorted in descending order by name
            for (let i = 0; i < users.length - 1; i++) {
              const current = users[i].name.toLowerCase();
              const next = users[i + 1].name.toLowerCase();

              if (current < next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort users by email in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const users = await userService.getAllUsers({
              sortBy: 'email',
              sortOrder: 'asc'
            });

            if (users.length < 2) {
              return true;
            }

            // Verify users are sorted in ascending order by email
            for (let i = 0; i < users.length - 1; i++) {
              const current = users[i].email.toLowerCase();
              const next = users[i + 1].email.toLowerCase();

              if (current > next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort users by email in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const users = await userService.getAllUsers({
              sortBy: 'email',
              sortOrder: 'desc'
            });

            if (users.length < 2) {
              return true;
            }

            // Verify users are sorted in descending order by email
            for (let i = 0; i < users.length - 1; i++) {
              const current = users[i].email.toLowerCase();
              const next = users[i + 1].email.toLowerCase();

              if (current < next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort users by createdAt in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const users = await userService.getAllUsers({
              sortBy: 'createdAt',
              sortOrder: 'asc'
            });

            if (users.length < 2) {
              return true;
            }

            // Verify users are sorted in ascending order by createdAt
            for (let i = 0; i < users.length - 1; i++) {
              const current = new Date(users[i].createdAt).getTime();
              const next = new Date(users[i + 1].createdAt).getTime();

              if (current > next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort users by createdAt in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (iteration) => {
            const users = await userService.getAllUsers({
              sortBy: 'createdAt',
              sortOrder: 'desc'
            });

            if (users.length < 2) {
              return true;
            }

            // Verify users are sorted in descending order by createdAt
            for (let i = 0; i < users.length - 1; i++) {
              const current = new Date(users[i].createdAt).getTime();
              const next = new Date(users[i + 1].createdAt).getTime();

              if (current < next) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain sort order when combined with filters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('asc', 'desc'),
          fc.constantFrom('User', 'Valid', 'Name'),
          async (sortOrder, filterTerm) => {
            const users = await userService.getAllUsers({
              name: filterTerm,
              sortBy: 'name',
              sortOrder
            });

            if (users.length < 2) {
              return true;
            }

            // Verify users are sorted correctly
            for (let i = 0; i < users.length - 1; i++) {
              const current = users[i].name.toLowerCase();
              const next = users[i + 1].name.toLowerCase();

              if (sortOrder === 'asc') {
                if (current > next) return false;
              } else {
                if (current < next) return false;
              }
            }

            // Verify all users match the filter
            const allMatch = users.every(user =>
              user.name.toLowerCase().includes(filterTerm.toLowerCase())
            );

            return allMatch;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should sort users by role and maintain consistent ordering', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'),
          fc.constantFrom('asc', 'desc'),
          async (roleFilter, sortOrder) => {
            const users = await userService.getAllUsers({
              role: roleFilter,
              sortBy: 'name',
              sortOrder
            });

            // All users should have the filtered role
            const allMatchRole = users.every(user => user.role === roleFilter);

            if (users.length < 2) {
              return allMatchRole;
            }

            // Verify users are sorted correctly by name
            for (let i = 0; i < users.length - 1; i++) {
              const current = users[i].name.toLowerCase();
              const next = users[i + 1].name.toLowerCase();

              if (sortOrder === 'asc') {
                if (current > next) return false;
              } else {
                if (current < next) return false;
              }
            }

            return allMatchRole;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Sorting Consistency', () => {
    
    it('should return consistent sort results across multiple queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('name', 'email', 'createdAt'),
          fc.constantFrom('asc', 'desc'),
          async (sortBy, sortOrder) => {
            const firstQuery = await storeService.getAllStores({ sortBy, sortOrder });
            const secondQuery = await storeService.getAllStores({ sortBy, sortOrder });

            // Results should be identical
            if (firstQuery.length !== secondQuery.length) {
              return false;
            }

            // Verify same stores in same order
            for (let i = 0; i < firstQuery.length; i++) {
              if (firstQuery[i].id !== secondQuery[i].id) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle sorting with empty result sets', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('name', 'email'),
          fc.constantFrom('asc', 'desc'),
          fc.string({ minLength: 30, maxLength: 50 })
            .filter(s => !testStores.some(store => 
              store.name.toLowerCase().includes(s.toLowerCase()) ||
              store.email.toLowerCase().includes(s.toLowerCase())
            )),
          async (sortBy, sortOrder, nonMatchingFilter) => {
            const stores = await storeService.getAllStores({
              name: nonMatchingFilter,
              sortBy,
              sortOrder
            });

            // Should return empty array without errors
            return Array.isArray(stores) && stores.length === 0;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle sorting with single result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'),
          fc.constantFrom('name', 'email'),
          fc.constantFrom('asc', 'desc'),
          async (uniqueTerm, sortBy, sortOrder) => {
            const stores = await storeService.getAllStores({
              name: uniqueTerm,
              sortBy,
              sortOrder
            });

            // Should handle single result without errors
            return Array.isArray(stores) && stores.length <= 1;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
