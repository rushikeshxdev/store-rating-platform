#!/bin/bash

# Verification Script - Run before pushing to GitHub
# This script checks for common security issues

echo "🔍 Running Pre-Push Security Verification..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Verify .env files are ignored
echo "📋 Check 1: Verifying .env files are ignored..."
if git check-ignore server/.env client/.env > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: .env files are properly ignored${NC}"
else
    echo -e "${RED}❌ FAIL: .env files are NOT ignored!${NC}"
    echo "   Fix: Add .env to .gitignore"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Verify .env files exist but are not staged
echo "📋 Check 2: Checking if .env files are staged..."
if git diff --cached --name-only | grep -q "\.env$"; then
    echo -e "${RED}❌ FAIL: .env files are staged for commit!${NC}"
    echo "   Fix: Run 'git reset HEAD server/.env client/.env'"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No .env files staged${NC}"
fi
echo ""

# Check 3: Search for hardcoded passwords
echo "📋 Check 3: Searching for hardcoded passwords..."
if git grep -i "Rushi@1212" -- "*.js" "*.jsx" > /dev/null 2>&1; then
    echo -e "${RED}❌ FAIL: Found hardcoded password in source code!${NC}"
    echo "   Fix: Replace with environment variables"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No hardcoded passwords found${NC}"
fi
echo ""

# Check 4: Verify node_modules is ignored
echo "📋 Check 4: Checking if node_modules is ignored..."
if git ls-files | grep -q "node_modules"; then
    echo -e "${RED}❌ FAIL: node_modules is being tracked!${NC}"
    echo "   Fix: Add node_modules/ to .gitignore and run 'git rm -r --cached node_modules'"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: node_modules is not tracked${NC}"
fi
echo ""

# Check 5: Verify .env.example files exist
echo "📋 Check 5: Checking for .env.example files..."
if [ -f "server/.env.example" ] && [ -f "client/.env.example" ]; then
    echo -e "${GREEN}✅ PASS: .env.example files exist${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Missing .env.example files${NC}"
    echo "   Recommendation: Create .env.example files"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 6: Verify .env.example doesn't contain real secrets
echo "📋 Check 6: Checking .env.example for real secrets..."
if grep -q "Rushi@1212" server/.env.example 2>/dev/null; then
    echo -e "${RED}❌ FAIL: .env.example contains real password!${NC}"
    echo "   Fix: Replace with placeholder values"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: .env.example is safe${NC}"
fi
echo ""

# Check 7: Verify build folders are ignored
echo "📋 Check 7: Checking if build folders are ignored..."
if git ls-files | grep -q "client/build/"; then
    echo -e "${YELLOW}⚠️  WARNING: Build folder is being tracked${NC}"
    echo "   Recommendation: Add build/ to .gitignore"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ PASS: Build folders are not tracked${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo ""
    echo "✅ Your repository is safe to push to GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. git add ."
    echo "2. git commit -m 'Initial commit: Store Rating Platform'"
    echo "3. git remote add origin https://github.com/YOUR_USERNAME/store-rating-platform.git"
    echo "4. git push -u origin main"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Warnings: $WARNINGS"
    echo ""
    echo "You can proceed, but consider fixing warnings."
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "⚠️  DO NOT PUSH TO GITHUB!"
    echo "Fix all errors before pushing."
    exit 1
fi
