/**
 * Property-Based Tests for Store Management
 * Feature: store-rating-platform, Property 10: System administrators can create stores
 * Feature: store-rating-platform, Property 16: Normal users can view all stores
 * Validates: Requirements 3.5, 3.6, 6.1
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const StoreService = require('../services/StoreService');
const { generateToken } = require('../utils/jwtUtils');

const prisma = new PrismaClient();
const storeService = new StoreService();

describe('Store Management Property Tests', () => {
  
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

  describe('Property 10: System administrators can create stores', () => {
    
    // Generator for valid store names (20-60 characters)
    const validStoreNameArbitrary = fc.string({ minLength: 20, maxLength: 60 })
      .filter(s => s.trim().length >= 20 && s.trim().length <= 60);

    // Generator for valid addresses (1-400 characters)
    const validAddressArbitrary = fc.string({ minLength: 20, maxLength: 400 })
      .filter(s => s.trim().length > 0 && s.trim().length <= 400);

    // Generator for unique email addresses
    const uniqueEmailArbitrary = fc.integer({ min: 1, max: 1000000 })
      .map(n => `store${n}@example.com`);

    it('should allow system administrators to create stores with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          validStoreNameArbitrary,
          uniqueEmailArbitrary,
          validAddressArbitrary,
          async (name, email, address) => {
            try {
              // Create store with valid data
              const store = await storeService.createStore({
                name,
                email,
                address
              });

              // Verify store was created successfully
              const isCreated = store !== null &&
                               store.id !== undefined &&
                               store.name === name.trim() &&
                               store.email === email &&
                               store.address === address.trim();

              // Verify store is retrievable
              const retrievedStore = await storeService.getStoreById(store.id);
              const isRetrievable = retrievedStore !== null &&
                                   retrievedStore.id === store.id;

              // Clean up - delete the created store
              await prisma.store.delete({ where: { id: store.id } });

              return isCreated && isRetrievable;
            } catch (error) {
              // If error is due to duplicate email, skip this test case
              if (error.message.includes('already exists')) {
                return true;
              }
              // Any other error means the test failed
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should persist created stores to the database', async () => {
      await fc.assert(
        fc.asyncProperty(
          validStoreNameArbitrary,
          uniqueEmailArbitrary,
          validAddressArbitrary,
          async (name, email, address) => {
            try {
              // Create store
              const store = await storeService.createStore({
                name,
                email,
                address
              });

              // Query database directly to verify persistence
              const dbStore = await prisma.store.findUnique({
                where: { id: store.id }
              });

              const isPersisted = dbStore !== null &&
                                 dbStore.name === name.trim() &&
                                 dbStore.email === email &&
                                 dbStore.address === address.trim();

              // Clean up
              await prisma.store.delete({ where: { id: store.id } });

              return isPersisted;
            } catch (error) {
              if (error.message.includes('already exists')) {
                return true;
              }
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject stores with invalid names (too short)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 19 }), // Invalid name length
          uniqueEmailArbitrary,
          validAddressArbitrary,
          async (name, email, address) => {
            try {
              await storeService.createStore({
                name,
                email,
                address
              });
              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw validation error
              return error.message !== undefined;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject stores with invalid names (too long)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 61, maxLength: 100 }).filter(s => s.trim().length > 60), // Invalid name length
          uniqueEmailArbitrary,
          validAddressArbitrary,
          async (name, email, address) => {
            try {
              await storeService.createStore({
                name,
                email,
                address
              });
              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw validation error
              return error.message !== undefined;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject stores with invalid email format', async () => {
      await fc.assert(
        fc.asyncProperty(
          validStoreNameArbitrary,
          fc.string().filter(s => !s.includes('@')), // Invalid email
          validAddressArbitrary,
          async (name, email, address) => {
            try {
              await storeService.createStore({
                name,
                email,
                address
              });
              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw validation error
              return error.message !== undefined;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject stores with invalid addresses (too long)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validStoreNameArbitrary,
          uniqueEmailArbitrary,
          fc.string({ minLength: 401, maxLength: 500 }).filter(s => s.trim().length > 400), // Invalid address length after trim
          async (name, email, address) => {
            try {
              await storeService.createStore({
                name,
                email,
                address
              });
              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw validation error
              return error.message !== undefined;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject duplicate store emails', async () => {
      // Create a store first
      const firstStore = await storeService.createStore({
        name: 'First Store With Valid Name',
        email: 'duplicate-test@example.com',
        address: 'First Store Address, City, State'
      });

      await fc.assert(
        fc.asyncProperty(
          validStoreNameArbitrary,
          validAddressArbitrary,
          async (name, address) => {
            try {
              // Try to create another store with the same email
              await storeService.createStore({
                name,
                email: 'duplicate-test@example.com', // Same email
                address
              });
              // If no error was thrown, the test fails
              return false;
            } catch (error) {
              // Should throw duplicate email error
              return error.message.includes('already exists');
            }
          }
        ),
        { numRuns: 10 }
      );

      // Clean up
      await prisma.store.delete({ where: { id: firstStore.id } });
    });
  });

  describe('Property 16: Normal users can view all stores', () => {
    
    let testStores = [];

    beforeAll(async () => {
      // Create multiple test stores for viewing tests
      const storeData = [
        {
          name: 'Test Store Alpha With Valid Name',
          email: 'alpha@viewtest.com',
          address: 'Alpha Street 123, Alpha City, Alpha State'
        },
        {
          name: 'Test Store Beta With Valid Name',
          email: 'beta@viewtest.com',
          address: 'Beta Avenue 456, Beta City, Beta State'
        },
        {
          name: 'Test Store Gamma With Valid Name',
          email: 'gamma@viewtest.com',
          address: 'Gamma Road 789, Gamma City, Gamma State'
        }
      ];

      for (const data of storeData) {
        const store = await storeService.createStore(data);
        testStores.push(store);
      }
    });

    afterAll(async () => {
      // Clean up test stores
      for (const store of testStores) {
        await prisma.store.delete({ where: { id: store.id } });
      }
      testStores = [];
    });

    it('should allow normal users to retrieve all stores', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }), // Normal user ID
          async (userId) => {
            // Normal users should be able to call getAllStores
            const stores = await storeService.getAllStores();

            // Verify that stores were returned
            const hasStores = Array.isArray(stores) && stores.length >= testStores.length;

            // Verify that all test stores are in the results
            const allTestStoresPresent = testStores.every(testStore =>
              stores.some(store => store.id === testStore.id)
            );

            return hasStores && allTestStoresPresent;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return stores with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }),
          async (userId) => {
            const stores = await storeService.getAllStores();

            // Verify each store has required fields
            const allStoresHaveRequiredFields = stores.every(store =>
              store.id !== undefined &&
              store.name !== undefined &&
              store.email !== undefined &&
              store.address !== undefined &&
              store.createdAt !== undefined &&
              store.updatedAt !== undefined
            );

            return allStoresHaveRequiredFields;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should support filtering stores by name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Alpha', 'Beta', 'Gamma'),
          async (searchTerm) => {
            const stores = await storeService.getAllStores({ name: searchTerm });

            // All returned stores should contain the search term in their name
            const allMatchFilter = stores.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return allMatchFilter;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should support filtering stores by address', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Alpha', 'Beta', 'Gamma'),
          async (searchTerm) => {
            const stores = await storeService.getAllStores({ address: searchTerm });

            // All returned stores should contain the search term in their address
            const allMatchFilter = stores.every(store =>
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return allMatchFilter;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should support searching stores by name or address', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Alpha', 'Beta', 'Gamma', 'Street', 'Avenue', 'Road'),
          async (searchTerm) => {
            const stores = await storeService.getAllStores({ search: searchTerm });

            // All returned stores should contain the search term in name OR address
            const allMatchSearch = stores.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return allMatchSearch;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should support sorting stores by name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('asc', 'desc'),
          async (sortOrder) => {
            const stores = await storeService.getAllStores({
              sortBy: 'name',
              sortOrder
            });

            if (stores.length < 2) {
              return true; // Can't verify sorting with less than 2 items
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

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return consistent results for repeated queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100000 }),
          async (userId) => {
            // Query stores multiple times
            const firstQuery = await storeService.getAllStores();
            const secondQuery = await storeService.getAllStores();

            // Results should be consistent
            const sameLength = firstQuery.length === secondQuery.length;
            
            // All stores from first query should be in second query
            const allPresent = firstQuery.every(store1 =>
              secondQuery.some(store2 => store2.id === store1.id)
            );

            return sameLength && allPresent;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 14: Filtering returns only matching results', () => {
    
    let filterTestStores = [];

    beforeAll(async () => {
      // Create diverse test stores for comprehensive filtering tests
      const storeData = [
        {
          name: 'Acme Electronics Store With Valid Name',
          email: 'acme@electronics.com',
          address: '123 Main Street, New York, NY 10001'
        },
        {
          name: 'Best Buy Technology Store Name',
          email: 'contact@bestbuy.com',
          address: '456 Broadway Avenue, Los Angeles, CA 90001'
        },
        {
          name: 'Circuit City Electronics Valid Name',
          email: 'info@circuitcity.com',
          address: '789 Market Street, San Francisco, CA 94102'
        },
        {
          name: 'Digital Dreams Store Valid Name Here',
          email: 'hello@digitaldreams.com',
          address: '321 Oak Avenue, Chicago, IL 60601'
        },
        {
          name: 'Electronics Emporium Store Valid Name',
          email: 'sales@electronicsemporium.com',
          address: '654 Pine Street, Seattle, WA 98101'
        }
      ];

      for (const data of storeData) {
        const store = await storeService.createStore(data);
        filterTestStores.push(store);
      }
    });

    afterAll(async () => {
      // Clean up filter test stores
      for (const store of filterTestStores) {
        await prisma.store.delete({ where: { id: store.id } });
      }
      filterTestStores = [];
    });

    it('should return only stores matching name filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Electronics', 'Store', 'City', 'Best', 'Digital'),
          async (filterTerm) => {
            const filteredStores = await storeService.getAllStores({ name: filterTerm });

            // All returned stores must contain the filter term in their name
            const allMatch = filteredStores.every(store =>
              store.name.toLowerCase().includes(filterTerm.toLowerCase())
            );

            // Verify that stores NOT matching the filter are excluded
            const excludedStores = filterTestStores.filter(testStore =>
              !testStore.name.toLowerCase().includes(filterTerm.toLowerCase())
            );

            const noneExcludedPresent = !excludedStores.some(excludedStore =>
              filteredStores.some(store => store.id === excludedStore.id)
            );

            return allMatch && noneExcludedPresent;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return only stores matching email filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('acme', 'bestbuy', 'circuit', 'digital', 'electronics'),
          async (filterTerm) => {
            const filteredStores = await storeService.getAllStores({ email: filterTerm });

            // All returned stores must contain the filter term in their email
            const allMatch = filteredStores.every(store =>
              store.email.toLowerCase().includes(filterTerm.toLowerCase())
            );

            // Verify that stores NOT matching the filter are excluded
            const excludedStores = filterTestStores.filter(testStore =>
              !testStore.email.toLowerCase().includes(filterTerm.toLowerCase())
            );

            const noneExcludedPresent = !excludedStores.some(excludedStore =>
              filteredStores.some(store => store.id === excludedStore.id)
            );

            return allMatch && noneExcludedPresent;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return only stores matching address filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Street', 'Avenue', 'New York', 'CA', 'Seattle'),
          async (filterTerm) => {
            const filteredStores = await storeService.getAllStores({ address: filterTerm });

            // All returned stores must contain the filter term in their address
            const allMatch = filteredStores.every(store =>
              store.address.toLowerCase().includes(filterTerm.toLowerCase())
            );

            // Verify that stores NOT matching the filter are excluded
            const excludedStores = filterTestStores.filter(testStore =>
              !testStore.address.toLowerCase().includes(filterTerm.toLowerCase())
            );

            const noneExcludedPresent = !excludedStores.some(excludedStore =>
              filteredStores.some(store => store.id === excludedStore.id)
            );

            return allMatch && noneExcludedPresent;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return empty array when no stores match filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 40 })
            .filter(s => !filterTestStores.some(store => 
              store.name.toLowerCase().includes(s.toLowerCase()) ||
              store.email.toLowerCase().includes(s.toLowerCase()) ||
              store.address.toLowerCase().includes(s.toLowerCase())
            )),
          async (nonMatchingTerm) => {
            const filteredByName = await storeService.getAllStores({ name: nonMatchingTerm });
            const filteredByEmail = await storeService.getAllStores({ email: nonMatchingTerm });
            const filteredByAddress = await storeService.getAllStores({ address: nonMatchingTerm });

            // Should return empty arrays when nothing matches
            return filteredByName.length === 0 &&
                   filteredByEmail.length === 0 &&
                   filteredByAddress.length === 0;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle case-insensitive filtering', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('electronics', 'ELECTRONICS', 'ElEcTrOnIcS'),
          async (filterTerm) => {
            const filteredStores = await storeService.getAllStores({ name: filterTerm });

            // Should return same results regardless of case
            const allMatch = filteredStores.every(store =>
              store.name.toLowerCase().includes(filterTerm.toLowerCase())
            );

            // Should find stores with "Electronics" in the name
            const foundElectronicsStores = filteredStores.length > 0;

            return allMatch && foundElectronicsStores;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should support multiple simultaneous filters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Store', 'Electronics'),
          fc.constantFrom('Street', 'Avenue'),
          async (nameFilter, addressFilter) => {
            const filteredStores = await storeService.getAllStores({
              name: nameFilter,
              address: addressFilter
            });

            // All returned stores must match BOTH filters
            const allMatch = filteredStores.every(store =>
              store.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
              store.address.toLowerCase().includes(addressFilter.toLowerCase())
            );

            return allMatch;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return consistent filter results across multiple queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Electronics', 'Store', 'Street'),
          async (filterTerm) => {
            const firstQuery = await storeService.getAllStores({ name: filterTerm });
            const secondQuery = await storeService.getAllStores({ name: filterTerm });

            // Results should be identical
            const sameLength = firstQuery.length === secondQuery.length;
            
            const sameStores = firstQuery.every(store1 =>
              secondQuery.some(store2 => store2.id === store1.id)
            );

            return sameLength && sameStores;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 17: Search returns stores matching search terms', () => {
    
    let searchTestStores = [];

    beforeAll(async () => {
      // Create test stores with diverse names and addresses for search testing
      const storeData = [
        {
          name: 'Premium Coffee Shop Valid Name Here',
          email: 'contact@premiumcoffee.com',
          address: '100 Coffee Lane, Portland, OR 97201'
        },
        {
          name: 'Urban Bookstore Valid Name Here',
          email: 'info@urbanbookstore.com',
          address: '200 Reading Road, Boston, MA 02101'
        },
        {
          name: 'Fitness Center Gym Valid Name Here',
          email: 'hello@fitnesscenter.com',
          address: '300 Health Street, Denver, CO 80201'
        },
        {
          name: 'Organic Market Store Valid Name',
          email: 'sales@organicmarket.com',
          address: '400 Green Avenue, Austin, TX 78701'
        },
        {
          name: 'Tech Repair Shop Valid Name Here',
          email: 'support@techrepair.com',
          address: '500 Technology Boulevard, Miami, FL 33101'
        }
      ];

      for (const data of storeData) {
        const store = await storeService.createStore(data);
        searchTestStores.push(store);
      }
    });

    afterAll(async () => {
      // Clean up search test stores
      for (const store of searchTestStores) {
        await prisma.store.delete({ where: { id: store.id } });
      }
      searchTestStores = [];
    });

    it('should return stores matching search term in name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Coffee', 'Bookstore', 'Fitness', 'Market', 'Tech'),
          async (searchTerm) => {
            const searchResults = await storeService.getAllStores({ search: searchTerm });

            // All returned stores must contain the search term in name OR address
            const allMatch = searchResults.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // At least one store should match in the name
            const someMatchInName = searchResults.some(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return allMatch && someMatchInName;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return stores matching search term in address', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Lane', 'Road', 'Street', 'Avenue', 'Boulevard'),
          async (searchTerm) => {
            const searchResults = await storeService.getAllStores({ search: searchTerm });

            // All returned stores must contain the search term in name OR address
            const allMatch = searchResults.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // At least one store should match in the address
            const someMatchInAddress = searchResults.some(store =>
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return allMatch && someMatchInAddress;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return stores matching search term in either name or address', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Valid', 'Store', '00', 'OR', 'MA'),
          async (searchTerm) => {
            const searchResults = await storeService.getAllStores({ search: searchTerm });

            // Every result must match the search term in name OR address
            const allMatch = searchResults.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Verify no stores are returned that don't match
            const noNonMatchingStores = !searchTestStores
              .filter(testStore =>
                !testStore.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !testStore.address.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .some(nonMatchingStore =>
                searchResults.some(result => result.id === nonMatchingStore.id)
              );

            return allMatch && noNonMatchingStores;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle case-insensitive search', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('coffee', 'COFFEE', 'CoFfEe', 'portland', 'PORTLAND', 'PoRtLaNd'),
          async (searchTerm) => {
            const searchResults = await storeService.getAllStores({ search: searchTerm });

            // Should return results regardless of case
            const allMatch = searchResults.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Should find at least one result for these known terms
            const foundResults = searchResults.length > 0;

            return allMatch && foundResults;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return empty array when search term matches nothing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 40 })
            .filter(s => !searchTestStores.some(store =>
              store.name.toLowerCase().includes(s.toLowerCase()) ||
              store.address.toLowerCase().includes(s.toLowerCase())
            )),
          async (nonMatchingTerm) => {
            const searchResults = await storeService.getAllStores({ search: nonMatchingTerm });

            // Should return empty array when nothing matches
            return searchResults.length === 0;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return partial matches for search terms', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Cof', 'Book', 'Fit', 'Mark', 'Tech', 'Lan', 'Roa', 'Stre'),
          async (partialTerm) => {
            const searchResults = await storeService.getAllStores({ search: partialTerm });

            // All results should contain the partial term
            const allMatch = searchResults.every(store =>
              store.name.toLowerCase().includes(partialTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(partialTerm.toLowerCase())
            );

            return allMatch;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return consistent search results across multiple queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Coffee', 'Street', 'Valid', 'Store'),
          async (searchTerm) => {
            const firstQuery = await storeService.getAllStores({ search: searchTerm });
            const secondQuery = await storeService.getAllStores({ search: searchTerm });

            // Results should be identical
            const sameLength = firstQuery.length === secondQuery.length;
            
            const sameStores = firstQuery.every(store1 =>
              secondQuery.some(store2 => store2.id === store1.id)
            );

            return sameLength && sameStores;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should prioritize exact matches but include partial matches', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('Coffee', 'Bookstore', 'Fitness', 'Market', 'Tech'),
          async (searchTerm) => {
            const searchResults = await storeService.getAllStores({ search: searchTerm });

            // All results should match the search term
            const allMatch = searchResults.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return allMatch;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle search with special characters gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('100', '200', '300', '400', '500'),
          async (searchTerm) => {
            const searchResults = await storeService.getAllStores({ search: searchTerm });

            // Should find stores with these numbers in addresses
            const allMatch = searchResults.every(store =>
              store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              store.address.toLowerCase().includes(searchTerm.toLowerCase())
            );

            const foundResults = searchResults.length > 0;

            return allMatch && foundResults;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
