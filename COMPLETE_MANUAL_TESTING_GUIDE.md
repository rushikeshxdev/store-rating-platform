# 🧪 Complete Manual Testing Guide - Store Rating Platform

## 📋 Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Test Accounts](#test-accounts)
3. [Testing Checklist](#testing-checklist)
4. [Detailed Test Cases](#detailed-test-cases)
5. [Validation Rules to Verify](#validation-rules-to-verify)
6. [Common Issues & Solutions](#common-issues--solutions)

---

## 🔧 Pre-Testing Setup

### 1. Clean Database (Fresh Start)
```bash
cd server
npx prisma migrate reset --force
npx prisma generate
node seed-test-data.js
```

### 2. Start Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### 3. Clear Browser Data
1. Open browser (Chrome/Edge recommended)
2. Press `F12` to open DevTools
3. Go to **Application** tab
4. Click **Local Storage** > `http://localhost:3000`
5. Click **"Clear All"**
6. Close DevTools
7. Refresh page (`Ctrl + Shift + R`)

---

## 👥 Test Accounts

| Role | Email | Password | Has Store? |
|------|-------|----------|------------|
| **Admin** | admin@test.com | Admin@123 | No |
| **Store Owner** | owner@test.com | Owner@123 | Yes (Tech Electronics) |
| **Normal User 1** | alice@test.com | User@123 | No |
| **Normal User 2** | bob@test.com | User@123 | No |

### Available Stores:
1. Tech Electronics Store
2. Book Haven Library Store
3. Fashion Boutique Central
4. Gourmet Food Market Place
5. Sports Equipment Warehouse

---

## ✅ Testing Checklist

### Phase 1: Registration & Authentication
- [ ] 1.1 Register new normal user
- [ ] 1.2 Verify email validation
- [ ] 1.3 Verify password validation
- [ ] 1.4 Verify name validation
- [ ] 1.5 Verify address validation
- [ ] 1.6 Login with valid credentials
- [ ] 1.7 Login with invalid credentials
- [ ] 1.8 Logout functionality

### Phase 2: Normal User Features
- [ ] 2.1 View all stores
- [ ] 2.2 Search stores by name
- [ ] 2.3 Search stores by address
- [ ] 2.4 Submit rating for store
- [ ] 2.5 Modify existing rating
- [ ] 2.6 View own submitted rating
- [ ] 2.7 Update password
- [ ] 2.8 Verify cannot submit duplicate rating

### Phase 3: Store Owner Features
- [ ] 3.1 View owner dashboard
- [ ] 3.2 See average rating
- [ ] 3.3 See total ratings count
- [ ] 3.4 View list of users who rated
- [ ] 3.5 Update password
- [ ] 3.6 Verify cannot access admin features

### Phase 4: Admin Features
- [ ] 4.1 View admin dashboard
- [ ] 4.2 See total users count
- [ ] 4.3 See total stores count
- [ ] 4.4 See total ratings count
- [ ] 4.5 Create new normal user
- [ ] 4.6 Create new store owner (with store)
- [ ] 4.7 Create new admin
- [ ] 4.8 Create new store
- [ ] 4.9 View all users
- [ ] 4.10 Filter users by name
- [ ] 4.11 Filter users by email
- [ ] 4.12 Filter users by role
- [ ] 4.13 Sort users by name
- [ ] 4.14 View all stores
- [ ] 4.15 Filter stores by name
- [ ] 4.16 Sort stores by name

### Phase 5: Security & Access Control
- [ ] 5.1 Normal user cannot access admin pages
- [ ] 5.2 Normal user cannot access owner dashboard
- [ ] 5.3 Store owner cannot access admin pages
- [ ] 5.4 Store owner cannot submit ratings
- [ ] 5.5 Admin cannot submit ratings
- [ ] 5.6 Unauthenticated user redirected to login

---

## 📝 Detailed Test Cases

## PHASE 1: REGISTRATION & AUTHENTICATION

### Test 1.1: Register New Normal User ✅

**Steps:**
1. Go to `http://localhost:3000/register`
2. Fill in the form:
   - **Name**: `Test User Manual Testing` (20-60 chars)
   - **Email**: `testuser@manual.com`
   - **Password**: `Test@123` (8-16 chars, uppercase, special)
   - **Address**: `123 Test Street, Test City, TC 12345` (max 400 chars)
3. Click **"Register"**

**Expected Result:**
- ✅ Registration successful
- ✅ Automatically logged in
- ✅ Redirected to `/user/stores` page
- ✅ Can see list of stores
- ✅ User role is NORMAL_USER (check in browser console: `JSON.parse(localStorage.getItem('user'))`)

**Verify in Database:**
```bash
cd server
node check-database.js
```
Should show 6 users now (5 seeded + 1 new)

---

### Test 1.2: Email Validation ❌

**Steps:**
1. Go to `http://localhost:3000/register`
2. Try these invalid emails:
   - `invalidemail` (no @)
   - `test@` (no domain)
   - `@test.com` (no username)
   - `test user@test.com` (space)

**Expected Result:**
- ❌ Error message: "Invalid email format"
- ❌ Form not submitted
- ❌ Error shown in red

---

### Test 1.3: Password Validation ❌

**Steps:**
1. Go to `http://localhost:3000/register`
2. Try these invalid passwords:
   - `short` (< 8 chars)
   - `toolongpassword12345` (> 16 chars)
   - `lowercase123!` (no uppercase)
   - `UPPERCASE123` (no special char)
   - `NoSpecial123` (no special char)

**Expected Result:**
- ❌ Error message for each validation rule
- ❌ Form not submitted
- ❌ Real-time feedback shown

---

### Test 1.4: Name Validation ❌

**Steps:**
1. Go to `http://localhost:3000/register`
2. Try these invalid names:
   - `Short` (< 20 chars)
   - `This is a very long name that exceeds the maximum allowed sixty characters limit` (> 60 chars)

**Expected Result:**
- ❌ Error: "Name must be between 20 and 60 characters"
- ❌ Form not submitted

---

### Test 1.5: Address Validation ❌

**Steps:**
1. Go to `http://localhost:3000/register`
2. Try address > 400 characters:
   ```
   This is a very long address that should exceed the maximum allowed four hundred characters limit. I will keep typing to make sure this address is long enough to trigger the validation error. This address needs to be really really long to test the validation properly. Let me add more text here to make absolutely sure we exceed the four hundred character limit for this address field validation test case.
   ```

**Expected Result:**
- ❌ Error: "Address must not exceed 400 characters"
- ❌ Form not submitted

---

### Test 1.6: Login with Valid Credentials ✅

**Steps:**
1. Logout if logged in
2. Go to `http://localhost:3000/login`
3. Enter:
   - **Email**: `alice@test.com`
   - **Password**: `User@123`
4. Click **"Login"**

**Expected Result:**
- ✅ Login successful
- ✅ Redirected to `/user/stores`
- ✅ Can see user name in top right
- ✅ Token stored in localStorage

---

### Test 1.7: Login with Invalid Credentials ❌

**Steps:**
1. Go to `http://localhost:3000/login`
2. Try:
   - **Email**: `alice@test.com`
   - **Password**: `WrongPassword123!`
3. Click **"Login"**

**Expected Result:**
- ❌ Error: "Invalid email or password"
- ❌ Not logged in
- ❌ Stays on login page

---

### Test 1.8: Logout Functionality ✅

**Steps:**
1. Login as any user
2. Click **"Logout"** button (top right)

**Expected Result:**
- ✅ Logged out successfully
- ✅ Redirected to `/login` page
- ✅ Token removed from localStorage
- ✅ Cannot access protected pages

---

## PHASE 2: NORMAL USER FEATURES

### Test 2.1: View All Stores ✅

**Steps:**
1. Login as `alice@test.com` / `User@123`
2. Should be on `/user/stores` page

**Expected Result:**
- ✅ See 5 stores listed
- ✅ Each store shows:
  - Store name
  - Address
  - Average rating (or "No ratings yet")
  - Your rating (if submitted)
  - "Submit Rating" or "Modify Rating" button

---

### Test 2.2: Search Stores by Name ✅

**Steps:**
1. On `/user/stores` page
2. In search box, type: `Tech`
3. Press Enter or click Search

**Expected Result:**
- ✅ Only "Tech Electronics Store" shown
- ✅ Other stores hidden
- ✅ Search is case-insensitive

**Try more searches:**
- `book` → Shows "Book Haven Library Store"
- `fashion` → Shows "Fashion Boutique Central"
- `xyz` → Shows "No stores found"

---

### Test 2.3: Search Stores by Address ✅

**Steps:**
1. On `/user/stores` page
2. In search box, type: `Silicon Valley`
3. Press Enter

**Expected Result:**
- ✅ Shows "Tech Electronics Store"
- ✅ Search works on address field

---

### Test 2.4: Submit Rating for Store ✅

**Steps:**
1. Login as `alice@test.com`
2. Go to `/user/stores`
3. Find "Tech Electronics Store"
4. Click **"Submit Rating"** button
5. Select **4 stars**
6. Click **"Submit"**

**Expected Result:**
- ✅ Success message: "Rating submitted successfully"
- ✅ Button changes to "Modify Rating"
- ✅ Your rating shows: "Your Rating: 4"
- ✅ Average rating updates to "4.0"

**Verify in Database:**
```bash
cd server
node check-database.js
```
Should show 1 rating now

---

### Test 2.5: Modify Existing Rating ✅

**Steps:**
1. After submitting rating (Test 2.4)
2. Click **"Modify Rating"** button
3. Change to **5 stars**
4. Click **"Update"**

**Expected Result:**
- ✅ Success message: "Rating updated successfully"
- ✅ Your rating shows: "Your Rating: 5"
- ✅ Average rating updates to "5.0"
- ✅ Still only 1 rating in database (updated, not duplicated)

---

### Test 2.6: View Own Submitted Rating ✅

**Steps:**
1. After submitting rating
2. Logout and login again
3. Go to `/user/stores`

**Expected Result:**
- ✅ Your rating still shows: "Your Rating: 5"
- ✅ Button shows "Modify Rating"
- ✅ Rating persists across sessions

---

### Test 2.7: Update Password ✅

**Steps:**
1. Login as `alice@test.com`
2. Click **"Change Password"** link (in navigation or profile)
3. Enter:
   - **New Password**: `NewPass@123`
   - **Confirm Password**: `NewPass@123`
4. Click **"Update Password"**

**Expected Result:**
- ✅ Success message: "Password updated successfully"
- ✅ Redirected to dashboard
- ✅ Can logout and login with new password

**Test Same Password Validation:**
1. Try to update password to current password
2. Should see error: "New password cannot be the same as your current password"

---

### Test 2.8: Cannot Submit Duplicate Rating ❌

**Steps:**
1. Login as `alice@test.com`
2. Submit rating for "Tech Electronics Store"
3. Try to submit another rating for same store

**Expected Result:**
- ❌ Should only see "Modify Rating" button
- ❌ Cannot submit duplicate rating
- ❌ Database constraint prevents duplicates

---

## PHASE 3: STORE OWNER FEATURES

### Test 3.1: View Owner Dashboard ✅

**Steps:**
1. **IMPORTANT**: Logout completely
2. Clear browser localStorage (F12 > Application > Local Storage > Clear All)
3. Login as `owner@test.com` / `Owner@123`
4. Should be redirected to `/owner/dashboard`

**Expected Result:**
- ✅ See "Store Owner Dashboard" title
- ✅ See "Average Rating" card
- ✅ See "Total Ratings" card
- ✅ See "Customer Ratings" table
- ✅ No errors in console

**If you see "Store owner has no associated store" error:**
- Logout completely
- Clear localStorage
- Login again
- If still fails, run: `cd server && node fix-owner-store.js`

---

### Test 3.2: See Average Rating ✅

**Steps:**
1. On owner dashboard
2. Look at "Average Rating" card

**Expected Result:**
- If no ratings: Shows "No ratings yet"
- If ratings exist: Shows average (e.g., "4.50 / 5")

**To test with ratings:**
1. Logout
2. Login as `alice@test.com`
3. Submit rating (5 stars) for "Tech Electronics Store"
4. Logout
5. Login as `owner@test.com`
6. Should see "Average Rating: 5.00"

---

### Test 3.3: See Total Ratings Count ✅

**Steps:**
1. On owner dashboard
2. Look at "Total Ratings" card

**Expected Result:**
- Shows correct count (e.g., "1" if one rating submitted)
- Updates when new ratings added

---

### Test 3.4: View List of Users Who Rated ✅

**Steps:**
1. Have at least one rating submitted (see Test 3.2)
2. On owner dashboard
3. Scroll to "Customer Ratings" table

**Expected Result:**
- ✅ Table shows:
  - User Name
  - Email
  - Rating (stars)
  - Date
- ✅ Most recent ratings first
- ✅ All users who rated are listed

---

### Test 3.5: Update Password ✅

**Steps:**
1. Login as `owner@test.com`
2. Click **"Change Password"**
3. Update password

**Expected Result:**
- ✅ Same as Test 2.7
- ✅ Password updates successfully

---

### Test 3.6: Cannot Access Admin Features ❌

**Steps:**
1. Login as `owner@test.com`
2. Try to access:
   - `http://localhost:3000/admin/dashboard`
   - `http://localhost:3000/admin/users`
   - `http://localhost:3000/admin/stores`

**Expected Result:**
- ❌ Redirected to `/owner/dashboard`
- ❌ Cannot access admin pages
- ❌ 403 Forbidden error

---

## PHASE 4: ADMIN FEATURES

### Test 4.1: View Admin Dashboard ✅

**Steps:**
1. Logout
2. Login as `admin@test.com` / `Admin@123`
3. Should be redirected to `/admin/dashboard`

**Expected Result:**
- ✅ See "Admin Dashboard" title
- ✅ See three cards:
  - Total Users: 5 (or more if you registered new users)
  - Total Stores: 5
  - Total Ratings: (count of all ratings)
- ✅ See links to "User Management" and "Store Management"

---

### Test 4.2-4.4: Dashboard Statistics ✅

**Verify counts match database:**
```bash
cd server
node check-database.js
```

**Expected Result:**
- ✅ Total Users matches database count
- ✅ Total Stores matches database count
- ✅ Total Ratings matches database count

---

### Test 4.5: Create New Normal User ✅

**Steps:**
1. Login as admin
2. Go to `/admin/users`
3. Click **"Add User"** button
4. Fill form:
   - **Name**: `Admin Created Normal User Test`
   - **Email**: `normaluser@admin.com`
   - **Password**: `Normal@123`
   - **Address**: `456 Admin Created Street, Test City, TC 54321`
   - **Role**: Select **"Normal User"**
5. Click **"Create User"**

**Expected Result:**
- ✅ Success message
- ✅ User appears in list
- ✅ Can login with these credentials
- ✅ User has NORMAL_USER role

---

### Test 4.6: Create New Store Owner ✅

**Steps:**
1. Login as admin
2. Go to `/admin/users`
3. Click **"Add User"**
4. Fill form:
   - **Name**: `Admin Created Store Owner Test`
   - **Email**: `storeowner@admin.com`
   - **Password**: `Owner@123`
   - **Address**: `789 Owner Street, Test City, TC 78901`
   - **Role**: Select **"Store Owner"**
   - **Store**: Select **"Book Haven Library Store"**
5. Click **"Create User"**

**Expected Result:**
- ✅ Success message
- ✅ User appears in list
- ✅ Can login as store owner
- ✅ Owner dashboard shows "Book Haven" ratings

---

### Test 4.7: Create New Admin ✅

**Steps:**
1. Login as admin
2. Go to `/admin/users`
3. Click **"Add User"**
4. Fill form:
   - **Name**: `Admin Created System Admin Test`
   - **Email**: `newadmin@admin.com`
   - **Password**: `Admin@123`
   - **Address**: `321 Admin Street, Test City, TC 32109`
   - **Role**: Select **"System Admin"**
5. Click **"Create User"**

**Expected Result:**
- ✅ Success message
- ✅ Can login as admin
- ✅ Has full admin access

---

### Test 4.8: Create New Store ✅

**Steps:**
1. Login as admin
2. Go to `/admin/stores`
3. Click **"Add Store"** button
4. Fill form:
   - **Name**: `Admin Created Test Store Name`
   - **Email**: `teststore@admin.com`
   - **Address**: `999 Store Avenue, Store City, SC 99999`
5. Click **"Create Store"**

**Expected Result:**
- ✅ Success message
- ✅ Store appears in list
- ✅ Normal users can see and rate this store
- ✅ Can assign store owner to this store

---

### Test 4.9: View All Users ✅

**Steps:**
1. Login as admin
2. Go to `/admin/users`

**Expected Result:**
- ✅ See list of all users
- ✅ Each user shows:
  - Name
  - Email
  - Address
  - Role
  - Store (if store owner)

---

### Test 4.10: Filter Users by Name ✅

**Steps:**
1. On `/admin/users` page
2. In "Filter by Name" field, type: `Alice`
3. Click **"Apply Filters"**

**Expected Result:**
- ✅ Only shows users with "Alice" in name
- ✅ Other users hidden

---

### Test 4.11: Filter Users by Email ✅

**Steps:**
1. On `/admin/users` page
2. In "Filter by Email" field, type: `test.com`
3. Click **"Apply Filters"**

**Expected Result:**
- ✅ Shows all users with "@test.com" email
- ✅ Partial match works

---

### Test 4.12: Filter Users by Role ✅

**Steps:**
1. On `/admin/users` page
2. In "Filter by Role" dropdown, select: **"Normal User"**
3. Click **"Apply Filters"**

**Expected Result:**
- ✅ Only shows NORMAL_USER users
- ✅ Admins and owners hidden

**Try other roles:**
- Store Owner → Shows only owners
- System Admin → Shows only admins

---

### Test 4.13: Sort Users by Name ✅

**Steps:**
1. On `/admin/users` page
2. In "Sort by" dropdown, select: **"Name"**
3. In "Order" dropdown, select: **"Ascending"**
4. Click **"Apply Filters"**

**Expected Result:**
- ✅ Users sorted alphabetically (A-Z)

**Try descending:**
- ✅ Users sorted reverse alphabetically (Z-A)

---

### Test 4.14: View All Stores ✅

**Steps:**
1. Login as admin
2. Go to `/admin/stores`

**Expected Result:**
- ✅ See list of all stores
- ✅ Each store shows:
  - Name
  - Email
  - Address
  - Average Rating

---

### Test 4.15: Filter Stores by Name ✅

**Steps:**
1. On `/admin/stores` page
2. In "Filter by Name" field, type: `Tech`
3. Click **"Apply Filters"**

**Expected Result:**
- ✅ Only shows "Tech Electronics Store"

---

### Test 4.16: Sort Stores by Name ✅

**Steps:**
1. On `/admin/stores` page
2. In "Sort by" dropdown, select: **"Name"**
3. Select order (Ascending/Descending)
4. Click **"Apply Filters"**

**Expected Result:**
- ✅ Stores sorted alphabetically

---

## PHASE 5: SECURITY & ACCESS CONTROL

### Test 5.1: Normal User Cannot Access Admin Pages ❌

**Steps:**
1. Login as `alice@test.com`
2. Try to access:
   - `http://localhost:3000/admin/dashboard`
   - `http://localhost:3000/admin/users`
   - `http://localhost:3000/admin/stores`

**Expected Result:**
- ❌ Redirected to `/user/stores`
- ❌ Cannot see admin pages
- ❌ 403 Forbidden

---

### Test 5.2: Normal User Cannot Access Owner Dashboard ❌

**Steps:**
1. Login as `alice@test.com`
2. Try to access: `http://localhost:3000/owner/dashboard`

**Expected Result:**
- ❌ Redirected to `/user/stores`
- ❌ Cannot see owner dashboard

---

### Test 5.3: Store Owner Cannot Access Admin Pages ❌

**Steps:**
1. Login as `owner@test.com`
2. Try to access admin pages

**Expected Result:**
- ❌ Redirected to `/owner/dashboard`
- ❌ Cannot access admin features

---

### Test 5.4: Store Owner Cannot Submit Ratings ❌

**Steps:**
1. Login as `owner@test.com`
2. Try to access: `http://localhost:3000/user/stores`

**Expected Result:**
- ❌ Redirected to `/owner/dashboard`
- ❌ Cannot see stores page
- ❌ Cannot submit ratings

---

### Test 5.5: Admin Cannot Submit Ratings ❌

**Steps:**
1. Login as `admin@test.com`
2. Try to access: `http://localhost:3000/user/stores`

**Expected Result:**
- ❌ Redirected to `/admin/dashboard`
- ❌ Cannot submit ratings

---

### Test 5.6: Unauthenticated User Redirected ❌

**Steps:**
1. Logout completely
2. Try to access:
   - `http://localhost:3000/user/stores`
   - `http://localhost:3000/admin/dashboard`
   - `http://localhost:3000/owner/dashboard`

**Expected Result:**
- ❌ Redirected to `/login`
- ❌ Must login first

---

## 📏 Validation Rules to Verify

### Name Validation
- ✅ Minimum 20 characters
- ✅ Maximum 60 characters
- ❌ Less than 20 → Error
- ❌ More than 60 → Error

### Email Validation
- ✅ Valid format: `user@domain.com`
- ❌ No @ symbol → Error
- ❌ No domain → Error
- ❌ Spaces → Error
- ✅ Unique (no duplicates)

### Password Validation
- ✅ Minimum 8 characters
- ✅ Maximum 16 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 special character
- ❌ Less than 8 → Error
- ❌ More than 16 → Error
- ❌ No uppercase → Error
- ❌ No special char → Error
- ❌ Same as current password → Error

### Address Validation
- ✅ Maximum 400 characters
- ❌ More than 400 → Error

### Rating Validation
- ✅ Integer between 1-5
- ❌ Less than 1 → Error
- ❌ More than 5 → Error
- ✅ One rating per user per store
- ❌ Duplicate rating → Error

---

## 🐛 Common Issues & Solutions

### Issue 1: "Store owner has no associated store"

**Solution:**
1. Logout completely
2. Clear localStorage (F12 > Application > Local Storage > Clear All)
3. Login again
4. If still fails: `cd server && node fix-owner-store.js`

### Issue 2: Dashboard shows "No data available"

**Solution:**
1. Check if backend is running (`http://localhost:5000`)
2. Check browser console for errors
3. Verify database has data: `cd server && node check-database.js`
4. Logout and login again

### Issue 3: Cannot submit rating

**Solution:**
1. Verify you're logged in as NORMAL_USER
2. Admins and owners cannot submit ratings
3. Check if you already rated this store (can only modify)

### Issue 4: Registration creates wrong role

**Solution:**
- Public registration ALWAYS creates NORMAL_USER
- Only admins can create other roles
- This is by design per requirements

### Issue 5: Filters not working

**Solution:**
1. Click "Apply Filters" button after entering filter values
2. Clear filters to see all results
3. Refresh page if needed

---

## ✅ Final Verification Checklist

After completing all tests, verify:

- [ ] All 5 phases completed
- [ ] All validation rules tested
- [ ] All user roles tested
- [ ] All security checks passed
- [ ] No console errors
- [ ] Database data is correct
- [ ] All features match requirements document
- [ ] Application is stable and responsive

---

## 📊 Test Results Summary

| Category | Total Tests | Passed | Failed | Notes |
|----------|-------------|--------|--------|-------|
| Registration & Auth | 8 | | | |
| Normal User | 8 | | | |
| Store Owner | 6 | | | |
| Admin | 16 | | | |
| Security | 6 | | | |
| **TOTAL** | **44** | | | |

---

## 🎯 Requirements Verification

Compare your test results with the original requirements document:

✅ **User Roles**: 3 roles implemented correctly
✅ **Registration**: Normal users can register
✅ **Login**: Single login system for all roles
✅ **Admin Features**: All admin functionalities working
✅ **Normal User Features**: All user functionalities working
✅ **Store Owner Features**: Dashboard and ratings view working
✅ **Validations**: All form validations working
✅ **Sorting**: Tables support sorting
✅ **Filtering**: Search and filter working

---

## 📝 Notes

- Test in order (Phase 1 → Phase 5)
- Use fresh database for consistent results
- Clear browser cache between major test phases
- Document any bugs or issues found
- Take screenshots of errors for debugging

---

**Happy Testing! 🚀**
