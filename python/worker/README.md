# Python Worker - Quick Start Guide

## Local Development Setup

### 1. Install Dependencies

```bash
cd python/worker
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:
- `REDIS_URL`: Redis connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Service role key from Supabase

### 3. Run Worker Locally

```bash
python main.py
```

You'll see:
```
[Worker] Starting worker loop...
[Worker] Listening on queue: jobs:processing
[Worker] Redis connection successful
[Worker] Queue empty, waiting...
```

### 4. Test the System

In another terminal, start your Next.js dev server, then:

```bash
# Submit a test job via API
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Worker should print:
```
[Worker] Picked up job: <job-id>
[Worker] Processing video: https://youtube.com/watch?v=...
[Worker] Job <job-id> completed successfully
```

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Next.js   │ ───→ │    Redis    │ ───→ │ Python Worker│
│  (Control)  │      │   (Queue)   │      │  (Compute)   │
└─────────────┘      └─────────────┘      └──────────────┘
       │                                           │
       └───────────── Supabase DB ────────────────┘
           (Job status, clips, credits)
```

## Current Status

✅ **Implemented:**
- Redis queue consumer with blocking pop
- Job status tracking in Supabase
- Retry logic with exponential backoff
- Dead letter queue for failed jobs
- Health monitoring

🚧 **TODO (Phase 2):**
- Actual video processing (yt-dlp download)
- Gemini multimodal analysis
- MediaPipe face detection
- FFmpeg clip rendering
- R2 upload for results

## Docker Deployment (Phase 1.4)

Will create Dockerfile for RunPod/Modal deployment after local testing succeeds.

## Monitoring

- Check worker logs for processing activity
- Query Redis: `LLEN jobs:processing` for queue depth
- Check Supabase `jobs` table for status
