/**
 * End-to-End Integration Tests
 * Task 22.1: End-to-end testing
 * Tests complete user flows through the API
 * Requirements: All
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const app = require('../server');

const prisma = new PrismaClient();

// Test server setup
let server;
const BASE_URL = 'http://localhost:5001';
const API_URL = `${BASE_URL}/api`;

// Test data storage
let testData = {
  adminToken: null,
  normalUserToken: null,
  storeOwnerToken: null,
  adminUser: null,
  normalUser: null,
  storeOwner: null,
  store: null,
  rating: null
};

describe('End-to-End Integration Tests', () => {
  
  beforeAll(async () => {
    // Start test server on different port
    server = app.listen(5001);
    
    // Clean up database
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.store.deleteMany({});
  });

  afterAll(async () => {
    // Clean up database
    await prisma.rating.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.store.deleteMany({});
    
    // Close connections
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  });

  describe('1. User Registration and Login Flow', () => {
    
    it('should register a new normal user successfully', async () => {
      const userData = {
        name: 'Test Normal User Account',
        email: 'normaluser@test.com',
        password: 'Password123!',
        address: '123 Test Street, Test City'
      };

      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.user).toBeDefined();
      expect(response.data.data.user.email).toBe(userData.email);
      expect(response.data.data.user.role).toBe('NORMAL_USER');
      expect(response.data.data.user.password).toBeUndefined();
    });

    it('should login with registered normal user credentials', async () => {
      const loginData = {
        email: 'normaluser@test.com',
        password: 'Password123!'
      };

      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.token).toBeDefined();
      expect(response.data.data.user).toBeDefined();
      expect(response.data.data.user.email).toBe(loginData.email);
      
      // Store token and user for later tests
      testData.normalUserToken = response.data.data.token;
      testData.normalUser = response.data.data.user;
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'normaluser@test.com',
        password: 'WrongPassword123!'
      };

      try {
        await axios.post(`${API_URL}/auth/login`, loginData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should get current user info with valid token', async () => {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${testData.normalUserToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.user.email).toBe('normaluser@test.com');
    });

    it('should logout successfully', async () => {
      const response = await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${testData.normalUserToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('2. Admin Creating Users and Stores', () => {
    
    it('should create admin user directly in database for testing', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('AdminPass123!', 12);
      
      const admin = await prisma.user.create({
        data: {
          name: 'System Administrator Account',
          email: 'admin@test.com',
          password: hashedPassword,
          address: '456 Admin Street, Admin City',
          role: 'SYSTEM_ADMIN'
        }
      });
      
      testData.adminUser = admin;
      
      // Login as admin
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@test.com',
        password: 'AdminPass123!'
      });
      
      testData.adminToken = response.data.data.token;
      expect(response.data.data.user.role).toBe('SYSTEM_ADMIN');
    });

    it('should allow admin to create a new normal user', async () => {
      const userData = {
        name: 'Admin Created Normal User',
        email: 'admincreated@test.com',
        password: 'Password123!',
        address: '789 Created Street, Test City',
        role: 'NORMAL_USER'
      };

      const response = await axios.post(`${API_URL}/users`, userData, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.user.email).toBe(userData.email);
      expect(response.data.data.user.role).toBe('NORMAL_USER');
    });

    it('should allow admin to create a store owner', async () => {
      const userData = {
        name: 'Test Store Owner Account',
        email: 'owner@test.com',
        password: 'OwnerPass123!',
        address: '321 Owner Street, Test City',
        role: 'STORE_OWNER'
      };

      const response = await axios.post(`${API_URL}/users`, userData, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.data.user.role).toBe('STORE_OWNER');
      testData.storeOwner = response.data.data.user;
      
      // Login as store owner
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'owner@test.com',
        password: 'OwnerPass123!'
      });
      testData.storeOwnerToken = loginResponse.data.data.token;
    });

    it('should allow admin to create a store', async () => {
      const storeData = {
        name: 'Test Store For Rating Platform',
        email: 'store@test.com',
        address: '555 Store Avenue, Shopping District'
      };

      const response = await axios.post(`${API_URL}/stores`, storeData, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.store).toBeDefined();
      expect(response.data.data.store.name).toBe(storeData.name);
      
      testData.store = response.data.data.store;
    });

    it('should allow admin to create another store', async () => {
      const storeData = {
        name: 'Second Test Store Platform',
        email: 'store2@test.com',
        address: '777 Store Boulevard, Shopping District'
      };

      const response = await axios.post(`${API_URL}/stores`, storeData, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.data.store.name).toBe(storeData.name);
    });

    it('should prevent normal user from creating stores', async () => {
      const storeData = {
        name: 'Unauthorized Store Creation',
        email: 'unauthorized@test.com',
        address: '999 Unauthorized Street'
      };

      try {
        await axios.post(`${API_URL}/stores`, storeData, {
          headers: { Authorization: `Bearer ${testData.normalUserToken}` }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    it('should allow admin to view all users', async () => {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.users).toBeDefined();
      expect(Array.isArray(response.data.data.users)).toBe(true);
      expect(response.data.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('3. Normal User Browsing and Rating Stores', () => {
    
    it('should allow normal user to view all stores', async () => {
      const response = await axios.get(`${API_URL}/stores`, {
        headers: { Authorization: `Bearer ${testData.normalUserToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.stores).toBeDefined();
      expect(Array.isArray(response.data.data.stores)).toBe(true);
      expect(response.data.data.stores.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow normal user to search stores by name', async () => {
      const response = await axios.get(`${API_URL}/stores?search=Test Store For`, {
        headers: { Authorization: `Bearer ${testData.normalUserToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.stores.length).toBeGreaterThan(0);
      expect(response.data.data.stores[0].name).toContain('Test Store For');
    });

    it('should allow normal user to view a specific store', async () => {
      const response = await axios.get(`${API_URL}/stores/${testData.store.id}`, {
        headers: { Authorization: `Bearer ${testData.normalUserToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.store).toBeDefined();
      expect(response.data.data.store.id).toBe(testData.store.id);
    });

    it('should allow normal user to submit a rating for a store', async () => {
      const ratingData = {
        storeId: testData.store.id,
        value: 4
      };

      const response = await axios.post(`${API_URL}/ratings`, ratingData, {
        headers: { Authorization: `Bearer ${testData.normalUserToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.rating).toBeDefined();
      expect(response.data.data.rating.value).toBe(4);
      expect(response.data.data.rating.storeId).toBe(testData.store.id);
      
      testData.rating = response.data.data.rating;
    });

    it('should prevent normal user from submitting duplicate rating', async () => {
      const ratingData = {
        storeId: testData.store.id,
        value: 5
      };

      try {
        await axios.post(`${API_URL}/ratings`, ratingData, {
          headers: { Authorization: `Bearer ${testData.normalUserToken}` }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(409);
      }
    });

    it('should allow normal user to modify their existing rating', async () => {
      const updatedRatingData = {
        value: 5
      };

      const response = await axios.put(
        `${API_URL}/ratings/${testData.rating.id}`, 
        updatedRatingData,
        { headers: { Authorization: `Bearer ${testData.normalUserToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.rating.value).toBe(5);
    });

    it('should show updated average rating for store', async () => {
      const response = await axios.get(`${API_URL}/stores/${testData.store.id}`, {
        headers: { Authorization: `Bearer ${testData.normalUserToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.store.averageRating).toBeDefined();
      expect(response.data.data.store.averageRating).toBe(5);
    });
  });

  describe('4. Store Owner Viewing Ratings', () => {
    
    it('should assign store to store owner', async () => {
      // Update store owner with storeId
      await prisma.user.update({
        where: { id: testData.storeOwner.id },
        data: { storeId: testData.store.id }
      });
    });

    it('should allow store owner to view their dashboard', async () => {
      const response = await axios.get(`${API_URL}/dashboard/owner`, {
        headers: { Authorization: `Bearer ${testData.storeOwnerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.averageRating).toBeDefined();
      expect(response.data.data.totalRatings).toBeGreaterThan(0);
    });

    it('should allow store owner to view ratings for their store', async () => {
      const response = await axios.get(`${API_URL}/ratings/store/${testData.store.id}`, {
        headers: { Authorization: `Bearer ${testData.storeOwnerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.ratings).toBeDefined();
      expect(Array.isArray(response.data.data.ratings)).toBe(true);
      expect(response.data.data.ratings.length).toBeGreaterThan(0);
      expect(response.data.data.ratings[0].value).toBeDefined();
      expect(response.data.data.ratings[0].user).toBeDefined();
    });

    it('should prevent normal user from viewing store ratings', async () => {
      try {
        await axios.get(`${API_URL}/ratings/store/${testData.store.id}`, {
          headers: { Authorization: `Bearer ${testData.normalUserToken}` }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('5. Password Updates', () => {
    
    it('should allow authenticated user to update their password', async () => {
      const passwordData = {
        newPassword: 'NewPassword123!'
      };

      const response = await axios.put(
        `${API_URL}/users/${testData.normalUser.id}/password`,
        passwordData,
        { headers: { Authorization: `Bearer ${testData.normalUserToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should allow login with new password', async () => {
      const loginData = {
        email: 'normaluser@test.com',
        password: 'NewPassword123!'
      };

      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      
      expect(response.status).toBe(200);
      expect(response.data.data.token).toBeDefined();
      
      // Update token
      testData.normalUserToken = response.data.data.token;
    });

    it('should reject login with old password', async () => {
      const loginData = {
        email: 'normaluser@test.com',
        password: 'Password123!'
      };

      try {
        await axios.post(`${API_URL}/auth/login`, loginData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject invalid password update', async () => {
      const passwordData = {
        newPassword: 'weak'
      };

      try {
        await axios.put(
          `${API_URL}/users/${testData.normalUser.id}/password`,
          passwordData,
          { headers: { Authorization: `Bearer ${testData.normalUserToken}` } }
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('6. Filters and Sorting', () => {
    
    it('should filter users by role', async () => {
      const response = await axios.get(`${API_URL}/users?role=NORMAL_USER`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.users).toBeDefined();
      response.data.data.users.forEach(user => {
        expect(user.role).toBe('NORMAL_USER');
      });
    });

    it('should filter users by name', async () => {
      const response = await axios.get(`${API_URL}/users?name=Normal`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.users.length).toBeGreaterThan(0);
      response.data.data.users.forEach(user => {
        expect(user.name.toLowerCase()).toContain('normal');
      });
    });

    it('should filter users by email', async () => {
      const response = await axios.get(`${API_URL}/users?email=normaluser`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.users.length).toBeGreaterThan(0);
      response.data.data.users.forEach(user => {
        expect(user.email.toLowerCase()).toContain('normaluser');
      });
    });

    it('should sort users by name ascending', async () => {
      const response = await axios.get(`${API_URL}/users?sortBy=name&sortOrder=asc`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      const users = response.data.data.users;
      for (let i = 1; i < users.length; i++) {
        expect(users[i].name.localeCompare(users[i-1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort users by name descending', async () => {
      const response = await axios.get(`${API_URL}/users?sortBy=name&sortOrder=desc`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      const users = response.data.data.users;
      for (let i = 1; i < users.length; i++) {
        expect(users[i].name.localeCompare(users[i-1].name)).toBeLessThanOrEqual(0);
      }
    });

    it('should filter stores by name', async () => {
      const response = await axios.get(`${API_URL}/stores?name=Test Store For`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.stores.length).toBeGreaterThan(0);
      response.data.data.stores.forEach(store => {
        expect(store.name.toLowerCase()).toContain('test store for');
      });
    });

    it('should filter stores by address', async () => {
      const response = await axios.get(`${API_URL}/stores?address=Shopping`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.stores.length).toBeGreaterThan(0);
      response.data.data.stores.forEach(store => {
        expect(store.address.toLowerCase()).toContain('shopping');
      });
    });

    it('should sort stores by name ascending', async () => {
      const response = await axios.get(`${API_URL}/stores?sortBy=name&sortOrder=asc`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      const stores = response.data.data.stores;
      for (let i = 1; i < stores.length; i++) {
        expect(stores[i].name.localeCompare(stores[i-1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort stores by name descending', async () => {
      const response = await axios.get(`${API_URL}/stores?sortBy=name&sortOrder=desc`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      const stores = response.data.data.stores;
      for (let i = 1; i < stores.length; i++) {
        expect(stores[i].name.localeCompare(stores[i-1].name)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('7. Admin Dashboard Statistics', () => {
    
    it('should allow admin to view dashboard statistics', async () => {
      const response = await axios.get(`${API_URL}/dashboard/admin`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.totalUsers).toBeGreaterThan(0);
      expect(response.data.data.totalStores).toBeGreaterThan(0);
      expect(response.data.data.totalRatings).toBeGreaterThan(0);
    });

    it('should prevent normal user from accessing admin dashboard', async () => {
      try {
        await axios.get(`${API_URL}/dashboard/admin`, {
          headers: { Authorization: `Bearer ${testData.normalUserToken}` }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });
  });
});
