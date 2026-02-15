# Modal Deployment Guide

## Step 1: Install Modal ✅

```bash
pip install modal
```

## Step 2: Create Modal Account & Setup

Run this command to authenticate with Modal:

```bash
modal setup
```

This will:
1. Open your browser to create/login to Modal account (FREE)
2. Generate authentication token
3. Save credentials locally

## Step 3: Create Secrets

Modal needs your environment variables as "secrets". Run these commands:

### Supabase Secret
```bash
modal secret create ncliper-supabase ^
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url ^
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key ^
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Redis Secret
```bash
modal secret create ncliper-redis ^
  UPSTASH_REDIS_REST_URL=your_redis_url ^
  UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### R2 Secret
```bash
modal secret create ncliper-r2 ^
  R2_ACCOUNT_ID=fb0d22327c08a8b9629b1551cb1a2707 ^
  R2_ACCESS_KEY_ID=6726d1bdcbb128110a40191eabe840a2 ^
  R2_SECRET_ACCESS_KEY=79319882a6ae2b97cbc2b6b551f558676a2d0f405b01b64627a1019e377de4cc ^
  R2_BUCKET_NAME=ncliper-clips ^
  R2_PUBLIC_URL=https://pub-7f10a965839142a997e8b2a4086634c2.r2.dev
```

### Gemini Secret
```bash
modal secret create ncliper-gemini ^
  GOOGLE_API_KEY=your_gemini_api_key
```

## Step 4: Deploy Worker

Deploy the Modal worker:

```bash
cd python/worker
modal deploy modal_worker.py
```

This will:
- Build the container image with FFmpeg
- Install all dependencies
- Deploy the `process_video` function
- Give you a unique endpoint URL

## Step 5: Get Your Worker URL

After deployment, Modal will show your function URL:
```
✓ App deployed! 🎉

View your app at: https://modal.com/apps/ap-xxx

Worker function: ncliper-worker.process_video
```

## Step 6: Update Frontend API Route

Update `src/app/api/jobs/route.ts` to call Modal instead of local worker:

```typescript
// Instead of local Redis enqueue, call Modal directly
import modal from '@modal-labs/client';

const result = await modal.Function.lookup(
  "ncliper-worker",
  "process_video"
).remote(jobId, videoUrl, settings);
```

---

## Testing Your Deployment

Test the worker with:

```bash
modal run python/worker/modal_worker.py
```

This runs the test function locally but using Modal infrastructure!

---

## Monitoring & Logs

View logs in real-time:
```bash
modal app logs ncliper-worker
```

Or visit the Modal dashboard:
https://modal.com/apps

---

**You're almost done!** Just need to run `modal setup` and create the secrets! 🚀
