"""
Test script to submit a job directly to Redis queue
Bypasses the API for testing purposes
"""

from redis import Redis
import json
import uuid
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path='python/worker/.env')

# Redis connection
REDIS_URL = os.getenv("REDIS_URL")
redis_client = Redis.from_url(REDIS_URL, decode_responses=True)

# Create test job
test_job = {
    "id": str(uuid.uuid4()),
    "user_id": "test_user",
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "settings": {
        "clip_count": 3,
        "aspect_ratio": "9:16"
    },
    "created_at": "2026-02-08T22:00:00Z",
    "retry_count": 0
}

# Push to Redis queue
redis_client.lpush("jobs:processing", json.dumps(test_job))

print(f"✅ Test job submitted!")
print(f"Job ID: {test_job['id']}")
print(f"Video URL: {test_job['video_url']}")
print(f"\nCheck worker terminal - it should pick this up immediately!")
