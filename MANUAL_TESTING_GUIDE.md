# 📖 Manual Testing Guide - Store Rating Platform

## 🚀 Quick Start

### 1. Check Database
```bash
cd server
node check-database.js
```

### 2. Seed Test Data (Optional)
```bash
node seed-test-data.js
```

### 3. Start Both Servers
**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

---

## 🧪 Complete Testing Workflow

### **Phase 1: Admin Testing**

#### 1.1 Login as Admin
1. Go to `http://localhost:3000/login`
2. Use credentials: `admin@test.com` / `Admin@123`
3. Should redirect to Admin Dashboard

#### 1.2 View Admin Dashboard
- Check total users count
- Check total stores count
- Check total ratings count
- Verify statistics are accurate

#### 1.3 Manage Users
1. Click "Manage Users" or navigate to `/admin/users`
2. **Test Filtering:**
   - Filter by name
   - Filter by email
   - Filter by role (SYSTEM_ADMIN, NORMAL_USER, STORE_OWNER)
3. **Test Sorting:**
   - Sort by name (ascending/descending)
   - Sort by email (ascending/descending)
4. **Create New User:**
   - Click "Add User"
   - Fill form with valid data
   - Try creating users with different roles
   - Test validation errors (invalid email, short password, etc.)

#### 1.4 Manage Stores
1. Navigate to `/admin/stores`
2. **Test Filtering:**
   - Filter by store name
   - Filter by email
   - Filter by address
3. **Test Sorting:**
   - Sort by name
   - Sort by email
4. **Create New Store:**
   - Click "Add Store"
   - Fill form: name (20-60 chars), email, address (max 400 chars)
   - Test validation errors

---

### **Phase 2: Normal User Testing**

#### 2.1 Register New User
1. Logout from admin
2. Go to `/register`
3. Fill registration form:
   - Name: 20-60 characters
   - Email: valid format
   - Password: 8-16 chars, 1 uppercase, 1 special char
   - Address: max 400 characters
4. Test validation errors
5. Register successfully

#### 2.2 Login as Normal User
1. Go to `/login`
2. Login with registered credentials
3. Should redirect to `/stores`

#### 2.3 Browse Stores
1. View all stores
2. **Test Search:**
   - Search by store name
   - Search by address
3. **Test Sorting:**
   - Sort by name
   - Sort by rating
4. View store details

#### 2.4 Submit Ratings
1. Select a store you haven't rated
2. Submit a rating (1-5)
3. Verify rating appears
4. Check average rating updates

#### 2.5 Modify Ratings
1. Find a store you've already rated
2. Change your rating
3. Verify rating updates
4. Check average rating recalculates

#### 2.6 Update Password
1. Navigate to "Change Password"
2. Enter new password (must meet requirements)
3. Logout and login with new password
4. Verify old password doesn't work

---

### **Phase 3: Store Owner Testing**

#### 3.1 Login as Store Owner
1. Use credentials: `owner@test.com` / `Owner@123`
2. Should redirect to Owner Dashboard

#### 3.2 View Owner Dashboard
1. Check average rating display
2. Check total ratings count
3. View list of users who rated your store
4. Verify user details (name, email, rating, date)

#### 3.3 Test Access Control
1. Try accessing admin routes (should be blocked)
2. Try accessing other stores' ratings (should be blocked)

---

## 🗄️ Database Inspection

### Check Database Contents
```bash
cd server
node check-database.js
```

This will show:
- Total counts of users, stores, ratings
- List of all users with roles
- List of all stores
- List of all ratings with details

### Direct Database Access (PostgreSQL)
```bash
# Connect to PostgreSQL
psql -U postgres -d store_rating_db

# Useful queries:
SELECT * FROM "User";
SELECT * FROM "Store";
SELECT * FROM "Rating";

# Check ratings with user and store names:
SELECT r.id, u.name as user_name, s.name as store_name, r.value 
FROM "Rating" r 
JOIN "User" u ON r."userId" = u.id 
JOIN "Store" s ON r."storeId" = s.id;

# Calculate average rating for a store:
SELECT s.name, AVG(r.value) as avg_rating, COUNT(r.id) as total_ratings
FROM "Store" s
LEFT JOIN "Rating" r ON s.id = r."storeId"
GROUP BY s.id, s.name;
```

