"""
FFmpeg Face Tracking Module
Video Engineer: Dynamic Face-Centered Cropping with Smoothing

This module generates FFmpeg crop filter strings that keep faces centered
in a 9:16 vertical frame while applying smoothing to prevent jitter.
"""

from typing import List, Tuple, Optional
from dataclasses import dataclass
import math


@dataclass
class CropParams:
    """Parameters for FFmpeg crop filter."""
    width: int
    height: int
    x: int
    y: int


class FaceTracker:
    """
    Generates smooth, face-centered crop filters for vertical video (9:16).
    
    Uses exponential moving average (EMA) smoothing to prevent jitter
    when tracking face coordinates across video frames.
    """
    
    def __init__(
        self,
        video_width: int,
        video_height: int,
        smoothing_factor: float = 0.3,
        output_aspect: Tuple[int, int] = (9, 16)
    ) -> None:
        """
        Initialize the face tracker.
        
        Args:
            video_width: Original video width in pixels
            video_height: Original video height in pixels
            smoothing_factor: EMA alpha value (0-1). Lower = smoother but slower response.
                             0.3 provides good balance between responsiveness and smoothness.
            output_aspect: Target aspect ratio as (width_ratio, height_ratio)
        """
        self.video_width = video_width
        self.video_height = video_height
        self.smoothing_factor = smoothing_factor
        self.output_aspect = output_aspect
        
        # Calculate output dimensions maintaining aspect ratio
        self.crop_width, self.crop_height = self._calculate_crop_dimensions()
        
        # Smoothing state - tracks the exponential moving average
        self.smoothed_x: Optional[float] = None
        self.smoothed_y: Optional[float] = None
    
    def _calculate_crop_dimensions(self) -> Tuple[int, int]:
        """
        Calculate crop dimensions that fit within video bounds
        while maintaining the target aspect ratio (9:16).
        
        Returns:
            Tuple of (crop_width, crop_height) in pixels
        """
        aspect_w, aspect_h = self.output_aspect
        target_aspect = aspect_w / aspect_h  # 9/16 = 0.5625
        
        # Try fitting by width first
        crop_width = self.video_width
        crop_height = int(crop_width / target_aspect)
        
        # If height exceeds video bounds, fit by height instead
        if crop_height > self.video_height:
            crop_height = self.video_height
            crop_width = int(crop_height * target_aspect)
        
        # Ensure even dimensions (required by many codecs)
        crop_width = crop_width - (crop_width % 2)
        crop_height = crop_height - (crop_height % 2)
        
        return crop_width, crop_height
    
    def _apply_smoothing(self, current_x: float, current_y: float) -> Tuple[float, float]:
        """
        Apply exponential moving average (EMA) smoothing to face coordinates.
        
        Formula: smoothed_t = α × current_t + (1 - α) × smoothed_(t-1)
        
        This prevents sudden jumps when face detection has minor jitter
        or brief tracking errors.
        
        Args:
            current_x: Current face X coordinate (center)
            current_y: Current face Y coordinate (center)
        
        Returns:
            Tuple of (smoothed_x, smoothed_y)
        """
        if self.smoothed_x is None or self.smoothed_y is None:
            # First frame - initialize with current values
            self.smoothed_x = current_x
            self.smoothed_y = current_y
        else:
            # Apply exponential moving average
            alpha = self.smoothing_factor
            self.smoothed_x = alpha * current_x + (1 - alpha) * self.smoothed_x
            self.smoothed_y = alpha * current_y + (1 - alpha) * self.smoothed_y
        
        return self.smoothed_x, self.smoothed_y
    
    def _clamp_coordinates(self, x: float, y: float) -> Tuple[int, int]:
        """
        Clamp crop coordinates to ensure the crop window stays within video bounds.
        
        Args:
            x: Desired crop X position (top-left corner)
            y: Desired crop Y position (top-left corner)
        
        Returns:
            Tuple of (clamped_x, clamped_y) as integers
        """
        # Ensure crop doesn't go beyond right edge
        max_x = self.video_width - self.crop_width
        clamped_x = max(0, min(int(x), max_x))
        
        # Ensure crop doesn't go beyond bottom edge
        max_y = self.video_height - self.crop_height
        clamped_y = max(0, min(int(y), max_y))
        
        return clamped_x, clamped_y
    
    def process_frame(self, face_x: float, face_y: float) -> CropParams:
        """
        Process a single frame's face coordinates and return crop parameters.
        
        Args:
            face_x: Face center X coordinate in original video
            face_y: Face center Y coordinate in original video
        
        Returns:
            CropParams object with smoothed crop window coordinates
        """
        # Apply smoothing to prevent jitter
        smoothed_x, smoothed_y = self._apply_smoothing(face_x, face_y)
        
        # Convert face center to top-left crop position
        # (center the face in the crop window)
        crop_x = smoothed_x - (self.crop_width / 2)
        crop_y = smoothed_y - (self.crop_height / 2)
        
        # Clamp to video bounds
        final_x, final_y = self._clamp_coordinates(crop_x, crop_y)
        
        return CropParams(
            width=self.crop_width,
            height=self.crop_height,
            x=final_x,
            y=final_y
        )
    
    def reset_smoothing(self) -> None:
        """Reset smoothing state (useful for scene changes or new videos)."""
        self.smoothed_x = None
        self.smoothed_y = None


