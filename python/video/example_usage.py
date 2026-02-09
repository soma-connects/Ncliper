"""
Usage Example: FFmpeg Face Tracker
Demonstrates how to use the face tracking module with ffmpeg-python
"""

import ffmpeg
from typing import List, Tuple
from face_tracker import generate_dynamic_crop_filter, generate_simple_centered_crop, FaceTracker


def example_1_dynamic_tracking():
    """
    Example 1: Frame-by-frame dynamic face tracking
    Best for: Videos with significant camera movement or subject motion
    """
    # Simulated face coordinates from face detection (e.g., MediaPipe, OpenCV)
    # In production, you'd get these from your face detection pipeline
    face_coords: List[Tuple[float, float]] = [
        (960, 540),   # Frame 0: Center of 1080p frame
        (965, 545),   # Frame 1: Slight movement
        (970, 540),   # Frame 2: Moving right
        (968, 538),   # Frame 3: Settling
        (970, 540),   # Frame 4: Stable
        # ... continue for all frames
    ]
    
    # Video properties
    VIDEO_WIDTH = 1920
    VIDEO_HEIGHT = 1080
    FPS = 30.0
    
    # Generate the dynamic crop filter with smoothing
    # Lower smoothing_factor = smoother but slower response (0.1-0.5 recommended)
    crop_filter = generate_dynamic_crop_filter(
        face_coordinates=face_coords,
        video_width=VIDEO_WIDTH,
        video_height=VIDEO_HEIGHT,
        fps=FPS,
        smoothing_factor=0.3  # Good balance for most videos
    )
    
    # Use with ffmpeg-python
    input_stream = ffmpeg.input('input.mp4')
    
    # Apply the dynamic crop filter
    # The filter string contains time-based expressions (if(lt(t,x),...))
    # that FFmpeg evaluates frame-by-frame
    cropped = input_stream.filter('crop', crop_filter)
    
    # Output as 9:16 vertical video
    output = ffmpeg.output(
        cropped,
        'output_dynamic.mp4',
        vcodec='libx264',
        crf=23,
        preset='medium',
        **{'profile:v': 'high', 'level': '4.0'}
    )
    
    # Execute the FFmpeg command
    ffmpeg.run(output, overwrite_output=True)
    print("✅ Dynamic face-tracked video created!")


def example_2_static_centered_crop():
    """
    Example 2: Static crop centered on average face position
    Best for: Talking head videos, interviews, or relatively static subjects
    Much more efficient than dynamic tracking!
    """
    # Same face coordinates, but we'll average them
    face_coords: List[Tuple[float, float]] = [
        (960, 540),
        (965, 545),
        (970, 540),
        (968, 538),
        (970, 540),
    ]
    
    VIDEO_WIDTH = 1920
    VIDEO_HEIGHT = 1080
    
    # Get a single static crop position
    crop_params = generate_simple_centered_crop(
        face_coordinates=face_coords,
        video_width=VIDEO_WIDTH,
        video_height=VIDEO_HEIGHT
    )
    
    # Use with ffmpeg-python (simpler filter)
    input_stream = ffmpeg.input('input.mp4')
    
    # Apply static crop - much faster to encode
    cropped = input_stream.filter(
        'crop',
        w=crop_params.width,
        h=crop_params.height,
        x=crop_params.x,
        y=crop_params.y
    )
    
    output = ffmpeg.output(cropped, 'output_static.mp4', vcodec='libx264', crf=23)
    ffmpeg.run(output, overwrite_output=True)
    print("✅ Static centered video created!")


def example_3_custom_smoothing_with_tracker():
    """
    Example 3: Fine-tuned control using FaceTracker class directly
    Best for: Custom processing pipelines or real-time applications
    """
    VIDEO_WIDTH = 1920
    VIDEO_HEIGHT = 1080
    
    # Initialize tracker with custom settings
    tracker = FaceTracker(
        video_width=VIDEO_WIDTH,
        video_height=VIDEO_HEIGHT,
        smoothing_factor=0.2,  # More aggressive smoothing
        output_aspect=(9, 16)   # Can customize aspect ratio
    )
    
    # Process frames one by one (useful for streaming or real-time)
    face_coords = [(960, 540), (965, 545), (970, 540)]
    
    for i, (face_x, face_y) in enumerate(face_coords):
        crop_params = tracker.process_frame(face_x, face_y)
        
        print(f"Frame {i}:")
        print(f"  Crop: {crop_params.width}x{crop_params.height}")
        print(f"  Position: ({crop_params.x}, {crop_params.y})")
        print(f"  Smoothed center: ({tracker.smoothed_x:.1f}, {tracker.smoothed_y:.1f})")
    
    # Reset for a new scene
    tracker.reset_smoothing()


def example_4_integration_with_mediaipe():
    """
    Example 4: Real-world integration with MediaPipe face detection
    This shows how you'd connect face detection to the crop filter
    """
    import cv2
    # Note: This is pseudocode - you'd need to install mediapipe
    # from mediapipe import solutions
    
    # Hypothetical workflow:
    # 1. Load video with OpenCV
    video = cv2.VideoCapture('input.mp4')
    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    face_coords: List[Tuple[float, float]] = []
    
    # 2. Detect faces frame-by-frame
    # with solutions.face_detection.FaceDetection() as face_detector:
    #     while video.isOpened():
    #         ret, frame = video.read()
    #         if not ret:
    #             break
    #         
    #         # Detect face
    #         results = face_detector.process(frame)
    #         if results.detections:
    #             # Get first face center
    #             bbox = results.detections[0].location_data.relative_bounding_box
    #             face_x = (bbox.xmin + bbox.width / 2) * width
    #             face_y = (bbox.ymin + bbox.height / 2) * height
    #             face_coords.append((face_x, face_y))
    #         else:
    #             # No face detected - use previous position or center
    #             face_coords.append(face_coords[-1] if face_coords else (width/2, height/2))
    
    # Simulated data for this example
    face_coords = [(960, 540)] * 100
    
    # 3. Generate filter with detected coordinates
    crop_filter = generate_dynamic_crop_filter(
        face_coordinates=face_coords,
        video_width=width,
        video_height=height,
        fps=fps,
        smoothing_factor=0.25
    )
    
    # 4. Apply with FFmpeg
    input_stream = ffmpeg.input('input.mp4')
    cropped = input_stream.filter('crop', crop_filter)
    output = ffmpeg.output(cropped, 'output_face_tracked.mp4')
    ffmpeg.run(output, overwrite_output=True)
    
    print("✅ MediaPipe-tracked video created!")
    video.release()


if __name__ == "__main__":
    print("🎬 FFmpeg Face Tracker Examples\n")
    
    # Choose which example to run
    print("1. Dynamic frame-by-frame tracking (smoothest)")
    print("2. Static centered crop (fastest)")
    print("3. Custom tracker usage (most control)")
    print("4. MediaPipe integration (production-ready)")
    
    # Uncomment to run examples:
    # example_1_dynamic_tracking()
    # example_2_static_centered_crop()
    # example_3_custom_smoothing_with_tracker()
    # example_4_integration_with_mediaipe()
    
    print("\n💡 Tip: Adjust smoothing_factor based on your needs:")
    print("   0.1-0.2: Very smooth, slow response (calm videos)")
    print("   0.3-0.4: Balanced (recommended for most cases)")
    print("   0.5-0.7: Responsive, less smooth (action videos)")
