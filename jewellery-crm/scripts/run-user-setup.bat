@echo off
echo ========================================
echo    Sarkar Jewellers CRM User Setup
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo Checking if .env.local exists...
if not exist ".env.local" (
    echo ❌ .env.local file not found
    echo Please create .env.local with your Supabase credentials
    echo See USER_SETUP_GUIDE.md for details
    pause
    exit /b 1
)

echo ✅ .env.local found
echo.

echo Installing dependencies...
npm install @supabase/supabase-js dotenv

echo.
echo Running user setup script...
node scripts/add-users-to-supabase.js

echo.
echo Setup complete! Check the output above for any errors.
pause
