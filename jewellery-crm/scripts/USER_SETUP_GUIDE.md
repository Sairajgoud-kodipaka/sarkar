# 👥 User Setup Guide for Sarkar Jewellers CRM

This guide will help you add all 28 users to your Supabase database with proper authentication and role assignments.

## 📋 User Summary

- **👑 Admin**: 1 user (Divesh Sarkar)
- **🏪 Manager**: 1 user (Satellite Manager)  
- **🧑‍💼 Salespeople**: 26 users (distributed across 3 floors)

## 🚀 Setup Options

### Option 1: Node.js Script (Recommended)

1. **Install dependencies** (if not already installed):
   ```bash
   cd jewellery-crm
   npm install @supabase/supabase-js dotenv
   ```

2. **Add Service Role Key to .env**:
   Create or update your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://wwyespebfotedtbphttp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Get your Service Role Key**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "service_role" key (NOT the anon key)

4. **Run the script**:
   ```bash
   node scripts/add-users-to-supabase.js
   ```

### Option 2: SQL Script

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/add-users-to-supabase.sql`
4. Click "Run" to execute the script

## 🔐 User Credentials

### Admin Access
- **Email**: admin.divesh@sarkarjewellers.com
- **Password**: Divyesh@Sarkar1234
- **Role**: business_admin
- **Access**: Full system access

### Manager Access
- **Email**: satellite.manager@sarkarjewellers.com
- **Password**: Manager123
- **Role**: floor_manager
- **Access**: Floor management, team oversight

### Sales Team Access
- **Email Pattern**: [name]@sarkarjewellers.com
- **Password**: Sales123
- **Role**: sales_associate
- **Access**: Customer management, sales tracking

## 🏢 Floor Distribution

- **Floor 1**: 5 sales associates + 1 manager
- **Floor 2**: 8 sales associates
- **Floor 3**: 13 sales associates

## 🔧 Schema Requirements

Make sure your `team_members` table has these fields:
- `id` (UUID, primary key)
- `email` (TEXT, unique)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `role` (TEXT, enum: business_admin, floor_manager, sales_associate)
- `floor` (INTEGER, 1-3 or NULL)
- `phone` (TEXT, nullable)
- `status` (TEXT, default: 'active')

## ✅ Verification Steps

After running the setup:

1. **Check team_members table**:
   ```sql
   SELECT COUNT(*) as total_users FROM public.team_members;
   SELECT role, COUNT(*) FROM public.team_members GROUP BY role;
   ```

2. **Verify floor distribution**:
   ```sql
   SELECT floor, COUNT(*) FROM public.team_members 
   WHERE role = 'sales_associate' 
   GROUP BY floor ORDER BY floor;
   ```

3. **Test login** with a few users to ensure authentication works

## 🚨 Important Notes

- **Service Role Key**: Required for the Node.js script to create users
- **Email Confirmation**: Users are created with confirmed emails (no email verification needed)
- **Password Security**: Consider changing default passwords after first login
- **Role Permissions**: Ensure your RLS policies allow proper access based on roles

## 🔄 Updating Users

To modify existing users:
1. Use the Supabase dashboard → Authentication → Users
2. Or update the `team_members` table directly
3. For password changes, use the Supabase dashboard

## 🆘 Troubleshooting

### Common Issues:

1. **"Missing SUPABASE_SERVICE_ROLE_KEY"**
   - Add the service role key to your .env file
   - Get it from Supabase dashboard → Settings → API

2. **"Permission denied"**
   - Ensure you're using the service role key, not the anon key
   - Check your RLS policies

3. **"User already exists"**
   - Users with existing emails will fail to create
   - Check for duplicates before running the script

4. **"Role validation failed"**
   - Ensure your role enum includes: business_admin, floor_manager, sales_associate

## 📞 Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your database schema matches the requirements
3. Ensure all environment variables are properly set

---

**🎉 Once completed, all 28 users will be able to log into your CRM system with their assigned roles and floor access!**
