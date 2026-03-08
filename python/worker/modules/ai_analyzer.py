"""
AI Analysis Module
Analyzes transcripts with Google Gemini to identify viral hooks
Ported from TypeScript virality.ts
"""

import os
import time
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from google import generativeai as genai


# Initialize Gemini API
API_KEY = os.getenv("GOOGLE_API_KEY", "")
if API_KEY:
    genai.configure(api_key=API_KEY)


@dataclass
class ViralSegment:
    """Individual time segment within a viral hook"""
    start: float  # seconds
    end: float    # seconds

@dataclass
class SpeakerTimelineSegment:
    """Timeline segment indicating speaker position"""
    start_time: float
    end_time: float
    position: float


@dataclass
class ViralHook:
    """Viral moment detected in video"""
    start_time: float  # Overall start (min of segments)
    end_time: float    # Overall end (max of segments)
    segments: List[ViralSegment]  # Specific cuts to merge
    virality_score: int  # 0-100
    type: str  # "Pattern Interrupt", "High-Retention Hook", etc.
    speaker_timeline: Optional[List[SpeakerTimelineSegment]] = None


# Gemini response schema (matching TypeScript)
HOOK_SCHEMA = {
    "description": "List of viral hooks found in the video",
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "start_time": {
                "type": "NUMBER",
                "description": "Start time of the entire sequence in seconds",
                "nullable": False,
            },
            "end_time": {
                "type": "NUMBER",
                "description": "End time of the entire sequence in seconds",
                "nullable": False,
            },
            "segments": {
                "type": "ARRAY",
                "description": "List of specific time ranges to stitch together",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "start": {"type": "NUMBER", "nullable": False},
                        "end": {"type": "NUMBER", "nullable": False}
                    },
                    "required": ["start", "end"]
                },
                "nullable": False
            },
            "virality_score": {
                "type": "NUMBER",
                "description": "Score from 0 to 100 indicating viral potential",
                "nullable": False,
            },
            "type": {
                "type": "STRING",
                "description": "Type of hook: 'Pattern Interrupt', 'High-Retention Hook', etc.",
                "nullable": False
            },
            "speaker_timeline": {
                "type": "ARRAY",
                "description": "Timeline of active speaker positions (0.0=left, 0.5=center, 1.0=right)",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "start_time": {"type": "NUMBER", "nullable": False},
                        "end_time": {"type": "NUMBER", "nullable": False},
                        "position": {"type": "NUMBER", "nullable": False}
                    },
                    "required": ["start_time", "end_time", "position"]
                },
                "nullable": True
            }
        },
        "required": ["start_time", "end_time", "segments", "virality_score", "type"],
    },
}


def generate_with_retry(
    model: Any, 
    prompt: str, 
    retries: int = 3, 
    delay: float = 1.0
) -> Any:
    """
    Generate content with exponential backoff retry logic
    Handles 429 rate limits from Gemini API
    
    Args:
        model: Gemini model instance
        prompt: Prompt text
        retries: Number of retries remaining
        delay: Initial delay in seconds
    
    Returns:
        Gemini API response
    
    Raises:
        Exception: If all retries exhausted or non-retryable error
    """
    try:
        return model.generate_content(prompt)
        
    except Exception as error:
        error_msg = str(error).lower()
        
        # Check if it's a rate limit error (429)
        if retries > 0 and ('429' in error_msg or 'rate' in error_msg):
            wait_time = delay
            
            # Safety: If wait time > 20s, fail fast to avoid serverless timeouts
            if wait_time > 20:
                print(f"[AI] Rate limit. Required wait {wait_time}s exceeds timeout safety.")
                raise Exception(f"Rate limit exceeded. Please try again in {int(wait_time)} seconds.")
            
            print(f"[AI] Gemini API 429 Rate Limit. Retrying in {wait_time}s... ({retries} retries left)")
            time.sleep(wait_time)
            return generate_with_retry(model, prompt, retries - 1, delay * 2)
        
        # Non-retryable error
        raise error


