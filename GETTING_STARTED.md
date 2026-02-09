# 🚀 Getting Started: Phase 1 Setup

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Python 3.10+ installed
- ✅ Existing `.env.local` with Supabase + Clerk credentials

---

## Step 1: Set Up Upstash Redis (5 minutes)

1. **Create Account**
   - Go to [https://upstash.com](https://upstash.com)
   - Sign up (free tier)

2. **Create Database**
   - Click "Create Database"
   - Name: `ncliper-queue`
   - Type: **Regional** (not global)
   - Region: Choose closest to you
   - Click **Create**

3. **Get Credentials**
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`

4. **Add to `.env.local`**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

---

## Step 2: Run Database Migration (2 minutes)

1. Open Supabase Dashboard → **SQL Editor**
2. Copy contents of [`supabase_migration_phase1.sql`](file:///c:/Users/user/Ncliper/supabase_migration_phase1.sql)
3. Paste and click **Run**
4. Verify tables created:
   - `jobs`
   - `credit_ledger`
   - `embeddings`

---

## Step 3: Test the API (1 minute)

```bash
# Start Next.js dev server
npm run dev

# In another terminal, test health check
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": { "redis": "connected" },
  "queue": { "depth": 0 }
}
```

✅ If you see `"redis": "connected"`, you're good to proceed!

---

## Step 4: Start Python Worker (5 minutes)

```bash
# Navigate to worker directory
cd python/worker

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**Edit `python/worker/.env`:**
```env
REDIS_URL=redis://default:your-upstash-token@your-database.upstash.io:6379
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
```

**Note:** For Upstash Redis, convert the REST URL to Redis protocol:
- REST: `https://abc-123.upstash.io`
- Redis: `rediss://default:<token>@abc-123.upstash.io:6379`

**Start worker:**
```bash
python main.py
```

**Expected Output:**
```
[Worker] Starting worker loop...
[Worker] Redis connection successful
[Worker] Listening on queue: jobs:processing
[Worker] Queue empty, waiting...
```

---

## Step 5: Submit Test Job (2 minutes)

In a **new terminal**:

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "settings": {
      "clip_count": 3
    }
  }'
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Job queued successfully..."
}
```

**Check worker logs** - should show:
```
[Worker] Picked up job: 550e8400-e29b-41d4-a716-446655440000
[Worker] Processing video: https://www.youtube.com/watch?v=...
[Worker] Job completed successfully
```

---

## Step 6: Verify Job Status

```bash
# Poll job status (replace with your job_id)
curl http://localhost:3000/api/jobs/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result_url": "placeholder://clips/...",
  "created_at": "2024-02-08T20:00:00Z"
}
```

---

## Troubleshooting

### "Redis connection failed"

- **Check** `.env.local` has correct Redis credentials
- **Verify** Upstash database is active (not paused)
- **Test** connection: `redis-cli -u <REDIS_URL> ping`

### "Worker not picking up jobs"

- **Check** worker is running (`python main.py`)
- **Check** `REDIS_URL` in worker `.env` matches Next.js
- **Verify** queue has items: In Upstash console, run `LLEN jobs:processing`

### "Unauthorized" error

- Phase 1 uses Clerk auth
- Include valid Clerk token in `Authorization` header
- Or modify API to skip auth for testing

---

## Success Criteria

✅ All these should work:

1. Health check shows Redis connected
2. Job submission returns 202 with job_id
3. Worker picks up job from queue
4. Job status updates to "processing" then "completed"
5. Supabase `jobs` table shows the records

---

## What's Next?

Once Phase 1 is tested and working:

**Phase 2: Implement Actual Video Processing**
- Integrate yt-dlp download
- Add Gemini multimodal analysis
- Implement MediaPipe face tracking
- Create FFmpeg rendering pipeline

See [implementation_plan.md](file:///C:/Users/user/.gemini/antigravity/brain/d3776f28-b7e9-414d-95ce-a0104268d482/implementation_plan.md) for full roadmap!

---

## Need Help?

- **Redis Setup**: [docs/REDIS_SETUP.md](file:///c:/Users/user/Ncliper/docs/REDIS_SETUP.md)
- **Worker Guide**: [python/worker/README.md](file:///c:/Users/user/Ncliper/python/worker/README.md)
- **Architecture**: [walkthrough.md](file:///C:/Users/user/.gemini/antigravity/brain/d3776f28-b7e9-414d-95ce-a0104268d482/walkthrough.md)
