# 🔍 Pre-Push Security Checklist

**CRITICAL: Complete this checklist BEFORE pushing to GitHub!**

## ✅ Step 1: Verify .gitignore Is Working

Run these commands and verify the output:

```bash
# Check git status
git status
```

**Expected Result:**
- ❌ `server/.env` should NOT appear
- ❌ `client/.env` should NOT appear
- ❌ `node_modules/` should NOT appear
- ✅ `server/.env.example` SHOULD appear
- ✅ `client/.env.example` SHOULD appear

---

## ✅ Step 2: Verify .env Files Are Ignored

```bash
# This should confirm .env files are ignored
git check-ignore server/.env client/.env
```

**Expected Output:**
```
server/.env
client/.env
```

If you see this output, ✅ GOOD! The files are ignored.

---

## ✅ Step 3: Check for Sensitive Data

Search for any hardcoded secrets:

```bash
# Search for potential passwords (should return nothing in committed files)
git grep -i "password.*=" -- "*.js" "*.jsx" | grep -v "password:"

# Search for potential secrets
git grep -i "secret.*=" -- "*.js" "*.jsx"
```

**Expected Result:**
- No hardcoded passwords in source code
- Only references to `process.env.JWT_SECRET`

---

## ✅ Step 4: Verify .env.example Files Are Safe

Check that example files don't contain real secrets:

```bash
# View server .env.example
cat server/.env.example

# View client .env.example
cat client/.env.example
```

**Verify:**
- ❌ No real database passwords
- ❌ No real JWT secrets
- ✅ Only placeholder values like "your-secret-key-here"

---

## ✅ Step 5: Check File Sizes

```bash
# List large files (should not include node_modules or build folders)
git ls-files | xargs ls -lh | sort -k5 -h -r | head -20
```

**Expected Result:**
- No files larger than 1MB
- No `node_modules/` files
- No `build/` files

---

## ✅ Step 6: Review What Will Be Committed

```bash
# See all files that will be committed
git ls-files
```

**Verify these are INCLUDED:**
- ✅ `server/src/**/*.js`
- ✅ `client/src/**/*.js`
- ✅ `server/prisma/schema.prisma`
- ✅ `server/.env.example`
- ✅ `client/.env.example`
- ✅ `README.md`
- ✅ `package.json` files

**Verify these are EXCLUDED:**
- ❌ `server/.env`
- ❌ `client/.env`
- ❌ `node_modules/`
- ❌ `client/build/`
- ❌ `.kiro/`

---

## ✅ Step 7: Final Security Check

**Manually verify:**

1. Open `server/.env` - Contains real password? ✅ (Should NOT be committed)
2. Open `server/.env.example` - Contains placeholder? ✅ (Safe to commit)
3. Run `git status` - `.env` files listed? ❌ (Should NOT appear)
4. Check `.gitignore` - Contains `.env`? ✅ (Should be there)

---

## 🚀 Ready to Push?

If ALL checks pass, you're ready to push:

```bash
# Stage all files
git add .

# Create commit
git commit -m "Initial commit: Store Rating Platform"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/store-rating-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## ⚠️ If ANY Check Fails

**STOP! DO NOT PUSH!**

1. Fix the issue
2. Run the checklist again
3. Only push when ALL checks pass

---

## 🔐 After Pushing - Verify on GitHub

1. Go to your GitHub repository
2. **Check these files are VISIBLE:**
   - ✅ `server/.env.example`
   - ✅ `client/.env.example`
   - ✅ `README.md`
   - ✅ Source code files

3. **Check these files are NOT VISIBLE:**
   - ❌ `server/.env`
   - ❌ `client/.env`
   - ❌ `node_modules/`

4. **Click on `server/.env.example`** - Should show placeholder values, NOT real secrets

---

## 🆘 Emergency: Accidentally Pushed Secrets

If you accidentally pushed sensitive data:

1. **IMMEDIATELY change all passwords and secrets**
2. **Contact GitHub support** if needed
3. **Follow instructions in GITHUB_SETUP.md** to remove from history
4. **Rotate all compromised credentials**

---

## ✅ Checklist Complete

- [ ] Step 1: Verified .gitignore is working
- [ ] Step 2: Verified .env files are ignored
- [ ] Step 3: No sensitive data in source code
- [ ] Step 4: .env.example files are safe
- [ ] Step 5: No large files included
- [ ] Step 6: Reviewed commit contents
- [ ] Step 7: Final security check passed
- [ ] Pushed to GitHub
- [ ] Verified on GitHub website

**All checks passed? 🎉 Your code is safely on GitHub!**
