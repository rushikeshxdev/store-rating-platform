# 🚀 Quick Test Reference Card

## 🔄 Fresh Start Commands
```bash
# Clean database
cd server
npx prisma migrate reset --force
node seed-test-data.js

# Start servers
cd server && npm run dev  # Terminal 1
cd client && npm start    # Terminal 2
```

## 👥 Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | Admin@123 |
| Owner | owner@test.com | Owner@123 |
| User | alice@test.com | User@123 |

## 📋 Quick Test Sequence

### 1. Registration (5 min)
- Register new user: `testuser@manual.com` / `Test@123`
- Name: `Test User Manual Testing` (20-60 chars)
- Test invalid inputs (email, password, name, address)

### 2. Normal User (10 min)
- Login as `alice@test.com`
- View stores
- Search: `Tech`
- Submit rating: 5 stars for "Tech Electronics"
- Modify rating: Change to 4 stars
- Update password

### 3. Store Owner (5 min)
- **LOGOUT FIRST!**
- **Clear localStorage** (F12 > Application > Clear All)
- Login as `owner@test.com`
- View dashboard
- Check average rating
- Check ratings list

### 4. Admin (10 min)
- Login as `admin@test.com`
- View dashboard (check counts)
- Create new user (all 3 roles)
- Create new store
- Filter users by role
- Sort users by name

### 5. Security (5 min)
- Login as normal user
- Try accessing `/admin/dashboard` → Should redirect
- Try accessing `/owner/dashboard` → Should redirect
- Logout and try accessing protected pages → Should redirect to login

## ⚠️ Common Issues

### "Store owner has no associated store"
```bash
# Solution 1: Logout and login again
# Solution 2: Clear localStorage
# Solution 3: Run fix script
cd server && node fix-owner-store.js
```

### Dashboard shows errors
```bash
# Check database
cd server && node check-database.js

# Verify servers running
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

## ✅ Validation Rules Quick Check

| Field | Rule | Test |
|-------|------|------|
| Name | 20-60 chars | Try `Short` (fail), `Valid Name For Testing User` (pass) |
| Email | Valid format | Try `invalid` (fail), `test@test.com` (pass) |
| Password | 8-16, uppercase, special | Try `short` (fail), `Test@123` (pass) |
| Address | Max 400 chars | Try very long text (fail) |
| Rating | 1-5 integer | Try 0 (fail), 3 (pass), 6 (fail) |

## 🎯 Must Test Features

- [ ] Register new user
- [ ] Login/Logout
- [ ] Submit rating
- [ ] Modify rating
- [ ] Admin create user (all roles)
- [ ] Admin create store
- [ ] Filter and sort
- [ ] Password update
- [ ] Access control (try accessing wrong pages)
- [ ] Search stores

## 📊 Expected Database Counts (After Seed)
- Users: 5
- Stores: 5
- Ratings: 0

## 🔍 Debug Commands
```bash
# Check database
cd server && node check-database.js

# Check owner-store link
cd server && node check-owner-store.js

# Fix owner-store link
cd server && node fix-owner-store.js

# Check current user in browser console
JSON.parse(localStorage.getItem('user'))
```

## 🌐 URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Login: http://localhost:3000/login
- Register: http://localhost:3000/register
- Admin: http://localhost:3000/admin/dashboard
- Owner: http://localhost:3000/owner/dashboard
- User: http://localhost:3000/user/stores

## ⏱️ Total Test Time: ~35 minutes

---

**For detailed test cases, see: COMPLETE_MANUAL_TESTING_GUIDE.md**
