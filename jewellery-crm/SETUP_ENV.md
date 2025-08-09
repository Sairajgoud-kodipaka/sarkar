# Environment Variables Setup

## Quick Setup for Supabase

To fix the "supabaseUrl is required" error, you need to configure your Supabase environment variables.

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Choose your organization and project name
4. Set a database password
5. Choose your region

### Step 2: Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to **Settings > API**
3. Copy your **Project URL** and **anon/public key**

### Step 3: Create Environment File

Create a `.env.local` file in the root of your project (same level as `package.json`) with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

### Step 5: Enable Email Authentication

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if needed

### Step 6: Restart Development Server

```bash
npm run dev
```

## Example .env.local

```env
# Replace with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example_key_here

# Optional: Enable debug mode
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

## Troubleshooting

- **Error persists**: Make sure you restarted the development server after creating `.env.local`
- **Wrong credentials**: Double-check your Supabase URL and anon key from the dashboard
- **CORS errors**: Ensure your Supabase URL is correct and includes `https://`
- **Database errors**: Run the schema from `supabase-schema.sql` in your Supabase SQL Editor

## Security Note

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- Only use the anon key in the frontend, never the service role key
