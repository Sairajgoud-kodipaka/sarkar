# Quick Setup Guide - Fix Login Issue

## The Problem
You're getting "Invalid login credentials" because the database schema hasn't been set up in Supabase yet.

## Solution Steps

### Step 1: Set Up Database Schema

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com
   - Sign in and go to your project: `wwyespebfotedtbphttp`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Database Schema**
   - Copy the entire contents of `supabase-schema.sql` file
   - Paste it into the SQL Editor
   - Click "Run" to execute

### Step 2: Enable Email Authentication

1. **Go to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Settings"

2. **Enable Email Provider**
   - Find "Email" in the providers list
   - Toggle it ON
   - Save changes

### Step 3: Create Your First User

1. **Go back to your app**
   - Open http://localhost:3000/login
   - Click "Don't have an account? Sign up"

2. **Create a test account**
   - Email: `admin@test.com`
   - Password: `password123`
   - First Name: `Admin`
   - Last Name: `User`
   - Role: `Business Admin`

### Step 4: Test Login

1. **Try logging in** with the credentials you just created
2. **You should now be redirected** to the dashboard

## What Each Step Does

- **Database Schema**: Creates all the tables (customers, products, sales, visits) and sets up Row Level Security
- **Email Authentication**: Enables Supabase to handle user registration and login
- **User Creation**: Creates your first user account in the system

## Troubleshooting

If you still get errors:

1. **Check Supabase Dashboard** for any error messages
2. **Verify the schema ran successfully** by checking if tables exist in the Table Editor
3. **Make sure Email provider is enabled** in Authentication settings
4. **Try creating a new user** instead of using existing credentials

## Next Steps After Login

Once you can log in:
1. Explore the dashboard
2. Add some test customers
3. Create products
4. Test the different user roles

The system will work perfectly once the database is set up!
