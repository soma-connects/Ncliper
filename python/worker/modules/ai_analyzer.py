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
class ViralHook:
    """Viral moment detected in video"""
    start_time: float  # Overall start (min of segments)
    end_time: float    # Overall end (max of segments)
    segments: List[ViralSegment]  # Specific cuts to merge
    virality_score: int  # 0-100
    type: str  # "Pattern Interrupt", "High-Retention Hook", etc.


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
        # Model strategy (matching TypeScript):
        # 1. Try gemini-2.0-flash (primary)
        # 2. Fallback to gemini-flash-latest
        
        primary_model_name = "gemini-2.0-flash"
        fallback_model_name = "gemini-flash-latest"
        
        # Prompt (matching TypeScript virality.ts)
        import random
        prompt = f"""
You are a Viral Content Strategist for Ncliper. Analyze this transcript to find exactly 3 viral segments suitable for Long-Form Shorts/Reels.

CRITICAL "INTELLIGENT MERGING" RULES:
- You can (and should) MERGE disparate parts of the video if they form a stronger narrative.
- Example: A video has a Setup (0:00-0:30), then boring fluff, then a Payoff (2:00-2:30).
- Return this as ONE hook with `segments: [{{"start": 0, "end": 30}}, {{"start": 120, "end": 150}}]`.
- The total duration of all segments combined must be between 60 and 180 seconds.

**VIRALITY RUBRIC (Scoring 0-100):**
1. **Hook Strength (40%)**: Does the first 3 seconds grab attention? (e.g. "I almost died...", "You won't believe...", "The secret to...")
2. **Pacing (30%)**: Is the content dense? (Remove pauses, filler words, slow transitions = High Pacing)
3. **Emotional/Intellectual Value (30%)**: Does it trigger curiosity, anger, awe, or provide high utility?

**PRECISION RULE**: 
- Segments MUST start at the beginning of a complete sentence or a clear visual cut. 
- Do NOT start mid-sentence. 
- Verify timestamp precision to 0.1s.

Content Types:
1. "The Deep Dive": Explain a concept fully. (Hormozi Style: Hook -> Value -> Value -> CTA)
2. "The Story Arc": Setup -> Conflict -> Resolution. (MrBeast Style: High stakes immediately)
3. "The Contrarian Argument": Premise -> Evidence -> Conclusion.

Transcript: "{transcript[:20000]}"

Return ONLY a JSON array following the requested schema. Ensure `segments` contains the precise cuts.

[Random Seed: {random.random()}]
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
            
            hooks.append(ViralHook(
                start_time=hook_dict["start_time"],
                end_time=hook_dict["end_time"],
                segments=segments,
                virality_score=hook_dict["virality_score"],
                type=hook_dict["type"]
            ))
        
        print(f"[AI] Found {len(hooks)} viral hooks")
        return hooks
        
    except Exception as e:
        print(f"[AI] Virality Engine Error: {e}")
        raise Exception(f"Failed to analyze transcript: {str(e)}")


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
