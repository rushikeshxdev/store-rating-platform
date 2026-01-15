const { PrismaClient } = require('@prisma/client');
const StoreService = require('../services/StoreService');

const prisma = new PrismaClient();
const storeService = new StoreService();

describe('StoreService', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.rating.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createStore', () => {
    it('should create a store with valid data', async () => {
      const storeData = {
        name: 'Test Store With Valid Name',
        email: 'teststore@example.com',
        address: 'Test Address 123, Test City, Test State'
      };

      const store = await storeService.createStore(storeData);

      expect(store).toBeDefined();
      expect(store.name).toBe(storeData.name.trim());
      expect(store.email).toBe(storeData.email);
      expect(store.address).toBe(storeData.address.trim());
    });

    it('should reject store with invalid name (too short)', async () => {
      const storeData = {
        name: 'Short',
        email: 'short@example.com',
        address: 'Test Address 123, Test City, Test State'
      };

      await expect(storeService.createStore(storeData)).rejects.toThrow();
    });

    it('should reject store with duplicate email', async () => {
      const storeData = {
        name: 'Another Test Store Name',
        email: 'teststore@example.com', // Same as first test
        address: 'Test Address 456, Test City, Test State'
      };

      await expect(storeService.createStore(storeData)).rejects.toThrow('Store email already exists');
    });
  });

  describe('getStoreById', () => {
    it('should return store by ID', async () => {
      const stores = await prisma.store.findMany();
      const firstStore = stores[0];

      const store = await storeService.getStoreById(firstStore.id);

      expect(store).toBeDefined();
      expect(store.id).toBe(firstStore.id);
      expect(store.name).toBe(firstStore.name);
    });

    it('should return null for non-existent store', async () => {
      const store = await storeService.getStoreById(99999);
      expect(store).toBeNull();
    });
  });

  describe('getAllStores', () => {
    it('should return all stores', async () => {
      const stores = await storeService.getAllStores();
      expect(stores).toBeDefined();
      expect(Array.isArray(stores)).toBe(true);
      expect(stores.length).toBeGreaterThan(0);
    });

    it('should filter stores by name', async () => {
      const stores = await storeService.getAllStores({ name: 'Test Store' });
      expect(stores).toBeDefined();
      expect(stores.length).toBeGreaterThan(0);
      expect(stores[0].name).toContain('Test Store');
    });

    it('should search stores by name or address', async () => {
      const stores = await storeService.getAllStores({ search: 'Test' });
      expect(stores).toBeDefined();
      expect(stores.length).toBeGreaterThan(0);
    });
  });

  describe('calculateAverageRating', () => {
    it('should return null for store with no ratings', async () => {
      const stores = await prisma.store.findMany();
      const firstStore = stores[0];

      const avgRating = await storeService.calculateAverageRating(firstStore.id);
      expect(avgRating).toBeNull();
    });
  });
});
