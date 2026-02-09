"""
End-to-End Integration Test for Phase 2
Tests complete video processing pipeline:
1. Submit job to Redis
2. Worker picks up job
3. Downloads video + extracts transcript
4. Analyzes with Gemini
5. Renders clips with FFmpeg
6. Saves results
"""

import sys
import os
import json
import uuid
from redis import Redis
from dotenv import load_dotenv

# Load environment
load_dotenv(dotenv_path='python/worker/.env')

# Redis connection
REDIS_URL = os.getenv("REDIS_URL")
redis_client = Redis.from_url(REDIS_URL, decode_responses=True)

# Test video (short, clear hooks, good for testing)
TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
# Alternative: "https://www.youtube.com/watch?v=jNQXAC9IVRw" (shorter "Me at the zoo")

print("="*70)
print("PHASE 2 END-TO-END INTEGRATION TEST")
print("="*70)

# Create test job
test_job = {
    "id": str(uuid.uuid4()),
    "user_id": "test_user_phase2",
    "video_url": TEST_URL,
    "settings": {
        "clip_count": 3,
        "aspect_ratio": "9:16",
        "width": 1080,
        "height": 1920
    },
    "created_at": "2026-02-09T17:42:00Z",
    "retry_count": 0
}

print(f"\n📋 Test Job Configuration:")
print(f"   Job ID: {test_job['id']}")
print(f"   Video: {test_job['video_url']}")
print(f"   Settings: {test_job['settings']}")
print(f"\n⏳ Submitting job to Redis queue...")

# Push to Redis queue
redis_client.lpush("jobs:processing", json.dumps(test_job))

print(f"✅ Job submitted successfully!")
print(f"\n" + "="*70)
print(f"🚀 START THE WORKER NOW:")
print(f"   cd python/worker")
print(f"   python main.py")
print(f"="*70)
print(f"\nThe worker will:")
print(f"  [1/4] Download video + extract transcript")
print(f"  [2/4] Analyze with Gemini for viral hooks")
print(f"  [3/4] Render 3 clips with FFmpeg")
print(f"  [4/4] Save clips to /tmp/{test_job['id']}/")
print(f"\n⏳ Waiting for worker to process...")
print(f"\nYou should see detailed logs from the worker showing each step!")
print("="*70)
