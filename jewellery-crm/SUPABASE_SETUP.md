# Supabase Setup Guide for Sarkar CRM

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Choose your organization and project name
4. Set a database password
5. Choose your region

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

## 3. Configure Environment Variables

Create a `.env.local` file in the root of your project with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Enable Email Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable "Email" provider
3. Configure email templates if needed
4. Set up email confirmation settings

## 5. Database Schema

The following tables will be created automatically when you first use the application:

### Users (Managed by Supabase Auth)
- id (uuid)
- email
- user_metadata (contains role, floor, name, etc.)

### Customers
- id (int)
- name (text)
- phone (text)
- interest (text)
- floor (int)
- visited_date (date)
- assigned_to (int)
- notes (text)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)

### Products
- id (int)
- name (text)
- sku (text)
- type (text)
- category (text)
- price (numeric)
- image (text)
- description (text)
- stock_quantity (int)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)

### Sales
- id (int)
- customer_id (int)
- customer_name (text)
- amount (numeric)
- date (date)
- floor (int)
- created_by (int)
- created_at (timestamp)

### Visits
- id (int)
- customer_id (int)
- customer_name (text)
- floor (int)
- date (date)
- interest (text)
- created_at (timestamp)

## 6. Row Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your needs)
CREATE POLICY "Users can view their own data" ON customers
  FOR SELECT USING (auth.uid()::text = assigned_to::text);

CREATE POLICY "Business admins can view all data" ON customers
  FOR ALL USING (
    (SELECT user_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'business_admin'
  );
```

## 7. Test the Setup

1. Run the development server: `npm run dev`
2. Go to `/login`
3. Try creating a new account
4. Test login functionality

## 8. Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your Supabase URL is correct
2. **Authentication Errors**: Check if email provider is enabled
3. **Database Errors**: Ensure RLS policies are set up correctly

### Debug Mode:

Add this to your `.env.local` for debugging:
```env
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

## 9. Production Deployment

1. Set up environment variables in your hosting platform
2. Configure custom domain in Supabase if needed
3. Set up proper email templates for production
4. Configure backup and monitoring

## 10. Security Best Practices

1. Never expose your service role key in the frontend
2. Use RLS policies to restrict data access
3. Validate user inputs on both client and server
4. Regularly update dependencies
5. Monitor authentication logs