def analyze_transcript(transcript: str) -> List[ViralHook]:
    """
    Analyze transcript with Gemini to find viral hooks
    
    Args:
        transcript: Full video transcript text
    
    Returns:
        List of ViralHook objects with timestamps and scores
    
    Raises:
        Exception: If analysis fails
    """
    if not API_KEY:
        print("[AI] WARNING: GOOGLE_API_KEY not set. Returning mock data.")
        # Mock data for development
        return [
            ViralHook(
                start_time=0,
                end_time=20,
                segments=[ViralSegment(start=0, end=5), ViralSegment(start=15, end=20)],
                virality_score=85,
                type="Pattern Interrupt"
            )
        ]
    
    try:
        # Model strategy:
        # 1. Try gemini-2.0-flash (fast, cheap, good for long context)
        # 2. Fallback to gemini-2.5-flash (if higher reasoning needed)
        
        primary_model_name = "gemini-2.0-flash"
        fallback_model_name = "gemini-2.5-flash"
        
        # Enhanced Virality Prompt
        import random
        prompt = f"""
You are the Lead Viral Strategist for Ncliper. Your goal is to extract **High-Retention Short-Form Content** from this transcript.

**TARGET AUDIENCE:** 
Gen Z / Millennials on TikTok, Reels, and Shorts. 
They have a 3-second attention span.

**CORE REQUIREMENT:**
Find segments that can stand alone as complete mini-stories or value bombs.

**HOOK TYPES TO FIND:**
1.  **The "Pattern Interrupt"**: Moments that break the expected flow or startle the viewer.
2.  **The "Curiosity Gap"**: Statements that beg a question (e.g., "I never thought this would happen...").
3.  **The "Value Bomb"**: Concise, actionable advice delivered with conviction.
4.  **The "Story Climax"**: High-stakes moment or emotional peak.

**INTELLIGENT MERGING:**
-   Merge widely separated sentences if they form a coherent narrative.
-   Example: Intro (0:10) + Conclusion (5:45) = 1 powerful clip.
-   Total duration MUST be 15-60 seconds (ideal for Shorts).

**SPEAKER DIARIZATION (CRITICAL FOR PODCASTS)**:
- If there are multiple active speakers (e.g., a podcast format), you must generate a `speaker_timeline`.
- For each segment, output the `start_time` and `end_time` of who is actively talking, and their `position` on screen.
- `position` values MUST be:
    - `0.0` if the speaker is on the LEFT side of the screen.
    - `1.0` if the speaker is on the RIGHT side of the screen.
    - `0.5` if there is only one center speaker, or both are speaking/visible center.
- The sum of `speaker_timeline` segments must cover the entire combined duration of the `segments`.

**SCORING RUBRIC (0-100):**
-   **90-100**: Guaranteed viral. Perfect hook, zero fluff, high emotion/value.
-   **80-89**: Strong. Good hook, standard pacing.
-   **70-79**: Decent. Usable but needs heavy editing.
-   **<70**: Ignore.

**TRANSCRIPT:**
"{transcript[:30000]}"

**OUTPUT:**
Return a strict JSON array of objects adhering to the `ViralHook` schema. 
Ensure timestamps are PRECISE.
"""
        
        # Try primary model
        try:
            print(f"[AI] Analyzing with {primary_model_name}...")
            primary_model = genai.GenerativeModel(
                model_name=primary_model_name,
                generation_config={
                    "response_mime_type": "application/json",
                    "response_schema": HOOK_SCHEMA,
                }
            )
            
            result = generate_with_retry(primary_model, prompt, retries=1)
            response_text = result.text
            
        except Exception as e:
            print(f"[AI] {primary_model_name} failed. Falling back to {fallback_model_name}... ({str(e)})")
            
            # Fallback model
            fallback_model = genai.GenerativeModel(
                model_name=fallback_model_name,
                generation_config={
                    "response_mime_type": "application/json",
                    "response_schema": HOOK_SCHEMA,
                }
            )
            
            result = generate_with_retry(fallback_model, prompt, retries=1)
            response_text = result.text
        
        # Parse response
        hooks_data = json.loads(response_text)
        
        # Convert to ViralHook objects
        hooks = []
        for hook_dict in hooks_data:
            segments = [
                ViralSegment(start=seg["start"], end=seg["end"]) 
                for seg in hook_dict["segments"]
            ]
            
            speaker_timeline = None
            if "speaker_timeline" in hook_dict and hook_dict["speaker_timeline"]:
                speaker_timeline = [
                    SpeakerTimelineSegment(
                        start_time=st["start_time"], 
                        end_time=st["end_time"], 
                        position=st["position"]
                    ) for st in hook_dict["speaker_timeline"]
                ]
            
            hooks.append(ViralHook(
                start_time=hook_dict["start_time"],
                end_time=hook_dict["end_time"],
                segments=segments,
                virality_score=hook_dict["virality_score"],
                type=hook_dict["type"],
                speaker_timeline=speaker_timeline
            ))
        
        
        print(f"[AI] Found {len(hooks)} viral hooks")
        return hooks
        
    except Exception as e:
        print(f"[AI] Virality Engine Error: {e}")
        raise Exception(f"Failed to analyze transcript: {str(e)}")


