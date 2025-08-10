# 🚀 Vercel Deployment Guide

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub Account](https://github.com)
- [Supabase Project](https://supabase.com)

## Step 1: Prepare Your Repository

1. **Fork/Clone** this repository to your GitHub account
2. **Push** your changes to GitHub

## Step 2: Deploy to Vercel

### Option A: Deploy Button (Recommended)
1. Click the "Deploy with Vercel" button in the README
2. Connect your GitHub account
3. Select the repository
4. Configure project settings

### Option B: Manual Deployment
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure settings

## Step 3: Environment Variables

In your Vercel project settings, add these environment variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=Sarkar CRM
```

### How to Get Supabase Credentials:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the URL and anon key

## Step 4: Build Configuration

Vercel automatically detects this is a Next.js project and uses:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Step 5: Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

## Step 6: Environment-Specific Deployments

### Production
- **Branch**: `main` or `master`
- **Environment**: Production

### Preview Deployments
- **Branch**: Any feature branch
- **Environment**: Preview

## Step 7: Post-Deployment

1. **Test** all functionality
2. **Verify** authentication works
3. **Check** image uploads
4. **Monitor** performance

## Troubleshooting

### Build Errors
- Check environment variables are set correctly
- Verify Supabase credentials
- Check for TypeScript errors

### Runtime Errors
- Check browser console for errors
- Verify Supabase RLS policies
- Check network requests in DevTools

### Performance Issues
- Enable Vercel Analytics
- Check bundle size
- Optimize images

## Monitoring & Analytics

- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database and auth monitoring
- **Browser DevTools**: Frontend debugging

## Security Considerations

- Environment variables are encrypted
- Supabase RLS policies protect data
- HTTPS is enforced automatically
- Security headers are configured

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
