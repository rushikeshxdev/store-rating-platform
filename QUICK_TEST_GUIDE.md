# 🚀 Quick Testing Guide

## Current Database Status
✅ **5 Users** | ✅ **5 Stores** | ⭐ **0 Ratings**

---

## 🔑 Test Accounts

| Role | Email | Password | What to Test |
|------|-------|----------|--------------|
| **Your Account** | rushirandive09@gmail.com | (your password) | Browse stores, submit ratings |
| **Admin** | admin@test.com | Admin@123 | Manage users & stores, view stats |
| **Store Owner** | owner@test.com | Owner@123 | View ratings for owned store |
| **Test User 1** | alice@test.com | User@123 | Submit ratings |
| **Test User 2** | bob@test.com | User@123 | Submit ratings |

---

## 📍 Quick Test Steps

### 1️⃣ **Refresh Your Browser** (You're already logged in!)
   - Go to: `http://localhost:3000/stores`
   - You should now see **5 stores** listed!

### 2️⃣ **Rate Some Stores** (As Current User)
   - Click on any store
   - Submit a rating (1-5 stars)
   - Try rating multiple stores
   - Try modifying a rating you already submitted

### 3️⃣ **Test Admin Features**
   - Logout (top right)
   - Login as: `admin@test.com` / `Admin@123`
   - View Dashboard (see statistics)
   - Go to "Manage Users" - filter, sort, add new user
   - Go to "Manage Stores" - filter, sort, add new store

### 4️⃣ **Test Store Owner Features**
   - Logout
   - Login as: `owner@test.com` / `Owner@123`
   - View your store's ratings
   - See which users rated your store

### 5️⃣ **Test Multiple Users Rating**
   - Login as `alice@test.com` / `User@123`
   - Rate "Tech Electronics Store" with 5 stars
   - Logout, login as `bob@test.com` / `User@123`
   - Rate same store with 3 stars
   - Check average rating = 4.0

---

## 🗄️ Check Database Anytime

```bash
cd server
node check-database.js
```

---

## 🎯 What to Look For

### ✅ Working Features
- [ ] Stores appear on browse page
- [ ] Can submit ratings (1-5)
- [ ] Can modify existing ratings
- [ ] Average rating calculates correctly
- [ ] Search stores by name/address works
- [ ] Admin can create users/stores
- [ ] Owner sees ratings for their store
- [ ] Password change works
- [ ] Logout/login works

### 🔒 Security Features
- [ ] Can't rate same store twice (only modify)
- [ ] Normal users can't access admin pages
- [ ] Store owners only see their own store data
- [ ] Invalid passwords rejected
- [ ] Invalid emails rejected

---

## 🐛 If Something Doesn't Work

1. **Refresh the browser** - Frontend might need to reload
2. **Check both servers are running**:
   - Backend: `http://localhost:5000` 
   - Frontend: `http://localhost:3000`
3. **Check database**: `node check-database.js`
4. **Check browser console** for errors (F12)

---

## 📊 Current Test Data

### Stores Available:
1. **Tech Electronics Store** - Silicon Valley
2. **Book Haven Library Store** - Book City
3. **Fashion Boutique Central** - Fashion District
4. **Gourmet Food Market Place** - Food Town
5. **Sports Equipment Warehouse** - Sports City

### Users Available:
- **1 Admin** (can manage everything)
- **1 Store Owner** (owns Tech Electronics Store)
- **3 Normal Users** (can browse and rate stores)

---

## 🎬 Start Testing NOW!

**Just refresh your browser at `http://localhost:3000/stores`**

You should see all 5 stores! Start rating them! 🌟
