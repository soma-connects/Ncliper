"""
Video Download Module
Handles YouTube video downloading and transcript extraction using yt-dlp
Ported from TypeScript actions.ts
"""

import os
import json
from typing import Dict, Any, Optional
from dataclasses import dataclass
import yt_dlp


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


def download_video(url: str, output_dir: str = "/tmp") -> str:
    """
    Download YouTube video to local filesystem
    
    Args:
        url: YouTube video URL
        output_dir: Directory to save video (default: /tmp for serverless)
    
    Returns:
        Absolute path to downloaded video file
    
    Raises:
        Exception: If download fails
    """
    print(f"[VideoDownloader] Downloading: {url}")
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    ydl_opts = {
        'format': 'best[ext=mp4]/best',  # Prefer MP4, fallback to best
        'outtmpl': f'{output_dir}/%(id)s.%(ext)s',
        'quiet': False,
        'no_warnings': False,
        'prefer_ffmpeg': True,
        # Network resilience options
        'socket_timeout': 60,  # 60 second socket timeout
        'retries': 10,  # Retry up to 10 times
        'fragment_retries': 10,  # Retry fragments
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            file_path = ydl.prepare_filename(info)
            
            print(f"[VideoDownloader] Downloaded to: {file_path}")
            return file_path
            
    except Exception as e:
        print(f"[VideoDownloader] Error downloading video: {e}")
        raise Exception(f"Failed to download video: {str(e)}")


def get_video_metadata(url: str) -> VideoMetadata:
    """
    Extract video metadata without downloading
    
    Args:
        url: YouTube video URL
    
    Returns:
        VideoMetadata object with title, duration, etc.
    """
    print(f"[VideoDownloader] Fetching metadata for: {url}")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            return VideoMetadata(
                title=info.get('title', 'Unknown'),
                duration=float(info.get('duration', 0)),
                thumbnail_url=info.get('thumbnail', ''),
                video_id=info.get('id', ''),
                description=info.get('description', '')
            )
            
    except Exception as e:
        print(f"[VideoDownloader] Error fetching metadata: {e}")
        raise Exception(f"Failed to fetch metadata: {str(e)}")


def extract_transcript(url: str) -> str:
    """
    Extract full transcript from YouTube video
    Ported from TypeScript fetchTranscript() in actions.ts
    
    Args:
        url: YouTube video URL
    
    Returns:
        Full transcript as plain text
    
    Raises:
        Exception: If transcript extraction fails
    """
    print(f"[VideoDownloader] Extracting transcript for: {url}")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US', 'en-GB'],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Try to find JSON3 subtitle URL (best for word-level timing)
            sub_url = None
            langs = ['en', 'en-US', 'en-GB']
            
            # Priority 1: Manual subtitles
            if info.get('subtitles'):
                for lang in langs:
                    if lang in info['subtitles']:
                        for fmt in info['subtitles'][lang]:
                            if fmt.get('ext') == 'json3':
                                sub_url = fmt.get('url')
                                break
                        if sub_url:
                            break
            
            # Priority 2: Auto-generated captions
            if not sub_url and info.get('automatic_captions'):
                for lang in langs:
                    if lang in info['automatic_captions']:
                        for fmt in info['automatic_captions'][lang]:
                            if fmt.get('ext') == 'json3':
                                sub_url = fmt.get('url')
                                break
                        if sub_url:
                            break
            
            # Fallback: Use description if no subtitles found
            if not sub_url:
                print("[VideoDownloader] No subtitles found, using description")
                return info.get('description', 'No transcript available.')
            
            # Fetch and parse JSON3 subtitle content
            print(f"[VideoDownloader] Downloading subtitles from: {sub_url}")
            import requests
            response = requests.get(sub_url)
            response.raise_for_status()
            
            sub_json = response.json()
            
            # Parse JSON3 format to plain text
            # Format: { events: [ { tStartMs, dDurationMs, segs: [ { utf8: "text" } ] } ] }
            full_text = ""
            if sub_json.get('events'):
                segments = []
                for event in sub_json['events']:
                    if event.get('segs'):
                        text = ''.join(seg.get('utf8', '') for seg in event['segs'])
                        segments.append(text)
                
                full_text = ' '.join(segments).strip()
                # Clean up whitespace
                full_text = ' '.join(full_text.split())
            
            if not full_text:
                return info.get('description', 'No transcript available.')
            
            print(f"[VideoDownloader] Transcript extracted: {len(full_text)} characters")
            return full_text
            
    except Exception as e:
        print(f"[VideoDownloader] Error extracting transcript: {e}")
        raise Exception(f"Failed to extract transcript: {str(e)}")


def download_and_extract_all(url: str, output_dir: str = "/tmp") -> VideoFile:
    """
    Convenience function to download video, extract metadata and transcript
    
    Args:
        url: YouTube video URL
        output_dir: Directory to save video
    
    Returns:
        VideoFile object with all information
    """
    print(f"[VideoDownloader] Processing: {url}")
    
    # Get metadata first (lightweight)
    metadata = get_video_metadata(url)
    
    # Extract transcript (no video download needed)
    transcript = extract_transcript(url)
    
    # Download video file
    video_path = download_video(url, output_dir)
    
    return VideoFile(
        file_path=video_path,
        metadata=metadata,
        transcript=transcript
    )


# Test function for development
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python video_downloader.py <youtube_url>")
        sys.exit(1)
    
    test_url = sys.argv[1]
    
    try:
        # Test metadata extraction
        print("\n=== Testing Metadata Extraction ===")
        metadata = get_video_metadata(test_url)
        print(f"Title: {metadata.title}")
        print(f"Duration: {metadata.duration}s")
        print(f"Video ID: {metadata.video_id}")
        
        # Test transcript extraction
        print("\n=== Testing Transcript Extraction ===")
        transcript = extract_transcript(test_url)
        print(f"Transcript length: {len(transcript)} characters")
        print(f"Preview: {transcript[:200]}...")
        
        # Test full download (optional - comment out to skip)
        # print("\n=== Testing Video Download ===")
        # video_path = download_video(test_url)
        # print(f"Downloaded to: {video_path}")
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
