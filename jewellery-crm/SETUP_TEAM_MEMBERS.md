# Team Member Creation Fix

## Issue
The team member creation was failing with a 403 "User not allowed" error because the code was trying to use `supabase.auth.admin.createUser()` which requires admin privileges that aren't available with the anonymous key.

## Solution Applied

### 1. Updated API Service
- Modified `createTeamMember()` function to use `supabase.auth.signUp()` instead of `supabase.auth.admin.createUser()`
- Added insertion into the new `team_members` table
- Updated `getTeamMembers()` to use the `team_members` table instead of admin API

### 2. Updated Database Schema
- Added `team_members` table with proper structure
- Added RLS policies for team member management
- Updated foreign key references to use the new table

### 3. Improved Error Handling
- Enhanced error messages in the AddTeamMemberModal
- Added better success/error feedback

## Setup Steps

### 1. Create Environment File
Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wwyespebfotedtbphttp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

### 2. Update Database Schema
Run the updated schema in your Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click Run to execute

### 3. Test Team Member Creation
1. Restart your development server: `npm run dev`
2. Go to the team management page
3. Try creating a new team member
4. The user should be created successfully without the 403 error

## How It Works Now

1. **User Signup**: Uses regular `signUp()` method instead of admin API
2. **Database Storage**: Stores team member data in `team_members` table
3. **Authentication**: User can sign in with their email/password
4. **Role Management**: User roles are stored in both auth metadata and team_members table

## Troubleshooting

### If you still get errors:
1. Check that the `.env.local` file exists and has correct values
2. Ensure the database schema has been updated
3. Clear browser cache and restart the dev server
4. Check browser console for any remaining errors

### Common Issues:
- **CORS errors**: Make sure Supabase URL is correct
- **RLS policy errors**: Ensure you're logged in as a business admin
- **Duplicate email errors**: Check if the email already exists

## Security Notes
- Team members can now sign up and sign in normally
- Business admins can manage all team members
- Floor managers can only see their own profile
- All operations respect RLS policies
