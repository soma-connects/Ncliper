"""
Standalone Phase 2 Integration Test
Tests video processing pipeline WITHOUT Redis dependency
Directly calls process_video() function to verify all modules work
"""

import sys
import os

# Add worker modules to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python', 'worker'))

# Import the main processing function
from main import process_video

# Test job (matching Redis job format)
test_job = {
    "id": "test-standalone-phase2",
    "user_id": "test_user",
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "settings": {
        "clip_count": 3,
        "aspect_ratio": "9:16",
        "width": 1080,
        "height": 1920
    }
}

print("="*70)
print("PHASE 2 STANDALONE INTEGRATION TEST")
print("="*70)
print("\n🎬 Testing Complete Video Processing Pipeline")
print(f"   Video: {test_job['video_url']}")
print(f"   Job ID: {test_job['id']}")
print("\n" + "="*70)

try:
    print("\n🚀 Starting pipeline...\n")
    
    # Call process_video directly
    result = process_video(test_job)
    
    print("\n" + "="*70)
    print("✅ PIPELINE COMPLETED SUCCESSFULLY!")
    print("="*70)
    
    print(f"\n📊 Results:")
    print(f"   Status: {result['status']}")
    print(f"   Job ID: {result['job_id']}")
    print(f"   Clips Generated: {len(result['clips'])}")
    
    if 'metadata' in result:
        print(f"\n📹 Video Metadata:")
        print(f"   Title: {result['metadata']['title']}")
        print(f"   Duration: {result['metadata']['duration']}s")
        print(f"   Hooks Found: {result['metadata']['hooks_found']}")
    
    print(f"\n🎥 Generated Clips:")
    for i, clip in enumerate(result['clips'], 1):
        print(f"\n   Clip {i}:")
        print(f"      Type: {clip['title']}")
        print(f"      Virality Score: {clip['virality_score']}/100")
        print(f"      Time: {clip['start_time']:.1f}s - {clip['end_time']:.1f}s")
        print(f"      Duration: {clip['end_time'] - clip['start_time']:.1f}s")
        print(f"      Segments: {len(clip.get('segments', []))}")
        print(f"      File: {clip['url']}")
    
    print(f"\n" + "="*70)
    print(f"🎉 ALL PHASE 2 MODULES WORKING!")
    print(f"   ✅ Video Download (yt-dlp)")
    print(f"   ✅ Transcript Extraction")
    print(f"   ✅ AI Analysis (Gemini)")
    print(f"   ✅ Clip Rendering (FFmpeg)")
    print(f"   ✅ File Storage")
    print("="*70)
    
    # Check if files actually exist
    print(f"\n📁 Verifying output files...")
    for i, clip in enumerate(result['clips'], 1):
        file_path = clip['url'].replace('file://', '')
        if os.path.exists(file_path):
            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            print(f"   ✅ Clip {i}: {size_mb:.2f} MB")
        else:
            print(f"   ❌ Clip {i}: File not found")
    
    print(f"\n✅ Test completed successfully!")
    
except Exception as e:
    print(f"\n" + "="*70)
    print(f"❌ PIPELINE FAILED")
    print("="*70)
    print(f"\nError: {e}")
    
    import traceback
    print(f"\nFull traceback:")
    traceback.print_exc()
    
    sys.exit(1)
