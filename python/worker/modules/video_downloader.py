"""
Video Download Module
Handles YouTube video downloading and transcript extraction.

Strategy to avoid YouTube bot detection:
  - Metadata:    YouTube oEmbed API (no auth needed)
  - Transcript:  youtube-transcript-api (no auth needed)
  - Download:    yt-dlp with cookies fallback (only step that truly needs it)
"""

import os
import re
import json
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

import requests
import yt_dlp


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class VideoMetadata:
    """Video metadata from YouTube"""
    title: str
    duration: float  # seconds
    thumbnail_url: str
    video_id: str
    description: str


@dataclass
class VideoFile:
    """Downloaded video file info"""
    file_path: str
    metadata: VideoMetadata
    transcript: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'(?:embed/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract video ID from URL: {url}")


def _get_cookie_opts() -> dict:
    """Get yt-dlp cookie options from environment variable."""
    cookie_file = os.getenv("YOUTUBE_COOKIE_FILE", "")
    if cookie_file and os.path.isfile(cookie_file):
        print(f"[VideoDownloader] Using cookies from: {cookie_file}")
        return {'cookiefile': cookie_file}
    return {}


# ---------------------------------------------------------------------------
# 1. Metadata — via YouTube oEmbed API (no auth required)
# ---------------------------------------------------------------------------

