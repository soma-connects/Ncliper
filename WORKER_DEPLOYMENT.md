# Worker Deployment Plan - FREE TIER FOCUS 🆓

## Best FREE Options for Testing

### Option 1: Modal ⭐ **RECOMMENDED FOR FREE TESTING**
**Free Tier:**
- 💰 **$30/month in credits** (renewable monthly)
- 🎥 **~50-100 video jobs/month** (depending on video length)
- ⏱️ **No time limits** on individual jobs
- 🔄 **Resets every month**

**Pros:**
- ✅ Most generous free tier for video processing
- ✅ FFmpeg pre-installed (zero setup)
- ✅ Auto-scaling serverless
- ✅ Simple deployment: `modal deploy worker.py`
- ✅ Perfect for testing before production

**Cons:**
- ⚠️ Requires Modal account (free signup)

**Best For:** Testing with real workloads, no Docker knowledge needed

---

### Option 2: Render.com 🆓 **100% FREE FOREVER**
**Free Tier:**
- 💰 **Completely FREE** (750 hours/month)
- 🎥 **Unlimited jobs** (within 750 hours)
- ⚠️ **Cold starts** (spins down after 15min idle)
- ⏱️ **No expiration** - free forever

**Pros:**
- ✅ Truly free forever
- ✅ Git-based deployment
- ✅ No credit card required
- ✅ Automatic Docker builds

**Cons:**
- ⚠️ Requires Dockerfile with FFmpeg
- ⚠️ Cold starts (~1-2 min first request)
- ⚠️ Slower performance (512MB RAM)

**Best For:** Long-term free testing, low-frequency usage

---

### Option 3: Google Cloud Run 🆓 **GENEROUS FREE TIER**
**Free Tier:**
- 💰 **2 million requests/month FREE**
- 🎥 **180,000 vCPU-seconds/month**
- ⏱️ **No expiration**
- 💳 **Requires credit card** (won't charge within free limits)

**Pros:**
- ✅ Very generous free tier
- ✅ Fast cold starts
- ✅ Enterprise-grade infrastructure
- ✅ Auto-scaling

**Cons:**
- ⚠️ Requires Google Cloud account + credit card
- ⚠️ Need Dockerfile with FFmpeg
- ⚠️ More complex setup

**Best For:** If you have GCP account, very generous limits

---

## Recommendation: **Modal for Quick Testing** 🚀

**Why Modal wins for FREE testing:**
1. **No Docker needed** - Deploy Python code directly
2. **$30/month credits** - Enough for 50-100 test videos
3. **Zero setup time** - 5 minutes to first deploy
4. **FFmpeg included** - No manual installation
5. **Monthly reset** - Fresh credits every month

**Alternative: Render.com for Forever-Free**
- Use if you want 100% free (no time limit)
- Accept slower performance + cold starts
- Need to create Dockerfile

---

## Deployment Steps (Modal)

### 1. Install Modal CLI
```bash
pip install modal
```

### 2. Create Modal Account
```bash
modal setup
```

### 3. Create Modal Configuration
- Convert worker to Modal function
- Set up secrets (Supabase, Redis, R2, Gemini)
- Deploy with `modal deploy`

### 4. Update API Route
- Change worker invocation from local process to Modal API call

---

## Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Redis (Upstash)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Cloudflare R2
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL

# Google Gemini
GOOGLE_API_KEY
```

---

## Free Tier Comparison

### Modal (Recommended)
- **FREE:** $30/month credits (renewable)
- **Videos:** ~50-100/month free
- **Duration:** Resets monthly
- **Setup Time:** 5 minutes
- **Perfect for:** Testing & MVP validation

### Render.com
- **FREE:** 750 hours/month (forever)
- **Videos:** Unlimited (within hours)
- **Duration:** Never expires
- **Setup Time:** 30 minutes (Dockerfile)
- **Perfect for:** Long-term free tier, hobby projects

### Google Cloud Run
- **FREE:** 2M requests/month
- **Videos:** ~180,000 CPU-seconds/month
- **Duration:** Never expires (requires CC)
- **Setup Time:** 20 minutes
- **Perfect for:** If you already have GCP account

---

## Next Steps

1. ✅ Review this plan
2. Install Modal CLI
3. Create Modal app configuration
4. Set up secrets
5. Deploy and test

**Ready to proceed with Modal deployment?**
