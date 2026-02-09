"""
Ncliper Video Processing Worker
Async worker that consumes jobs from Redis queue and processes videos
"""

import os
import json
import time
from typing import Dict, Any, Optional
from redis import Redis
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Initialize clients
redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Queue names (must match TypeScript definitions)
QUEUE_PROCESSING = "jobs:processing"
QUEUE_COMPLETED = "jobs:completed"
QUEUE_DEAD_LETTER = "jobs:dead_letter"

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 5

def update_job_status(
    job_id: str, 
    status: str, 
    result_url: Optional[str] = None,
    error: Optional[str] = None
) -> None:
    """Update job status in Supabase database"""
    try:
        update_data = {"status": status, "updated_at": "now()"}
        
        if status == "processing":
            update_data["processing_started_at"] = "now()"
        elif status in ["completed", "failed"]:
            update_data["processing_completed_at"] = "now()"
        
        if result_url:
            update_data["result_url"] = result_url
        if error:
            update_data["error"] = error

        supabase.table("jobs").update(update_data).eq("id", job_id).execute()
        print(f"[Worker] Updated job {job_id} status: {status}")
        
    except Exception as e:
        print(f"[Worker] Failed to update job status: {e}")


def process_video(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main video processing pipeline
    TODO: Implement actual video processing logic
    """
    job_id = job["id"]
    video_url = job["video_url"]
    settings = job.get("settings", {})
    
    print(f"[Worker] Processing video: {video_url}")
    print(f"[Worker] Settings: {settings}")
    
    # TODO Phase 2: Implement actual processing
    # 1. Download video with yt-dlp
    # 2. Extract transcript
    # 3. Analyze with Gemini (multimodal)
    # 4. Detect faces with MediaPipe
    # 5. Generate clips with FFmpeg
    # 6. Upload to Cloudflare R2
    # 7. Return result URLs
    
    # For now, simulate processing
    time.sleep(2)
    
    return {
        "job_id": job_id,
        "clips": [
            {
                "title": "Mock Clip 1",
                "url": f"https://example.com/clips/{job_id}_1.mp4",
                "virality_score": 85,
            }
        ],
        "status": "completed"
    }


def handle_job(job_data: str) -> bool:
    """
    Process a single job
    Returns True if successful, False otherwise
    """
    try:
        job = json.loads(job_data)
        job_id = job["id"]
        
        print(f"[Worker] Picked up job: {job_id}")
        
        # Update status to processing
        update_job_status(job_id, "processing")
        
        # Process the video
        result = process_video(job)
        
        # Update to completed
        # In real implementation, result_url would be R2 URL
        update_job_status(
            job_id, 
            "completed",
            result_url=f"placeholder://clips/{job_id}"
        )
        
        # Move to completed queue for logging
        redis_client.lpush(QUEUE_COMPLETED, job_data)
        
        print(f"[Worker] Job {job_id} completed successfully")
        return True
        
    except Exception as e:
        print(f"[Worker] Job processing error: {e}")
        
        try:
            job = json.loads(job_data)
            job_id = job["id"]
            retry_count = job.get("retry_count", 0)
            
            if retry_count < MAX_RETRIES:
                # Retry: increment count and re-queue
                job["retry_count"] = retry_count + 1
                print(f"[Worker] Retrying job {job_id} (attempt {retry_count + 1}/{MAX_RETRIES})")
                time.sleep(RETRY_DELAY_SECONDS)
                redis_client.lpush(QUEUE_PROCESSING, json.dumps(job))
            else:
                # Max retries exceeded: move to dead letter queue
                print(f"[Worker] Job {job_id} failed after {MAX_RETRIES} retries")
                update_job_status(job_id, "failed", error=str(e))
                redis_client.lpush(QUEUE_DEAD_LETTER, job_data)
        except:
            pass
        
        return False


def worker_loop():
    """
    Main worker loop
    Blocks on Redis queue and processes jobs as they arrive
    """
    print("[Worker] Starting worker loop...")
    print(f"[Worker] Listening on queue: {QUEUE_PROCESSING}")
    print(f"[Worker] Redis: {REDIS_URL}")
    print(f"[Worker] Supabase: {SUPABASE_URL}")
    
    while True:
        try:
            # Blocking pop with 30-second timeout
            result = redis_client.brpop(QUEUE_PROCESSING, timeout=30)
            
            if result:
                queue_name, job_data = result
                handle_job(job_data)
            else:
                # Timeout: just loop again
                print("[Worker] Queue empty, waiting...")
                
        except KeyboardInterrupt:
            print("\n[Worker] Shutting down gracefully...")
            break
        except Exception as e:
            print(f"[Worker] Loop error: {e}")
            time.sleep(5)  # Brief pause before retry


if __name__ == "__main__":
    # Validate environment
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("[Worker] ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        exit(1)
    
    # Test Redis connection
    try:
        redis_client.ping()
        print("[Worker] Redis connection successful")
    except Exception as e:
        print(f"[Worker] ERROR: Redis connection failed: {e}")
        exit(1)
    
    # Start processing
    worker_loop()