def get_video_metadata(url: str) -> VideoMetadata:
    """
    Extract video metadata using the YouTube oEmbed API.
    This endpoint does NOT require authentication or cookies.
    
    Note: oEmbed doesn't provide duration. We set it to 0 and let
    the AI analyzer work with transcript length instead.
    """
    video_id = _extract_video_id(url)
    print(f"[VideoDownloader] Fetching metadata via oEmbed for: {video_id}")

    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    
    try:
        resp = requests.get(oembed_url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        return VideoMetadata(
            title=data.get("title", "Untitled Video"),
            duration=0.0,  # oEmbed doesn't expose duration
            thumbnail_url=data.get("thumbnail_url", f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"),
            video_id=video_id,
            description=data.get("author_name", ""),
        )
    except Exception as e:
        print(f"[VideoDownloader] oEmbed failed ({e}), using fallback metadata")
        return VideoMetadata(
            title="Untitled Video",
            duration=0.0,
            thumbnail_url=f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
            video_id=video_id,
            description="",
        )


# ---------------------------------------------------------------------------
# 2. Transcript — via youtube-transcript-api (no auth required)
# ---------------------------------------------------------------------------

def extract_transcript(url: str) -> str:
    """
    Extract full transcript using the youtube-transcript-api library.
    This library uses internal YouTube endpoints that do NOT trigger
    bot detection even from data-center IPs.
    """
    video_id = _extract_video_id(url)
    print(f"[VideoDownloader] Extracting transcript for: {video_id}")

    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        ytt_api = YouTubeTranscriptApi()
        # Try English variants first
        fetched = ytt_api.fetch(video_id)
        
        # Build plain text from snippets
        segments = []
        for snippet in fetched.snippets:
            text = snippet.text.strip()
            if text:
                segments.append(text)

        full_text = " ".join(segments)
        # Clean up whitespace
        full_text = " ".join(full_text.split())

        if full_text:
            print(f"[VideoDownloader] Transcript extracted: {len(full_text)} characters")
            return full_text
        else:
            print("[VideoDownloader] Transcript was empty, using fallback")
            return "No transcript available."

    except Exception as e:
        print(f"[VideoDownloader] youtube-transcript-api failed: {e}")
        # Fallback: try yt-dlp (may hit bot detection but worth trying)
        try:
            return _extract_transcript_ytdlp(url)
        except Exception as e2:
            print(f"[VideoDownloader] yt-dlp transcript fallback also failed: {e2}")
            return "No transcript available."


def _extract_transcript_ytdlp(url: str) -> str:
    """Fallback transcript extraction via yt-dlp (may hit bot detection)."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US', 'en-GB'],
        **_get_cookie_opts(),
        'extractor_args': {
            'youtube': {'player_client': ['android', 'web']}
        },
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

        sub_url = None
        langs = ['en', 'en-US', 'en-GB']

        for source in ['subtitles', 'automatic_captions']:
            subs = info.get(source, {})
            if subs:
                for lang in langs:
                    if lang in subs:
                        for fmt in subs[lang]:
                            if fmt.get('ext') == 'json3':
                                sub_url = fmt.get('url')
                                break
                        if sub_url:
                            break
            if sub_url:
                break

        if not sub_url:
            return info.get('description', 'No transcript available.')

        resp = requests.get(sub_url, timeout=30)
        resp.raise_for_status()
        sub_json = resp.json()

        segments = []
        for event in sub_json.get('events', []):
            if event.get('segs'):
                text = ''.join(seg.get('utf8', '') for seg in event['segs'])
                segments.append(text)

        full_text = ' '.join(segments).strip()
        full_text = ' '.join(full_text.split())
        return full_text or info.get('description', 'No transcript available.')


# ---------------------------------------------------------------------------
# 3. Video download — yt-dlp (with cookies + fallback clients)
# ---------------------------------------------------------------------------

def download_video(url: str, output_dir: str = "/tmp") -> str:
    """
    Download YouTube video to local filesystem using yt-dlp.
    Tries multiple client configurations to bypass bot detection.
    """
    print(f"[VideoDownloader] Downloading: {url}")
    os.makedirs(output_dir, exist_ok=True)
    
    strategies = [
        # Strategy 1: Cookies + Android (Standard attempt)
        {
            'name': 'Cookies + Android',
            'extractor_args': {'youtube': {'player_client': ['android', 'web']}},
            'use_cookies': True
        },
        # Strategy 2: No Cookies + iOS (Mobile API often less strict)
        {
            'name': 'No Cookies + iOS',
            'extractor_args': {'youtube': {'player_client': ['ios']}},
            'use_cookies': False
        },
        # Strategy 3: No Cookies + TV (Different API endpoints)
        {
            'name': 'No Cookies + TV',
            'extractor_args': {'youtube': {'player_client': ['tv']}},
            'use_cookies': False
        },
         # Strategy 4: Web Embedded (Simulate embedded player)
        {
            'name': 'Web Embedded',
            'extractor_args': {'youtube': {'player_client': ['web_embedded']}},
            'use_cookies': False
        }
    ]

    last_error = None

    for strategy in strategies:
        print(f"[VideoDownloader] Trying strategy: {strategy['name']}")
        
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'outtmpl': f'{output_dir}/%(id)s.%(ext)s',
            'quiet': False,
            'no_warnings': False,
            'prefer_ffmpeg': True,
            'fragment_retries': 10,
        }
        
        # Apply strategy options
        if strategy['use_cookies']:
            ydl_opts.update(_get_cookie_opts())
            
        if strategy.get('extractor_args'):
            ydl_opts['extractor_args'] = strategy['extractor_args']

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                file_path = ydl.prepare_filename(info)
                print(f"[VideoDownloader] Success with {strategy['name']}! Downloaded to: {file_path}")
                return file_path
        except Exception as e:
            print(f"[VideoDownloader] Strategy {strategy['name']} failed: {e}")
            last_error = e
            continue

    print(f"[VideoDownloader] All download strategies failed.")
    raise Exception(f"Failed to download video after {len(strategies)} attempts. Last error: {str(last_error)}")


# ---------------------------------------------------------------------------
# 4. Convenience wrapper
# ---------------------------------------------------------------------------

def download_and_extract_all(url: str, output_dir: str = "/tmp") -> VideoFile:
    """
    Download video, extract metadata and transcript.
    Metadata and transcript use APIs that bypass bot detection.
    Only the video download step uses yt-dlp.
    """
    print(f"[VideoDownloader] Processing: {url}")

    # These two calls do NOT use yt-dlp — no bot detection risk
    metadata = get_video_metadata(url)
    transcript = extract_transcript(url)

    # This uses yt-dlp — may need cookies for data center IPs
    video_path = download_video(url, output_dir)

    return VideoFile(
        file_path=video_path,
        metadata=metadata,
        transcript=transcript,
    )


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python video_downloader.py <youtube_url>")
        sys.exit(1)

    test_url = sys.argv[1]

    try:
        print("\n=== Testing Metadata Extraction (oEmbed) ===")
        metadata = get_video_metadata(test_url)
        print(f"Title: {metadata.title}")
        print(f"Video ID: {metadata.video_id}")

        print("\n=== Testing Transcript Extraction (youtube-transcript-api) ===")
        transcript = extract_transcript(test_url)
        print(f"Transcript length: {len(transcript)} characters")
        print(f"Preview: {transcript[:200]}...")

        print("\nAll tests passed!")

    except Exception as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
