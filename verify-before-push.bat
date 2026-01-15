@echo off
REM Verification Script - Run before pushing to GitHub
REM This script checks for common security issues

echo.
echo ========================================
echo   Pre-Push Security Verification
echo ========================================
echo.

set ERRORS=0
set WARNINGS=0

REM Check 1: Verify .env files are ignored
echo [Check 1] Verifying .env files are ignored...
git check-ignore server\.env client\.env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] .env files are properly ignored
) else (
    echo [FAIL] .env files are NOT ignored!
    echo        Fix: Add .env to .gitignore
    set /a ERRORS+=1
)
echo.

REM Check 2: Verify .env files are not staged
echo [Check 2] Checking if .env files are staged...
git diff --cached --name-only | findstr /C:".env" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [FAIL] .env files are staged for commit!
    echo        Fix: Run 'git reset HEAD server/.env client/.env'
    set /a ERRORS+=1
) else (
    echo [PASS] No .env files staged
)
echo.

REM Check 3: Search for hardcoded passwords
echo [Check 3] Searching for hardcoded passwords...
git grep -i "Rushi@1212" -- "*.js" "*.jsx" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [FAIL] Found hardcoded password in source code!
    echo        Fix: Replace with environment variables
    set /a ERRORS+=1
) else (
    echo [PASS] No hardcoded passwords found
)
echo.

REM Check 4: Verify node_modules is ignored
echo [Check 4] Checking if node_modules is ignored...
git ls-files | findstr /C:"node_modules" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [FAIL] node_modules is being tracked!
    echo        Fix: Add node_modules/ to .gitignore
    set /a ERRORS+=1
) else (
    echo [PASS] node_modules is not tracked
)
echo.

REM Check 5: Verify .env.example files exist
echo [Check 5] Checking for .env.example files...
if exist "server\.env.example" (
    if exist "client\.env.example" (
        echo [PASS] .env.example files exist
    ) else (
        echo [WARNING] Missing client/.env.example
        set /a WARNINGS+=1
    )
) else (
    echo [WARNING] Missing server/.env.example
    set /a WARNINGS+=1
)
echo.

REM Check 6: Verify .env.example doesn't contain real secrets
echo [Check 6] Checking .env.example for real secrets...
if exist "server\.env.example" (
    findstr /C:"Rushi@1212" server\.env.example >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [FAIL] .env.example contains real password!
        echo        Fix: Replace with placeholder values
        set /a ERRORS+=1
    ) else (
        echo [PASS] .env.example is safe
    )
)
echo.

REM Check 7: Verify build folders are ignored
echo [Check 7] Checking if build folders are ignored...
git ls-files | findstr /C:"client/build/" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Build folder is being tracked
    echo           Recommendation: Add build/ to .gitignore
    set /a WARNINGS+=1
) else (
    echo [PASS] Build folders are not tracked
)
echo.

REM Summary
echo ========================================
echo   VERIFICATION SUMMARY
echo ========================================
echo.

if %ERRORS% EQU 0 (
    if %WARNINGS% EQU 0 (
        echo [SUCCESS] ALL CHECKS PASSED!
        echo.
        echo Your repository is safe to push to GitHub!
        echo.
        echo Next steps:
        echo 1. git add .
        echo 2. git commit -m "Initial commit: Store Rating Platform"
        echo 3. git remote add origin https://github.com/YOUR_USERNAME/store-rating-platform.git
        echo 4. git push -u origin main
        exit /b 0
    ) else (
        echo [WARNING] PASSED WITH WARNINGS
        echo.
        echo Warnings: %WARNINGS%
        echo.
        echo You can proceed, but consider fixing warnings.
        exit /b 0
    )
) else (
    echo [FAILED] VERIFICATION FAILED
    echo.
    echo Errors: %ERRORS%
    echo Warnings: %WARNINGS%
    echo.
    echo DO NOT PUSH TO GITHUB!
    echo Fix all errors before pushing.
    exit /b 1
)
