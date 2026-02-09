"""
Test script for AI analyzer module
Tests Gemini-based viral hook detection
"""

import sys
import os

# Add modules to path
sys.path.insert(0, os.path.dirname(__file__))

from modules.video_downloader import extract_transcript
from modules.ai_analyzer import analyze_transcript

# Test URL - Rick Astley (short, has clear hooks)
TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

print("="*60)
print("Testing AI Analyzer Module")
print("="*60)

try:
    # Step 1: Get transcript
    print("\n[1/2] Extracting transcript...")
    transcript = extract_transcript(TEST_URL)
    print(f"✅ Got transcript: {len(transcript)} characters")
    
    # Step 2: Analyze for viral hooks
    print("\n[2/2] Analyzing with Gemini...")
    hooks = analyze_transcript(transcript)
    
    print(f"\n✅ Found {len(hooks)} viral hooks:\n")
    
    for i, hook in enumerate(hooks, 1):
        print(f"Hook #{i}: {hook.type}")
        print(f"  ├─ Virality Score: {hook.virality_score}/100")
        print(f"  ├─ Duration: {hook.start_time:.1f}s - {hook.end_time:.1f}s ({hook.end_time - hook.start_time:.1f}s)")
        print(f"  └─ Segments: {len(hook.segments)}")
        for j, seg in enumerate(hook.segments, 1):
            print(f"      └─ Segment {j}: {seg.start:.1f}s - {seg.end:.1f}s ({seg.end - seg.start:.1f}s)")
        print()
    
    print("="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    
except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