def upload_video_for_analysis(video_path: str):
    """
    Upload video to Google AI Studio for multimodal analysis
    """
    if not API_KEY:
        print("[AI] No API Key, skipping upload.")
        return None
        
    print(f"[AI] Uploading video {video_path} to Gemini...")
    video_file = genai.upload_file(path=video_path)
    print(f"[AI] Upload complete: {video_file.name}")
    
    # Poll for processing completion
    while video_file.state.name == "PROCESSING":
        print("[AI] Waiting for video processing...", end=' ', flush=True)
        time.sleep(5)
        video_file = genai.get_file(video_file.name)
    
    if video_file.state.name == "FAILED":
        raise Exception("Video processing failed in Gemini")
        
    print(f"\n[AI] Video is active and ready for analysis.")
    return video_file

def analyze_video(video_path: str, transcript: str = "") -> List[ViralHook]:
    """
    Analyze video VISUALLY with Gemini Multimodal Flash
    Falls back to transcript-only if upload fails
    """
    if not API_KEY:
        return analyze_transcript(transcript)

    try:
        # 1. Upload Video
        video_file = upload_video_for_analysis(video_path)
        if not video_file:
            if transcript and transcript != "No transcript available.":
                return analyze_transcript(transcript)
            return [] # Full failure: No video upload, no transcript

        # 2. Prepare Multimodal Prompt
        prompt = """
You are a Lead Viral Strategist. Watch this video and identify exactly 3 viral segments.

**ANALYSIS GOAL:**
Find moments where the VISUAL action matches the AUDIO hook. 
- Look for: Facial expressions, physical action, scene changes, on-screen text.
- Avoid: Static talking heads with no emotion.

**VIRALITY RUBRIC (Scoring 0-100):**
1. **Visual Hook (40%)**: Does something happen on screen?
2. **Audio Hook (30%)**: Is the sentence gripping?
3. **Pacing (30%)**: Is there movement/energy?

**OUTPUT FORMAT:**
Return strict JSON array of hooks (same schema as before).
Ensure timestamps are accurate to what you SEE and HEAR.
"""
        # 3. Call Gemini Flash Latest
        model_name = "gemini-flash-latest"
        print(f"[AI] Analyzing video with {model_name}...")
        
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": HOOK_SCHEMA,
            }
        )
        
        # Pass both video file and prompt
        response = model.generate_content(
            [video_file, prompt],
            request_options={"timeout": 600}
        )
        
        # 4. Parse Response
        hooks_data = json.loads(response.text)
        
        hooks = []
        for hook_dict in hooks_data:
            segments = [
                ViralSegment(start=seg["start"], end=seg["end"]) 
                for seg in hook_dict["segments"]
            ]
            
            speaker_timeline = None
            if "speaker_timeline" in hook_dict and hook_dict["speaker_timeline"]:
                speaker_timeline = [
                    SpeakerTimelineSegment(
                        start_time=st["start_time"], 
                        end_time=st["end_time"], 
                        position=st["position"]
                    ) for st in hook_dict["speaker_timeline"]
                ]
            
            hooks.append(ViralHook(
                start_time=hook_dict["start_time"],
                end_time=hook_dict["end_time"],
                segments=segments,
                virality_score=hook_dict["virality_score"],
                type=hook_dict.get("type", "Visual Hook"),
                speaker_timeline=speaker_timeline
            ))
            
        print(f"[AI] Found {len(hooks)} multimodal hooks!")
        
        # Cleanup
        print(f"[AI] Deleting remote file {video_file.name}")
        genai.delete_file(video_file.name)
        
        return hooks

    except Exception as e:
        print(f"[AI] Multimodal analysis failed: {e}")
        print("[AI] Falling back to transcript-only analysis...")
        return analyze_transcript(transcript)



# Test function
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python ai_analyzer.py <transcript_text>")
        sys.exit(1)
    
    test_transcript = sys.argv[1]
    
    try:
        print("=== Testing AI Analyzer ===")
        hooks = analyze_transcript(test_transcript)
        
        for i, hook in enumerate(hooks, 1):
            print(f"\nHook {i}:")
            print(f"  Type: {hook.type}")
            print(f"  Score: {hook.virality_score}/100")
            print(f"  Time: {hook.start_time}s - {hook.end_time}s")
            print(f"  Segments: {len(hook.segments)}")
            for j, seg in enumerate(hook.segments, 1):
                print(f"    Segment {j}: {seg.start}s - {seg.end}s")
        
        print("\n✅ Test passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
