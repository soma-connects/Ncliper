"""
Test script for video_downloader module
Tests metadata and transcript extraction without full video download
"""

import sys
import os

# Add modules to path
sys.path.insert(0, os.path.dirname(__file__))

from modules.video_downloader import get_video_metadata, extract_transcript

# Test URL - short video
TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

print("="*60)
print("Testing Video Downloader Module")
print("="*60)

try:
    # Test 1: Metadata Extraction
    print("\n[1/2] Testing Metadata Extraction...")
    metadata = get_video_metadata(TEST_URL)
    print(f"✅ Title: {metadata.title}")
    print(f"✅ Duration: {metadata.duration}s ({metadata.duration/60:.1f} minutes)")
    print(f"✅ Video ID: {metadata.video_id}")
    print(f"✅ Thumbnail: {metadata.thumbnail_url[:50]}...")
    
    # Test 2: Transcript Extraction
    print("\n[2/2] Testing Transcript Extraction...")
    transcript = extract_transcript(TEST_URL)
    print(f"✅ Transcript Length: {len(transcript)} characters")
    print(f"✅ Preview (first 200 chars):")
    print(f"   {transcript[:200]}...")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    
except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
