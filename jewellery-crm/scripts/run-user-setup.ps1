# Sarkar Jewellers CRM User Setup Script
# Run this in PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Sarkar Jewellers CRM User Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking if Node.js is installed..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if .env.local exists
Write-Host "Checking if .env.local exists..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "Please create .env.local with your Supabase credentials" -ForegroundColor Yellow
    Write-Host "See USER_SETUP_GUIDE.md for details" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ .env.local found" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install @supabase/supabase-js dotenv

Write-Host ""

# Run the setup script
Write-Host "Running user setup script..." -ForegroundColor Yellow
node scripts/add-users-to-supabase.js

Write-Host ""
Write-Host "Setup complete! Check the output above for any errors." -ForegroundColor Green
Read-Host "Press Enter to exit"
