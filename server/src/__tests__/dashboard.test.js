const { PrismaClient } = require('@prisma/client');
const DashboardService = require('../services/DashboardService');

const prisma = new PrismaClient();
const dashboardService = new DashboardService();

describe('Dashboard Service', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.rating.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getAdminStats', () => {
    it('should return correct counts for users, stores, and ratings', async () => {
      // Create test data
      const user1 = await prisma.user.create({
        data: {
          name: 'Test User One For Dashboard',
          email: 'testuser1@dashboard.com',
          password: 'hashedpassword',
          address: '123 Test St, Dashboard City',
          role: 'NORMAL_USER'
        }
      });

      const user2 = await prisma.user.create({
        data: {
          name: 'Test User Two For Dashboard',
          email: 'testuser2@dashboard.com',
          password: 'hashedpassword',
          address: '456 Test Ave, Dashboard City',
          role: 'NORMAL_USER'
        }
      });

      const store1 = await prisma.store.create({
        data: {
          name: 'Test Store One For Dashboard',
          email: 'store1@dashboard.com',
          address: '789 Store Blvd, Dashboard City'
        }
      });

      const store2 = await prisma.store.create({
        data: {
          name: 'Test Store Two For Dashboard',
          email: 'store2@dashboard.com',
          address: '101 Store Lane, Dashboard City'
        }
      });

      await prisma.rating.create({
        data: {
          value: 5,
          userId: user1.id,
          storeId: store1.id
        }
      });

      await prisma.rating.create({
        data: {
          value: 4,
          userId: user2.id,
          storeId: store1.id
        }
      });

      await prisma.rating.create({
        data: {
          value: 3,
          userId: user1.id,
          storeId: store2.id
        }
      });

      // Get admin stats
      const stats = await dashboardService.getAdminStats();

      // Verify counts
      expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
      expect(stats.totalStores).toBeGreaterThanOrEqual(2);
      expect(stats.totalRatings).toBeGreaterThanOrEqual(3);

      // Clean up
      await prisma.rating.deleteMany({
        where: {
          OR: [
            { userId: user1.id },
            { userId: user2.id }
          ]
        }
      });
      await prisma.store.deleteMany({
        where: {
          id: { in: [store1.id, store2.id] }
        }
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [user1.id, user2.id] }
        }
      });
    });
  });

  describe('getOwnerStats', () => {
    it('should return average rating and ratings list for store owner', async () => {
      // Create store owner
      const store = await prisma.store.create({
        data: {
          name: 'Owner Test Store For Dashboard',
          email: 'ownerstore@dashboard.com',
          address: '999 Owner St, Dashboard City'
        }
      });

      const owner = await prisma.user.create({
        data: {
          name: 'Store Owner For Dashboard Test',
          email: 'owner@dashboard.com',
          password: 'hashedpassword',
          address: '888 Owner Ave, Dashboard City',
          role: 'STORE_OWNER',
          storeId: store.id
        }
      });

      // Create normal users and ratings
      const user1 = await prisma.user.create({
        data: {
          name: 'Rater One For Dashboard Test',
          email: 'rater1@dashboard.com',
          password: 'hashedpassword',
          address: '111 Rater St, Dashboard City',
          role: 'NORMAL_USER'
        }
      });

      const user2 = await prisma.user.create({
        data: {
          name: 'Rater Two For Dashboard Test',
          email: 'rater2@dashboard.com',
          password: 'hashedpassword',
          address: '222 Rater Ave, Dashboard City',
          role: 'NORMAL_USER'
        }
      });

      await prisma.rating.create({
        data: {
          value: 5,
          userId: user1.id,
          storeId: store.id
        }
      });

      await prisma.rating.create({
        data: {
          value: 3,
          userId: user2.id,
          storeId: store.id
        }
      });

      // Get owner stats
      const stats = await dashboardService.getOwnerStats(owner.id);

      // Verify stats
      expect(stats.averageRating).toBe(4); // (5 + 3) / 2 = 4
      expect(stats.totalRatings).toBe(2);
      expect(stats.ratings).toHaveLength(2);
      expect(stats.ratings[0]).toHaveProperty('userName');
      expect(stats.ratings[0]).toHaveProperty('userEmail');
      expect(stats.ratings[0]).toHaveProperty('value');

      // Clean up
      await prisma.rating.deleteMany({
        where: { storeId: store.id }
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [owner.id, user1.id, user2.id] }
        }
      });
      await prisma.store.deleteMany({
        where: { id: store.id }
      });
    });

    it('should throw error if user is not a store owner', async () => {
      const normalUser = await prisma.user.create({
        data: {
          name: 'Normal User For Dashboard Error Test',
          email: 'normaluser@dashboard.com',
          password: 'hashedpassword',
          address: '333 Normal St, Dashboard City',
          role: 'NORMAL_USER'
        }
      });

      await expect(dashboardService.getOwnerStats(normalUser.id))
        .rejects
        .toThrow('User is not a store owner');

      // Clean up
      await prisma.user.deleteMany({
        where: { id: normalUser.id }
      });
    });
  });
});
