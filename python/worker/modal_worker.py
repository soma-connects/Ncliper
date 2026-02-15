import modal
import sys
import os
import shutil
import tempfile
from typing import Dict, Any

# Define the Modal app
app = modal.App("ncliper-worker")

# Define the container image with dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg", "git")
    .pip_install(
        "yt-dlp",
        "youtube-transcript-api",
        "google-generativeai",
        "supabase",
        "redis",
        "boto3",
        "python-dotenv",
        "requests",
        "fastapi[standard]"
    )
    .add_local_dir("python/worker/modules", remote_path="/root/modules")
)

@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("ncliper-supabase"),
        modal.Secret.from_name("ncliper-redis"),
        modal.Secret.from_name("ncliper-r2"),
        modal.Secret.from_name("ncliper-gemini"),
        modal.Secret.from_name("ncliper-youtube-cookies")
    ],
    timeout=1800, # 30 minutes max
    cpu=2.0,
    memory=4096,
)
def process_video(job_id: str, project_id: str, video_url: str, settings: Dict[str, Any] = None):
    print(f"[Modal Worker] Starting job {job_id} for project {project_id}")
    print(f"[Modal Worker] Video URL: {video_url}")

    # Define update_job_status early so we can use it
    from supabase import create_client
    # Initialize Supabase
    try:
        supabase = create_client(
            os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
    except Exception as e:
        print(f"[Modal Worker] Failed to init Supabase: {e}")
        return {"success": False, "error": f"Supabase init failed: {e}"}
    
    def update_job_status(status: str, error: str = None, result_url: str = None):
        """Update job status in Supabase"""
        try:
            update_data = {"status": status}
            if error:
                update_data["error"] = error
            if result_url:
                update_data["result_url"] = result_url
                
            supabase.table("jobs").update(update_data).eq("id", job_id).execute()
            print(f"[Modal Worker] Job status: {status}")
        except Exception as e:
            print(f"[Modal Worker] Failed to update status: {e}")

    # Create a temporary directory for processing
    temp_dir = tempfile.mkdtemp(prefix=f"job_{job_id}_")
    
    try:
        # Update status to processing
        update_job_status("processing")

        # Check version
        try:
            with open("/root/modules/VERSION", "r") as f:
                ver = f.read().strip()
                print(f"[Modal Worker] version: {ver}")
                # Log version to DB for debug
                # update_job_status("processing", error=f"Version: {ver}") 
        except Exception as e:
            print(f"[Modal Worker] VERSION file not found: {e}")

        # Add modules to path
        sys.path.append("/root")
        
        # Import our local modules
        from modules import video_downloader, ai_analyzer, video_renderer, storage
        
        # Debug: Check if video_downloader has new code
        try:
            import inspect
            src = inspect.getsource(video_downloader.get_video_metadata)
            print(f"[Modal Worker] get_video_metadata source snippet:\n{src[:200]}")
        except Exception as e:
            print(f"[Modal Worker] Could not inspect source: {e}")
        
        # Write YouTube cookies file from base64-encoded secret
        cookie_path = "/tmp/youtube_cookies.txt"
        cookies_b64 = os.getenv("YOUTUBE_COOKIES_B64", "")
        if cookies_b64:
            import base64
            with open(cookie_path, "wb") as f:
                f.write(base64.b64decode(cookies_b64))
            print(f"[Modal Worker] YouTube cookies written to {cookie_path}")
            os.environ["YOUTUBE_COOKIE_FILE"] = cookie_path
        else:
            print("[Modal Worker] WARNING: No YouTube cookies found.")

        
        # 1. Download Video and Extract Transcript
        download_url = settings.get("download_url") if settings else None
        
        if download_url:
             print(f"[Modal Worker] Step 1: Using provided R2 download URL: {download_url}")
             # Download file manually
             import requests
             local_filename = os.path.join(temp_dir, "downloaded_video.mp4")
             with requests.get(download_url, stream=True) as r:
                 r.raise_for_status()
                 with open(local_filename, 'wb') as f:
                     for chunk in r.iter_content(chunk_size=8192):
                         f.write(chunk)
             
             # Fetch metadata/transcript using video_url (YouTube)
             print(f"[Modal Worker] Fetching metadata/transcript from YouTube: {video_url}")
             metadata = video_downloader.get_video_metadata(video_url)
             transcript = video_downloader.extract_transcript(video_url)
             
             video_data = video_downloader.VideoFile(
                 file_path=local_filename,
                 metadata=metadata,
                 transcript=transcript
             )
        else:
            print(f"[Modal Worker] Step 1: Downloading video from YouTube...")
            video_data = video_downloader.download_and_extract_all(video_url, output_dir=temp_dir)
        print(f"[Modal Worker] Video downloaded: {video_data.file_path}")
        print(f"[Modal Worker] Transcript length: {len(video_data.transcript)} chars")
        
        # 2. Analyze Video (Multimodal)
        print(f"[Modal Worker] Step 2: Analyzing video (Multimodal)...")
        hooks = ai_analyzer.analyze_video(video_data.file_path, video_data.transcript)
        print(f"[Modal Worker] Found {len(hooks)} viral hooks")
        
        if not hooks:
            print("[Modal Worker] No hooks found. Using fallback.")
            # Verify if ai_analyzer returns fallback data on empty
            # It currently returns mock data if API key missing, but if API works and returns empty list?
            # We proceed.
        
        # 3. Render Clips and Upload
        print(f"[Modal Worker] Step 3: Rendering & Uploading clips...")
        
        # Initialize R2 storage
        r2_storage = storage.R2Storage()
        
        uploaded_clips = []
        
        for i, hook in enumerate(hooks):
            print(f"[Modal Worker] Processing clip {i+1}/{len(hooks)}: {hook.type}")
            
            # Render the clip
            clip_filename = f"clip_{i}.mp4"
            clip_path = os.path.join(temp_dir, clip_filename)
            
            config = video_renderer.RenderConfig(
                output_width=settings.get("width", 1080),
                output_height=settings.get("height", 1920)
            )
            
            video_renderer.render_clip(
                input_video=video_data.file_path,
                output_path=clip_path,
                start_time=hook.start_time,
                end_time=hook.end_time,
                segments=[{'start': s.start, 'end': s.end} for s in hook.segments], # Convert ViralSegment to dict
                config=config
            )
            
            # Upload to R2
            public_url = r2_storage.upload_clip(
                file_path=clip_path,
                job_id=job_id,
                clip_index=i
            )
            
            # Prepare database record
            clip_record = {
                "project_id": project_id,
                "video_url": public_url, # R2 URL
                "transcript_segment": [
                    {"text": "Generated clip based on viral hook", "time": hook.start_time}
                ], # Simplified for now
                "start_time": hook.start_time,
                "end_time": hook.end_time,
                "virality_score": hook.virality_score,
                "title": f"{hook.type} ({int(hook.virality_score)}/100)",
                "status": "completed"
            }
            
            uploaded_clips.append(clip_record)
        
        # 4. Save to Database
        if uploaded_clips:
            print(f"[Modal Worker] Inserting {len(uploaded_clips)} clips into database...")
            supabase.table("clips").insert(uploaded_clips).execute()
            
        # Update project status
        if project_id:
            supabase.table("projects").update({"status": "completed"}).eq("id", project_id).execute()
            
        # Update job status
        update_job_status("completed")
        print(f"[Modal Worker] Job completed successfully!")
        
        return {"success": True, "clips_count": len(uploaded_clips)}

    except Exception as e:
        print(f"[Modal Worker] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        update_job_status("failed", error=str(e))
        if project_id:
             supabase.table("projects").update({"status": "failed"}).eq("id", project_id).execute()
        return {"success": False, "error": str(e)}
        
    finally:
        # Cleanup
        print(f"[Modal Worker] Cleaning up temp directory: {temp_dir}")
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("ncliper-supabase"),
        modal.Secret.from_name("ncliper-redis"),
        modal.Secret.from_name("ncliper-r2"),
        modal.Secret.from_name("ncliper-gemini"),
        modal.Secret.from_name("ncliper-youtube-cookies")
    ]
)
@modal.web_endpoint(method="POST")
def process_video_app(item: Dict):
    """
    Web endpoint wrapper for process_video
    Expects JSON body: { "job_id": "...", "project_id": "...", "video_url": "...", "settings": {...} }
    """
    job_id = item.get("job_id")
    project_id = item.get("project_id")
    video_url = item.get("video_url")
    settings = item.get("settings", {})
    
    if not job_id or not video_url:
        return {"error": "Missing job_id or video_url"}, 400
        
    # Spawn the heavy processing function in the background
    process_video.spawn(job_id, project_id, video_url, settings)
    
    return {"status": "started", "job_id": job_id}