---

## ✅ Testing Checklist

### Authentication & Authorization
- [ ] Register new normal user
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout works correctly
- [ ] Protected routes redirect to login
- [ ] Role-based access control works (admin, user, owner)

### User Management (Admin)
- [ ] View all users
- [ ] Filter users by name, email, role
- [ ] Sort users by different fields
- [ ] Create new user with each role
- [ ] Validation errors display correctly

### Store Management (Admin)
- [ ] View all stores
- [ ] Filter stores by name, email, address
- [ ] Sort stores by different fields
- [ ] Create new store
- [ ] Validation errors display correctly

### Store Browsing (Normal User)
- [ ] View all stores
- [ ] Search stores by name
- [ ] Search stores by address
- [ ] Sort stores
- [ ] View store details with average rating

### Rating System (Normal User)
- [ ] Submit rating for store (1-5)
- [ ] Cannot submit duplicate rating
- [ ] Modify existing rating
- [ ] Average rating updates correctly
- [ ] User's rating displays on store view

### Owner Dashboard
- [ ] View average rating
- [ ] View total ratings count
- [ ] View list of users who rated
- [ ] Cannot access other stores' data

### Password Management
- [ ] Update password with valid new password
- [ ] Validation errors for invalid password
- [ ] Can login with new password
- [ ] Cannot login with old password

### Data Validation
- [ ] Name: 20-60 characters enforced
- [ ] Email: valid format enforced
- [ ] Password: 8-16 chars, uppercase, special char enforced
- [ ] Address: max 400 characters enforced
- [ ] Rating: 1-5 integer enforced

### Error Handling
- [ ] User-friendly error messages display
- [ ] Network errors handled gracefully
- [ ] Validation errors show specific messages
- [ ] Authentication errors handled
- [ ] Authorization errors handled

---

## 🐛 Common Issues & Solutions

### Issue: "No stores found"
**Solution:** Login as admin and create stores, or run `node seed-test-data.js`

### Issue: Cannot login
**Solution:** 
1. Check database has users: `node check-database.js`
2. Verify password meets requirements
3. Check server is running on port 5000

### Issue: Database connection error
**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in server/.env
3. Run migrations: `cd server && npx prisma migrate dev`

### Issue: Frontend not connecting to backend
**Solution:**
1. Check server is running on port 5000
2. Verify REACT_APP_API_URL in client/.env
3. Check CORS settings in server

---

## 📊 Test Data Accounts

After running `seed-test-data.js`:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@test.com | Admin@123 | Test admin features |
| Owner | owner@test.com | Owner@123 | Test owner dashboard |
| User | alice@test.com | User@123 | Test normal user features |
| User | bob@test.com | User@123 | Test multiple users rating |

---

## 🎯 Advanced Testing Scenarios

### Scenario 1: Multiple Users Rating Same Store
1. Login as alice@test.com, rate a store
2. Logout, login as bob@test.com, rate same store
3. Check average rating calculation
4. Login as owner, verify both ratings appear

### Scenario 2: Rating Modification Impact
1. Login as normal user
2. Rate a store with 5
3. Check average rating
4. Modify rating to 1
5. Verify average rating recalculates correctly

### Scenario 3: Access Control
1. Login as normal user
2. Try accessing `/admin/users` (should redirect/block)
3. Try accessing `/admin/stores` (should redirect/block)
4. Try accessing `/dashboard/owner` (should redirect/block)

### Scenario 4: Search and Filter Combinations
1. Login as admin
2. Go to users page
3. Apply multiple filters simultaneously
4. Apply sorting with filters
5. Verify results are correct

---

## 📝 Notes

- All passwords must be 8-16 characters with at least one uppercase letter and one special character
- Names must be 20-60 characters
- Addresses must be max 400 characters
- Ratings must be integers between 1 and 5
- Each user can only rate a store once (but can modify their rating)
- Store owners can only view ratings for their own store
- System admins can create users with any role
