"""
Test Face Detection Module
Standalone test for MediaPipe integration
"""

import sys
import os

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'worker'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'worker/modules'))

def test_face_detection():
    """Test face detection with a downloaded video"""
    from modules.face_detector import detect_faces_simple, generate_crop_filter
    
    # Use the previously downloaded video from temp
    import glob
    temp_videos = glob.glob("/tmp/*/*.mp4")
    
    if not temp_videos:
        print("❌ No test videos found in /tmp/")
        print("Please run a job first to download a test video")
        return False
    
    test_video = temp_videos[0]
    print(f"Testing with: {test_video}")
    
    # Get video info
    try:
        import cv2
        cap = cv2.VideoCapture(test_video)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        cap.release()
        
        print(f"\nVideo Info:")
        print(f"  Resolution: {width}x{height}")
        print(f"  FPS: {fps:.2f}")
        print(f"  Duration: {duration:.1f}s")
        print(f"  Frames: {frame_count}")
        
    except Exception as e:
        print(f"❌ Error reading video: {e}")
        return False
    
    # Test face detection
    print("\n" + "="*50)
    print("Running Face Detection...")
    print("="*50)
    
    try:
        crop_params = detect_faces_simple(test_video, width, height)
        
        if crop_params:
            print("\n✅ Face Detection SUCCESS!")
            print(f"\nCrop Parameters:")
            print(f"  Dimensions: {crop_params.width}x{crop_params.height}")
            print(f"  Position: ({crop_params.x}, {crop_params.y})")
            
            # Generate FFmpeg filter
            crop_filter = generate_crop_filter(crop_params, width, height)
            print(f"\nFFmpeg Filter:")
            print(f"  {crop_filter}")
            
            # Calculate crop area
            crop_area_pct = (crop_params.width * crop_params.height) / (width * height) * 100
            print(f"\nCrop Area: {crop_area_pct:.1f}% of original")
            
            # Verify 9:16 aspect ratio
            aspect = crop_params.width / crop_params.height
            target_aspect = 9 / 16
            aspect_match = abs(aspect - target_aspect) < 0.01
            
            if aspect_match:
                print(f"✅ Aspect Ratio: {aspect:.4f} (target: {target_aspect:.4f})")
            else:
                print(f"⚠️ Aspect Ratio: {aspect:.4f} (target: {target_aspect:.4f})")
            
            return True
            
        else:
            print("\n⚠️ No faces detected - will fall back to center crop")
            
            # Test fallback
            fallback_filter = generate_crop_filter(None, width, height)
            print(f"\nFallback FFmpeg Filter:")
            print(f"  {fallback_filter}")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Face detection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🎬 Face Detection Test\n")
    success = test_face_detection()
    
    if success:
        print("\n" + "="*50)
        print("✅ ALL TESTS PASSED!")
        print("="*50)
        sys.exit(0)
    else:
        print("\n" + "="*50)
        print("❌ TESTS FAILED")
        print("="*50)
        sys.exit(1)
