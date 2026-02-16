# 🚀 Deploying Ncliper to Vercel

This guide walks you through deploying the Ncliper frontend to Vercel. The Python video processing worker requires separate deployment (see [WORKER_DEPLOYMENT.md](./WORKER_DEPLOYMENT.md)).

## 📋 Prerequisites

Before deploying, ensure you have:

- **GitHub account** (for repository connection)
- **Vercel account** (free tier works for testing) - [Sign up here](https://vercel.com/signup)
- **Supabase project** configured (see database schema in `supabase_schema.sql`)
- **Clerk account** for authentication
- **Google Gemini API key** for AI analysis
- **Upstash Redis** for job queue

---

## ⚡ Quick Deploy

### Option 1: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

The CLI will guide you through the setup process and environment variable configuration.

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Configure project settings (auto-detected from `vercel.json`)
   - Add environment variables (see below)
   - Click **Deploy**

---

## 🔧 Environment Variables Setup

You **must** configure these environment variables in the Vercel dashboard before deployment:

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable from [.env.production.example](./.env.production.example)
3. Set the **scope** for each variable:
   - **Production**: Live production values
   - **Preview**: Testing/staging values
   - **Development**: Local development values (optional)

### Required Variables

| Variable | Where to Get | Scope |
|----------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Production, Preview |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys | All |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | Production, Preview |
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) | All |
| `UPSTASH_REDIS_REST_URL` | Upstash Console → Redis → REST API | All |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Redis → REST API | All |

> [!IMPORTANT]
> Never commit `.env.local` or `.env.production.example` with actual values to Git!

---

## 🏗️ Build Configuration

The project is pre-configured with optimal Vercel settings in `vercel.json`:

- **Framework**: Next.js 15 with App Router
- **Region**: `iad1` (US East) - change if needed
- **Function Duration**: 30s maximum for API routes
- **Node Version**: Auto-detected from `package.json`

### Build Commands

Vercel automatically runs:
```bash
npm install
npm run build
```

---

## ✅ Post-Deployment Verification

After deployment, test these features:

### 1. **Basic Functionality**
- [ ] Visit your deployment URL
- [ ] Verify homepage loads correctly
- [ ] Check that images and fonts load

### 2. **Authentication (Clerk)**
- [ ] Sign up with a new account
- [ ] Sign in with existing account
- [ ] Verify protected routes redirect to login

### 3. **Database (Supabase)**
- [ ] Create a new project
- [ ] Verify project appears in dashboard
- [ ] Check Supabase database for new record

### 4. **API Routes**
- [ ] Test `/api/health` endpoint
- [ ] Submit a video URL for processing
- [ ] Check Redis queue for job submission

### 5. **Worker Integration** (if deployed separately)
- [ ] Verify worker can access Redis queue
- [ ] Confirm jobs are processed
- [ ] Check clips are saved to database

---

## 🛠️ Troubleshooting

### Build Fails

**Problem**: Build fails with missing environment variables  
**Solution**: Ensure all required variables are added to Vercel dashboard

**Problem**: TypeScript errors during build  
**Solution**: Run `npm run typecheck` locally and fix errors

### Runtime Errors

**Problem**: "Failed to fetch" errors on API routes  
**Solution**: Check that environment variables are set for Production scope

**Problem**: Clerk authentication not working  
**Solution**: Add your Vercel deployment URL to Clerk dashboard → Allowed Origins

**Problem**: Supabase connection errors  
**Solution**: Verify RLS policies are configured correctly

### Worker Not Processing Videos

**Problem**: Jobs stuck in Redis queue  
**Solution**: Check worker deployment logs (Modal/Render dashboard)

**Problem**: Worker can't access videos  
**Solution**: Ensure CORS is configured on R2/S3 bucket

---

## 🔄 Continuous Deployment

Once connected to GitHub, Vercel automatically deploys:

- **Production**: When you push to `main` branch
- **Preview**: When you open a pull request

### Deployment Workflow

```bash
# Make changes locally
git add .
git commit -m "Add feature X"
git push origin feature-branch

# Vercel creates preview deployment automatically
# Merge PR → triggers production deployment
```

---

## 📊 Monitoring

### Vercel Dashboard

Monitor your deployment at [vercel.com/dashboard](https://vercel.com/dashboard):

- **Analytics**: Page views, user sessions
- **Logs**: Real-time function logs
- **Speed Insights**: Performance metrics
- **Deployments**: History and rollback options

### External Services

- **Supabase**: Database logs and queries
- **Clerk**: User authentication events
- **Upstash**: Redis queue metrics
- **Google Cloud**: Gemini API usage

---

## 🎯 Production Checklist

Before going live with real users:

- [ ] Environment variables configured for Production scope
- [ ] Custom domain connected (if applicable)
- [ ] Clerk authorized domains updated
- [ ] Supabase RLS policies tested
- [ ] Python worker deployed and tested
- [ ] Error tracking configured (optional: Sentry)
- [ ] Rate limiting configured for API routes
- [ ] Video storage configured (R2/S3)
- [ ] Backup strategy for database
- [ ] Monitoring and alerts set up

---

## 🆘 Need Help?

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Ncliper Issues**: Check existing GitHub issues or create a new one

---

## 📝 Architecture Diagram

```
┌─────────────────┐
│   GitHub Repo   │
└────────┬────────┘
         │ (Auto-deploy)
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Vercel (Next)  │◄────►│  Clerk (Auth)    │
└────────┬────────┘      └──────────────────┘
         │
         ├──────────────►┌──────────────────┐
         │               │  Supabase (DB)   │
         │               └──────────────────┘
         │
         ├──────────────►┌──────────────────┐
         │               │ Google Gemini AI │
         │               └──────────────────┘
         │
         └──────────────►┌──────────────────┐
                         │ Upstash Redis    │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │ Python Worker    │
                         │ (Modal/Render)   │
                         └──────────────────┘
```

---

**Happy Deploying! 🎉**
