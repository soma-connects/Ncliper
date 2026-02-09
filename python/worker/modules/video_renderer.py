"""
Video Renderer Module
Generates video clips using FFmpeg with face tracking, captions, and cropping
Handles FFmpeg-based clip generation with intelligent cropping and segment merging
"""

import subprocess
import json
import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import tempfile

# Phase 3: Face tracking (currently not used)
# import sys
# sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))
# from python.video.face_tracker import FaceTracker, CropParams


@dataclass
class RenderConfig:
    """Video encoding configuration"""
    output_width: int = 1080
    output_height: int = 1920
    codec: str = 'libx264'
    preset: str = 'fast'  # ultrafast, fast, medium, slow
    crf: int = 23  # 18-28 range (lower = better quality): 18 (high) to 28 (low)


def get_video_info(video_path: str) -> Dict[str, Any]:
    """
    Extract video metadata using ffprobe
    
    Args:
        video_path: Path to video file
    
    Returns:
        Dictionary with width, height, duration, fps
    """
    cmd = [
        'ffprobe', '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,duration',
        '-of', 'json',
        video_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    
    stream = data['streams'][0]
    
    # Parse frame rate (e.g., "30000/1001" or "30/1")
    fps_parts = stream['r_frame_rate'].split('/')
    fps = float(fps_parts[0]) / float(fps_parts[1])
    
    return {
        'width': int(stream['width']),
        'height': int(stream['height']),
        'fps': fps,
        'duration': float(stream.get('duration', 0))
    }


def generate_static_crop_filter(video_width: int, video_height: int) -> str:
    """
    Generate a simple center-crop filter for 9:16 aspect ratio
    Fallback when face detection is not available
    
    Args:
        video_width: Original video width
        video_height: Original video height
    
    Returns:
        FFmpeg crop filter string
    """
    # Target 9:16 aspect ratio
    target_aspect = 9 / 16
    
    # Calculate crop dimensions
    crop_width = video_width
    crop_height = int(crop_width / target_aspect)
    
    if crop_height > video_height:
        crop_height = video_height
        crop_width = int(crop_height * target_aspect)
    
    # Ensure even dimensions
    crop_width = crop_width - (crop_width % 2)
    crop_height = crop_height - (crop_height % 2)
    
    # Center crop
    x = (video_width - crop_width) // 2
    y = (video_height - crop_height) // 2
    
    return f"crop={crop_width}:{crop_height}:{x}:{y}"


def render_clip(
    input_video: str,
    output_path: str,
    start_time: float,
    end_time: float,
    segments: Optional[List[Dict[str, float]]] = None,
    crop_filter: Optional[str] = None,
    config: Optional[RenderConfig] = None
) -> str:
    """
    Render a video clip with optional cropping and segment merging
    
    Args:
        input_video: Path to source video
        output_path: Path for output clip
        start_time: Start time in seconds
        end_time: End time in seconds
        segments: Optional list of segments to merge (intelligent merging)
                  Each segment: {"start": float, "end": float}
        crop_filter: Optional FFmpeg crop filter string
        config: Render configuration (defaults to RenderConfig())
    
    Returns:
        Path to rendered clip
    """
    if config is None:
        config = RenderConfig()
    
    print(f"[Renderer] Rendering clip: {start_time}s - {end_time}s")
    
    # Get video info
    video_info = get_video_info(input_video)
    
    # Generate crop filter if not provided
    if not crop_filter:
        print(f"[Renderer] No crop filter provided, using center crop")
        crop_filter = generate_static_crop_filter(
            video_info['width'],
            video_info['height']
        )
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
    
    # Build FFmpeg command
    if segments and len(segments) > 1:
        # Intelligent merging: concat multiple segments
        output_path = render_merged_segments(
            input_video, output_path, segments, crop_filter, config
        )
    else:
        # Simple clip extraction
        duration = end_time - start_time
        
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output
            '-ss', str(start_time),  # Start time
            '-t', str(duration),  # Duration
            '-i', input_video,
            '-filter_complex',
            f"[0:v]{crop_filter},scale={config.output_width}:{config.output_height}[v]",
            '-map', '[v]',
            '-map', '0:a',  # Copy audio
            '-c:v', config.video_codec,
            '-preset', config.preset,
            '-crf', str(config.crf),
            '-c:a', config.audio_codec,
            '-b:a', '128k',
            output_path
        ]
        
        print(f"[Renderer] Executing FFmpeg...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"[Renderer] FFmpeg error: {result.stderr}")
            raise Exception(f"FFmpeg rendering failed: {result.stderr}")
    
    print(f"[Renderer] Clip saved to: {output_path}")
    return output_path


def render_merged_segments(
    input_video: str,
    output_path: str,
    segments: List[Dict[str, float]],
    crop_filter: str,
    config: RenderConfig
) -> str:
    """
    Render multiple video segments and merge them into one clip
    Implements "intelligent merging" for viral hooks
    
    Args:
        input_video: Path to source video
        output_path: Path for output clip
        segments: List of segments [{"start": float, "end": float}, ...]
        crop_filter: FFmpeg crop filter string
        config: Render configuration
    
    Returns:
        Path to merged clip
    """
    print(f"[Renderer] Merging {len(segments)} segments")
    
    temp_dir = tempfile.mkdtemp()
    segment_files = []
    
    try:
        # Step 1: Extract and crop each segment
        for i, seg in enumerate(segments):
            start, end = seg['start'], seg['end']
            duration = end - start
            
            temp_file = os.path.join(temp_dir, f"segment_{i}.mp4")
            
            cmd = [
                'ffmpeg',
                '-y',
                '-ss', str(start),
                '-t', str(duration),
                '-i', input_video,
                '-filter_complex',
                f"[0:v]{crop_filter},scale={config.output_width}:{config.output_height}[v]",
                '-map', '[v]',
                '-map', '0:a',
                '-c:v', config.video_codec,
                '-preset', config.preset,
                '-crf', str(config.crf),
                '-c:a', config.audio_codec,
                temp_file
            ]
            
            subprocess.run(cmd, capture_output=True, check=True)
            segment_files.append(temp_file)
        
        # Step 2: Create concat list file
        concat_file = os.path.join(temp_dir, 'concat.txt')
        with open(concat_file, 'w') as f:
            for seg_file in segment_files:
                f.write(f"file '{seg_file}'\n")
        
        # Step 3: Concatenate segments
        cmd = [
            'ffmpeg',
            '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-c', 'copy',
            output_path
        ]
        
        subprocess.run(cmd, capture_output=True, check=True)
        
    finally:
        # Cleanup temp files
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    return output_path


# Test function
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python video_renderer.py <input_video> <start_time> <end_time>")
        sys.exit(1)
    
    input_video = sys.argv[1]
    start_time = float(sys.argv[2])
    end_time = float(sys.argv[3])
    
    output_path = "test_clip.mp4"
    
    try:
        print("=== Testing Video Renderer ===")
        video_info = get_video_info(input_video)
        print(f"Video: {video_info['width']}x{video_info['height']} @ {video_info['fps']:.2f}fps")
        
        render_clip(
            input_video=input_video,
            output_path=output_path,
            start_time=start_time,
            end_time=end_time
        )
        
        print(f"\n✅ Test passed! Clip saved to: {output_path}")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
