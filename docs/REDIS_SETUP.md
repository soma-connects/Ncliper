# Upstash Redis Setup Guide

## Quick Start (Free Tier)

1. **Create Account**
   - Go to [https://upstash.com](https://upstash.com)
   - Sign up with GitHub or email

2. **Create Redis Database**
   - Click "Create Database"
   - Name: `ncliper-queue`
   - Type: Regional
   - Region: Choose closest to your Vercel deployment
   - Enable "Eviction" → Keep disabled (we want persistent queues)
   - Click "Create"

3. **Get Credentials**
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`
   - Add to `.env.local`:
     ```env
     UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
     UPSTASH_REDIS_REST_TOKEN=your-token-here
     ```

4. **Verify Connection**
   - Run: `npm run dev`
   - Visit: `http://localhost:3000/api/health`
   - Should see: `{"redis": "connected"}`

## Free Tier Limits

- 10,000 commands/day
- 256 MB storage
- **Sufficient for ~500 videos/day** (assuming 20 commands per video)

## Alternative: Local Redis (Development)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Update .env.local
UPSTASH_REDIS_REST_URL=redis://localhost:6379
UPSTASH_REDIS_REST_TOKEN=not-required-locally
```

## Queue Architecture

```
┌─────────────────────────────────────────────┐
│  Redis Queue Structure                       │
├─────────────────────────────────────────────┤
│                                             │
│  jobs:processing    → Active worker queue   │
│  jobs:completed     → Success log           │
│  jobs:dead_letter   → Failed after retries  │
│                                             │
└─────────────────────────────────────────────┘
```

## Monitoring

View queue depth in Upstash Console:
- Click your database
- Go to "Data Browser"
- Run: `LLEN jobs:processing`
