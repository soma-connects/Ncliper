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
    Main video processing pipeline (Phase 2 - FULL IMPLEMENTATION)
    """
    from modules.video_downloader import download_and_extract_all
    from modules.ai_analyzer import analyze_transcript
    from modules.video_renderer import render_clip, RenderConfig
    
    job_id = job["id"]
    video_url = job["video_url"]
    settings = job.get("settings", {})
    
    print(f"[Worker] Processing video: {video_url}")
    print(f"[Worker] Settings: {settings}")
    
    temp_dir = f"/tmp/{job_id}"
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        # Update status to 'processing'
        update_job_status(job_id, "processing")
        
        # Step 1: Download video and extract transcript
        print(f"[Worker] [1/5] Downloading video...")
        video_file = download_and_extract_all(video_url, temp_dir)
        print(f"[Worker] ✅ Downloaded: {video_file.metadata.title}")
        print(f"[Worker] ✅ Duration: {video_file.metadata.duration}s")
        print(f"[Worker] ✅ Transcript: {len(video_file.transcript)} characters")
        
        # Step 2: Face Detection (optional, for smart cropping)
        from modules.face_detector import should_use_face_tracking, detect_faces_simple, generate_crop_filter
        from modules.video_renderer import get_video_info
        
        crop_filter = None
        if should_use_face_tracking(video_file.metadata.__dict__):
            print(f"[Worker] [2/5] Detecting faces for smart cropping...")
            video_info = get_video_info(video_file.file_path)
            crop_params = detect_faces_simple(
                video_file.file_path,
                video_info['width'],
                video_info['height']
            )
            if crop_params:
                crop_filter = generate_crop_filter(crop_params, video_info['width'], video_info['height'])
                print(f"[Worker] ✅ Using face-tracking crop")
            else:
                print(f"[Worker] ℹ️  No faces detected, will use center crop")
        else:
            print(f"[Worker] [2/5] Skipping face detection (video too long)")
        
        # Step 3: AI Analysis for viral hooks
        print(f"[Worker] [3/5] Analyzing with Gemini...")
        hooks = analyze_transcript(video_file.transcript)
        print(f"[Worker] ✅ Found {len(hooks)} viral hooks")
        
        # Step 4: Render clips
        print(f"[Worker] [4/5] Rendering {len(hooks)} clips...")
        clips = []
        render_config = RenderConfig(
            output_width=settings.get('width', 1080),
            output_height=settings.get('height', 1920),
            preset='fast',
            crf=23
        )
        
        for i, hook in enumerate(hooks[:3]):  # Top 3 clips
            print(f"[Worker]   Rendering clip {i+1}/{min(len(hooks), 3)}...")
            
            output_path = os.path.join(temp_dir, f"clip_{i}.mp4")
            
            # Render with segment merging if needed
            if len(hook.segments) > 1:
                segments = [{"start": seg.start, "end": seg.end} for seg in hook.segments]
                render_clip(
                    input_video=video_file.file_path,
                    output_path=output_path,
                    start_time=hook.start_time,
                    end_time=hook.end_time,
                    segments=segments,
                    crop_filter=crop_filter,
                    config=render_config
                )
            else:
                # Single segment clip
                render_clip(
                    input_video=video_file.file_path,
                    output_path=output_path,
                    start_time=hook.start_time,
                    end_time=hook.end_time,
                    crop_filter=crop_filter,
                    config=render_config
                )
            
            # Upload clip to R2
            from modules.storage import R2Storage
            try:
                storage = R2Storage()
                print(f"[Worker]   Uploading clip {i+1} to R2...")
                public_url = storage.upload_clip(output_path, job_id, i)
                
                # Delete local file after successful upload
                os.remove(output_path)
                
                clip_url = public_url
            except Exception as e:
                print(f"[Worker]   ⚠️  R2 upload failed: {e}")
                print(f"[Worker]   Falling back to local file")
                clip_url = f"file://{os.path.abspath(output_path)}"
            
            # Format clip for frontend (matching Clip type)
            clips.append({
                "id": f"{job_id}_clip_{i}",
                "title": hook.type,
                "url": clip_url,  # Now uses R2 HTTPS URL!
                "virality_score": hook.virality_score,
                "start_time": hook.start_time,
                "end_time": hook.end_time,
                "segments": [{"start": seg.start, "end": seg.end} for seg in hook.segments],
                "transcript_segments": []  # TODO: Add transcript matching in Phase 3
            })
            
            print(f"[Worker]   ✅ Clip {i+1}: {hook.type} (score: {hook.virality_score})")
        
        print(f"[Worker] [5/5] Saving results to Supabase...")
        
        # Prepare result data
        result_data = {
            "clips": clips,
            "metadata": {
                "title": video_file.metadata.title,
                "duration": video_file.metadata.duration,
                "hooks_found": len(hooks)
            }
        }
        
        # Update job with completed status and results
        update_job_with_result(job_id, result_data)
        
        print(f"[Worker] ✅ Job completed successfully!")
        
        return {
            "job_id": job_id,
            "clips": clips,
            "status": "completed",
            "metadata": result_data["metadata"]
        }
        
    except Exception as e:
        print(f"[Worker] ❌ Processing error: {e}")
        import traceback
        traceback.print_exc()
        
        # Update job status to failed
        update_job_failed(job_id, str(e))
        raise e
    
    finally:
        # Cleanup: optionally delete temp files (keep for Phase 2 testing)
        pass  # Don't delete in Phase 2 for debugging


def update_job_status(job_id: str, status: str) -> None:
    """Update job status in Supabase"""
    try:
        result = supabase.table("jobs").update({
            "status": status,
            "updated_at": "now()"
        }).eq("id", job_id).execute()
        
        if result.data:
            print(f"[Worker] Updated job {job_id} status to: {status}")
    except Exception as e:
        print(f"[Worker] Failed to update job status: {e}")


def update_job_with_result(job_id: str, result_data: Dict[str, Any]) -> None:
    """Update job with completed status and result data"""
    try:
        result = supabase.table("jobs").update({
            "status": "completed",
            "result_data": result_data,
            "updated_at": "now()"
        }).eq("id", job_id).execute()
        
        if result.data:
            print(f"[Worker] Saved result data for job {job_id}")
    except Exception as e:
        print(f"[Worker] Failed to save result data: {e}")
        raise e


def update_job_failed(job_id: str, error_message: str) -> None:
    """Update job with failed status and error message"""
    try:
        result = supabase.table("jobs").update({
            "status": "failed",
            "error": error_message,
            "updated_at": "now()"
        }).eq("id", job_id).execute()
        
        if result.data:
            print(f"[Worker] Marked job {job_id} as failed")
    except Exception as e:
        print(f"[Worker] Failed to update job failure: {e}")


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
