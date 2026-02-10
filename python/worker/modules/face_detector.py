"""
Face Detection Module
Integrates existing face_tracker.py into worker pipeline

This module wraps the face tracking functionality for use in the video processing worker.
It provides a simple interface to detect faces in videos and generate crop parameters
for face-following vertical crops.
"""

import sys
import os
from typing import Optional, Tuple

# Import existing face tracker (adjust path to find it)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
video_module_path = os.path.join(project_root, 'python', 'video')
if video_module_path not in sys.path:
    sys.path.insert(0, video_module_path)

try:
    from face_tracker import FaceTracker, CropParams, generate_simple_centered_crop
except ImportError:
    # Fallback: assume we're running from test
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../video'))
    from face_tracker import FaceTracker, CropParams, generate_simple_centered_crop


def should_use_face_tracking(video_metadata: dict) -> bool:
    """
    Determine if face tracking should be used for this video.
    
    Args:
        video_metadata: Video metadata dictionary with duration, title, etc.
        
    Returns:
        True if face tracking is recommended, False otherwise
    """
    # Enable for shorter videos (likely talking-head content)
    # Disable for long videos (likely edited content with multiple shots)
    duration = video_metadata.get('duration', 0)
    
    if duration < 60:  # Less than 1 minute - likely short clip
        return True
    elif duration < 600:  # Less than 10 minutes - possibly talking head
        return True
    else:  # Long video - likely has scene changes, skip face tracking
        return False


def detect_faces_simple(
    video_path: str,
    video_width: int,
    video_height: int
) -> Optional[CropParams]:
    """
    Detect faces in video and generate simple static crop parameters.
    
    This uses a simplified approach: find the average face position
    across all frames and generate a single static crop.
    
    Args:
        video_path: Path to video file
        video_width: Video width in pixels
        video_height: Video height in pixels
        
    Returns:
        CropParams for face-centered crop, or None if no faces detected
    """
    try:
        import cv2
        import mediapipe as mp
        
        print(f"[FaceDetector] Analyzing video for faces...")
        
        # Initialize MediaPipe Face Detection
        mp_face_detection = mp.solutions.face_detection
        face_coords = []
        
        with mp_face_detection.FaceDetection(
            model_selection=0,  # 0 = short-range (< 2m), faster
            min_detection_confidence=0.5
        ) as face_detection:
            
            cap = cv2.VideoCapture(video_path)
            frame_count = 0
            sample_rate = 5  # Sample every 5th frame (faster processing)
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                if frame_count % sample_rate != 0:
                    continue
                
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Detect faces
                results = face_detection.process(rgb_frame)
                
                if results.detections:
                    # Use first detected face
                    detection = results.detections[0]
                    bbox = detection.location_data.relative_bounding_box
                    
                    # Convert relative coordinates to absolute
                    face_x = (bbox.xmin + bbox.width / 2) * video_width
                    face_y = (bbox.ymin + bbox.height / 2) * video_height
                    
                    face_coords.append((face_x, face_y))
            
            cap.release()
        
        if not face_coords:
            print(f"[FaceDetector] No faces detected")
            return None
        
        # Generate static crop centered on average face position
        crop_params = generate_simple_centered_crop(
            face_coords,
            video_width,
            video_height
        )
        
        confidence = (len(face_coords) / (frame_count / sample_rate)) * 100
        print(f"[FaceDetector] ✅ Face detected in {len(face_coords)} frames ({confidence:.1f}% confidence)")
        print(f"[FaceDetector] Crop: {crop_params.width}x{crop_params.height} at ({crop_params.x}, {crop_params.y})")
        
        return crop_params
        
    except Exception as e:
        print(f"[FaceDetector] Error during face detection: {e}")
        return None


def generate_crop_filter(
    crop_params: Optional[CropParams],
    video_width: int,
    video_height: int
) -> str:
    """
    Generate FFmpeg crop filter string from crop parameters.
    
    Args:
        crop_params: Face tracking crop parameters, or None for center crop
        video_width: Original video width
        video_height: Original video height
        
    Returns:
        FFmpeg crop filter string
    """
    if crop_params is None:
        # Fallback to center crop (9:16 aspect ratio)
        crop_width = int(video_height * 9 / 16)
        crop_x = max(0, (video_width - crop_width) // 2)
        return f"crop={crop_width}:{video_height}:{crop_x}:0"
    
    # Use face-centered crop
    return f"crop={crop_params.width}:{crop_params.height}:{crop_params.x}:{crop_params.y}"


# Test function
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python face_detector.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    # Get video info
    import cv2
    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    print(f"Video: {width}x{height}")
    
    # Test face detection
    crop_params = detect_faces_simple(video_path, width, height)
    
    if crop_params:
        filter_str = generate_crop_filter(crop_params, width, height)
        print(f"\nFFmpeg filter: {filter_str}")
    else:
        print("\nNo faces found, using center crop")
        filter_str = generate_crop_filter(None, width, height)
        print(f"FFmpeg filter: {filter_str}")