def generate_dynamic_crop_filter(
    face_coordinates: List[Tuple[float, float]],
    video_width: int,
    video_height: int,
    fps: float = 30.0,
    smoothing_factor: float = 0.3
) -> str:
    """
    Generate FFmpeg crop filter string with dynamic face tracking.
    
    This function takes a list of face coordinates (one per frame) and generates
    an FFmpeg filter_complex string that smoothly crops the video to 9:16,
    keeping the face centered throughout.
    
    FFmpeg Filter Explanation:
    ---------------------------
    The generated filter uses the `crop` video filter with time-based expressions:
    
    crop=w:h:x:y
      - w/h: Output dimensions (9:16 aspect ratio)
      - x/y: Top-left position of crop window, dynamically calculated per frame
    
    We generate keyframe-based interpolation using FFmpeg's expression evaluator:
      - 'if(lt(t,T1),X1,if(lt(t,T2),X2,...))' creates stepped motion
      - Each frame gets its smoothed position, preventing jitter
    
    Args:
        face_coordinates: List of (x, y) tuples representing face center per frame
        video_width: Original video width in pixels
        video_height: Original video height in pixels
        fps: Video frames per second (for time-based expressions)
        smoothing_factor: EMA smoothing factor (0-1), lower = smoother
    
    Returns:
        FFmpeg filter_complex string ready to use with ffmpeg-python
    
    Example:
        >>> coords = [(960, 540), (965, 545), (970, 540)]  # 1080p video
        >>> filter_str = generate_dynamic_crop_filter(coords, 1920, 1080)
        >>> # Use with ffmpeg-python:
        >>> import ffmpeg
        >>> stream = ffmpeg.input('input.mp4')
        >>> stream = ffmpeg.filter(stream, 'crop', filter_str)
        >>> stream = ffmpeg.output(stream, 'output.mp4')
    """
    if not face_coordinates:
        raise ValueError("face_coordinates list cannot be empty")
    
    # Initialize tracker with smoothing
    tracker = FaceTracker(
        video_width=video_width,
        video_height=video_height,
        smoothing_factor=smoothing_factor
    )
    
    # Process all frames to get smoothed crop parameters
    crop_params_list: List[CropParams] = []
    for face_x, face_y in face_coordinates:
        params = tracker.process_frame(face_x, face_y)
        crop_params_list.append(params)
    
    # Use the first frame's dimensions (constant throughout)
    crop_width = crop_params_list[0].width
    crop_height = crop_params_list[0].height
    
    # Build time-based expression for X coordinate
    # Format: if(lt(t,T1),X1,if(lt(t,T2),X2,if(lt(t,T3),X3,...)))
    x_expr_parts = []
    y_expr_parts = []
    
    frame_duration = 1.0 / fps
    
    for i, params in enumerate(crop_params_list):
        timestamp = i * frame_duration
        
        if i == len(crop_params_list) - 1:
            # Last frame - no conditional needed
            x_expr_parts.append(f"{params.x}")
            y_expr_parts.append(f"{params.y}")
        else:
            # Build nested if expression
            next_timestamp = (i + 1) * frame_duration
            x_expr_parts.append(f"if(lt(t,{next_timestamp:.3f}),{params.x},")
            y_expr_parts.append(f"if(lt(t,{next_timestamp:.3f}),{params.y},")
    
    # Close all if statements (except the last one which has no opening)
    x_expr = "".join(x_expr_parts) + ")" * (len(crop_params_list) - 1)
    y_expr = "".join(y_expr_parts) + ")" * (len(crop_params_list) - 1)
    
    # Construct final crop filter
    # Format: crop=width:height:x_expression:y_expression
    filter_string = f"crop={crop_width}:{crop_height}:{x_expr}:{y_expr}"
    
    return filter_string


def generate_simple_centered_crop(
    face_coordinates: List[Tuple[float, float]],
    video_width: int,
    video_height: int,
    smoothing_factor: float = 0.3
) -> CropParams:
    """
    Generate a single static crop that centers on the average face position.
    
    Useful for videos where the subject doesn't move much. Much more efficient
    than frame-by-frame dynamic cropping.
    
    Args:
        face_coordinates: List of (x, y) face positions
        video_width: Original video width
        video_height: Original video height
        smoothing_factor: Not used here, kept for API consistency
    
    Returns:
        CropParams for a static crop filter
    """
    if not face_coordinates:
        raise ValueError("face_coordinates list cannot be empty")
    
    # Calculate average face position
    avg_x = sum(x for x, y in face_coordinates) / len(face_coordinates)
    avg_y = sum(y for x, y in face_coordinates) / len(face_coordinates)
    
    # Initialize tracker and process average position
    tracker = FaceTracker(video_width, video_height)
    params = tracker.process_frame(avg_x, avg_y)
    
    return params
