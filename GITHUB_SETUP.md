# GitHub Setup Guide

This guide will help you push your Store Rating Platform to GitHub safely and securely.

## 🔒 Security Checklist (CRITICAL!)

Before pushing to GitHub, ensure:

- ✅ `.env` files are in `.gitignore` (NEVER commit these!)
- ✅ `.env.example` files are included (safe to commit)
- ✅ Database passwords are NOT in any committed files
- ✅ JWT secrets are NOT in any committed files
- ✅ `node_modules/` folders are ignored
- ✅ Personal information is removed from code

## 📋 Pre-Push Checklist

### 1. Verify Sensitive Files Are Ignored

Run this command to check what will be committed:

```bash
git status
```

**MUST NOT appear in the list:**
- `server/.env` (contains database password and JWT secret)
- `client/.env`
- `node_modules/` folders
- Any files with passwords or secrets

**SHOULD appear in the list:**
- `server/.env.example` ✅
- `client/.env.example` ✅
- All source code files
- `README.md`
- `package.json` files

### 2. Clean Up Sensitive Data

Check your `.env` files are properly ignored:

```bash
# This should show .env files are ignored
git check-ignore server/.env client/.env
```

If they're NOT ignored, add them to `.gitignore` immediately!

## 🚀 Step-by-Step GitHub Push

### Step 1: Initialize Git Repository (if not already done)

```bash
# Navigate to project root
cd store-rating-platform

# Initialize git (skip if already initialized)
git init
```

### Step 2: Verify .gitignore Is Working

```bash
# Check what files will be tracked
git status

# Verify .env files are NOT listed
# If they appear, STOP and fix .gitignore first!
```

### Step 3: Stage Files for Commit

```bash
# Add all files (gitignore will exclude sensitive ones)
git add .

# Verify what's staged
git status
```

### Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: Store Rating Platform

- Full-stack application with React frontend and Express backend
- PostgreSQL database with Prisma ORM
- JWT authentication with role-based access control
- Three user roles: System Admin, Store Owner, Normal User
- Complete CRUD operations for users, stores, and ratings
- Comprehensive test suite with 277 passing tests
- Property-based testing for core functionality"
```

### Step 5: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click "New Repository" (+ icon in top right)
3. Fill in details:
   - **Repository name**: `store-rating-platform`
   - **Description**: "Full-stack store rating platform with React, Express, PostgreSQL, and JWT authentication"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (we already have one)
4. Click "Create repository"

### Step 6: Connect Local Repository to GitHub

GitHub will show you commands. Use these:

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/store-rating-platform.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 7: Verify Push Was Successful

1. Refresh your GitHub repository page
2. **CRITICAL CHECKS:**
   - ✅ `server/.env.example` should be visible
   - ✅ `client/.env.example` should be visible
   - ❌ `server/.env` should NOT be visible
   - ❌ `client/.env` should NOT be visible
   - ❌ `node_modules/` should NOT be visible

## 📝 What Gets Pushed to GitHub

### ✅ Files That WILL Be Pushed (Safe)

**Root Files:**
- `README.md` - Project documentation
- `package.json` files - Dependencies (no secrets)
- `.gitignore` - Git ignore rules
- `COMPLETE_MANUAL_TESTING_GUIDE.md` - Testing guide
- `QUICK_TEST_REFERENCE.md` - Quick test guide
- `REQUIREMENTS_COMPLIANCE_CHECK.md` - Requirements verification
- `GITHUB_SETUP.md` - This file

**Server Files:**
- `server/src/**` - All source code
- `server/prisma/**` - Database schema
- `server/.env.example` - Example environment variables (SAFE)
- `server/package.json` - Dependencies
- `server/jest.config.js` - Test configuration
- `server/seed-test-data.js` - Test data seeding script

**Client Files:**
- `client/src/**` - All React source code
- `client/public/**` - Public assets
- `client/.env.example` - Example environment variables (SAFE)
- `client/package.json` - Dependencies
- `client/tailwind.config.js` - Tailwind configuration
- `client/postcss.config.js` - PostCSS configuration

### ❌ Files That Will NOT Be Pushed (Sensitive/Unnecessary)

**Sensitive Files (NEVER PUSH THESE!):**
- `server/.env` - Contains database password and JWT secret
- `client/.env` - Contains API URL configuration
- Any file with passwords, secrets, or tokens

**Development Files:**
- `node_modules/` - Dependencies (too large, can be reinstalled)
- `client/build/` - Build output (can be regenerated)
- `.kiro/` - Kiro development specs
- `*.log` - Log files
- `.vscode/` - IDE settings
- `.DS_Store` - Mac OS files

**Temporary Scripts:**
- `server/check-database.js` - Database inspection script
- `server/fix-*.js` - One-time fix scripts
- `server/test-*.js` - Manual test scripts
- `server/delete-sumit-account.js` - One-time cleanup script

## 🔐 Security Best Practices

### 1. Never Commit Secrets

**NEVER commit:**
- Database passwords
- JWT secrets
- API keys
- Private keys
- User credentials

### 2. Use Environment Variables

All sensitive data should be in `.env` files:

```env
# ❌ WRONG - Hardcoded in source code
const password = "Rushi@1212";

# ✅ CORRECT - Use environment variable
const password = process.env.DB_PASSWORD;
```

### 3. Always Use .env.example

Provide example files without real secrets:

```env
# server/.env.example
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-secret-key-here-change-in-production"
```

### 4. Review Before Pushing

Always run `git status` and `git diff` before pushing to verify no secrets are included.

## 🛠️ Setting Up on Another Machine

When someone clones your repository:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/store-rating-platform.git
cd store-rating-platform

# Install server dependencies
cd server
npm install

# Create .env file from example
cp .env.example .env
# Edit .env with actual values

# Set up database
npx prisma migrate dev
npx prisma generate
node seed-test-data.js

# Install client dependencies
cd ../client
npm install

# Create .env file from example
cp .env.example .env
# Edit .env if needed

# Start development
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm start
```

## 📚 Additional Files to Consider Adding

### 1. LICENSE

Add a license file (MIT, Apache, etc.) to specify how others can use your code.

### 2. CONTRIBUTING.md

If you want others to contribute, add contribution guidelines.

### 3. .github/workflows/

Add GitHub Actions for CI/CD (automated testing, deployment).

## ⚠️ Common Mistakes to Avoid

1. **Committing .env files** - Always double-check!
2. **Pushing node_modules/** - Wastes space, use .gitignore
3. **Hardcoding secrets** - Use environment variables
4. **Forgetting .env.example** - Others won't know what variables are needed
5. **Not testing after clone** - Always verify setup works on fresh clone

## 🆘 Emergency: Accidentally Pushed Secrets

If you accidentally pushed sensitive data:

1. **Immediately change all passwords and secrets**
2. **Remove from Git history:**

```bash
# Remove file from Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history!)
git push origin --force --all
```

3. **Rotate all compromised credentials**
4. **Consider making repository private**

## ✅ Final Verification

After pushing, verify on GitHub:

1. ✅ README.md displays correctly
2. ✅ .env.example files are present
3. ❌ .env files are NOT present
4. ❌ node_modules/ is NOT present
5. ✅ All source code is present
6. ✅ Test files are present
7. ✅ Documentation is present

## 🎉 Success!

Your code is now safely on GitHub! Share the repository URL with others, and they can set it up using the instructions in README.md.

**Repository URL Format:**
```
https://github.com/YOUR_USERNAME/store-rating-platform
```

---

**Need Help?**
- GitHub Docs: https://docs.github.com
- Git Docs: https://git-scm.com/doc
- Contact: Check README.md for contact information
