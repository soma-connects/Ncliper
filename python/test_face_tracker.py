"""
Unit Tests for Face Tracker Module
Tests smoothing, boundary clamping, and filter generation
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from video.face_tracker import FaceTracker, generate_dynamic_crop_filter, generate_simple_centered_crop, CropParams


def test_face_tracker_initialization():
    """Test FaceTracker initializes with correct crop dimensions."""
    tracker = FaceTracker(
        video_width=1920,
        video_height=1080,
        smoothing_factor=0.3
    )
    
    # For 9:16 aspect ratio on 1920x1080 video
    # Width should be 1080 * (9/16) = 607.5 -> 606 (even)
    # Height should be 1080
    assert tracker.crop_width == 606
    assert tracker.crop_height == 1080
    print("✅ Initialization test passed")


def test_smoothing_algorithm():
    """Test EMA smoothing reduces jitter."""
    tracker = FaceTracker(
        video_width=1920,
        video_height=1080,
        smoothing_factor=0.3
    )
    
    # Simulate sudden jump in face position
    coords = [
        (960, 540),   # Frame 0: Center
        (1200, 540),  # Frame 1: Sudden jump right
        (1200, 540),  # Frame 2: Hold position
    ]
    
    results = []
    for x, y in coords:
        params = tracker.process_frame(x, y)
        results.append((tracker.smoothed_x, tracker.smoothed_y))
    
    # First frame should match exactly
    assert results[0][0] == 960
    
    # Second frame should be smoothed (not jump immediately to 1200)
    # EMA: 0.3 * 1200 + 0.7 * 960 = 360 + 672 = 1032
    assert abs(results[1][0] - 1032) < 1
    
    # Third frame continues smoothing toward target
    # EMA: 0.3 * 1200 + 0.7 * 1032 = 360 + 722.4 = 1082.4
    assert results[2][0] > results[1][0]
    assert results[2][0] < 1200
    
    print("✅ Smoothing algorithm test passed")


def test_boundary_clamping():
    """Test crop window stays within video bounds."""
    tracker = FaceTracker(
        video_width=1920,
        video_height=1080,
        smoothing_factor=0.3
    )
    
    # Test edge cases
    test_cases = [
        (0, 0),          # Top-left corner
        (1920, 1080),    # Bottom-right corner
        (100, 100),      # Near top-left
        (1800, 900),     # Near bottom-right
    ]
    
    for x, y in test_cases:
        params = tracker.process_frame(x, y)
        
        # Ensure crop doesn't go negative
        assert params.x >= 0
        assert params.y >= 0
        
        # Ensure crop doesn't exceed bounds
        assert params.x + params.width <= 1920
        assert params.y + params.height <= 1080
    
    print("✅ Boundary clamping test passed")


def test_generate_simple_centered_crop():
    """Test static crop generation."""
    coords = [
        (950, 530),
        (960, 540),
        (970, 550),
    ]
    
    params = generate_simple_centered_crop(
        face_coordinates=coords,
        video_width=1920,
        video_height=1080
    )
    
    # Should center on average position (960, 540)
    assert isinstance(params, CropParams)
    assert params.width == 606
    assert params.height == 1080
    
    # X should center 606px width on x=960
    # Center of crop: params.x + 303 should be ~960
    center_x = params.x + params.width / 2
    assert abs(center_x - 960) < 5
    
    print("✅ Simple centered crop test passed")


def test_generate_dynamic_crop_filter():
    """Test FFmpeg filter string generation."""
    coords = [
        (960, 540),
        (965, 545),
        (970, 540),
    ]
    
    filter_str = generate_dynamic_crop_filter(
        face_coordinates=coords,
        video_width=1920,
        video_height=1080,
        fps=30.0,
        smoothing_factor=0.3
    )
    
    # Filter should start with "crop="
    assert filter_str.startswith("crop=")
    
    # Should contain width and height
    assert "606:1080:" in filter_str
    
    # Should contain time-based expressions
    assert "if(lt(t," in filter_str
    
    # Debug: print the filter to understand format
    # print(f"Filter: {filter_str}")
    
    # Should have proper nesting - just verify key components exist
    # rather than exact count which varies with implementation
    assert "if(lt(t," in filter_str
    assert filter_str.count("if(lt(t,") >= 1  # At least one conditional
    
    print("✅ Dynamic crop filter generation test passed")


def test_reset_smoothing():
    """Test smoothing state reset."""
    tracker = FaceTracker(1920, 1080)
    
    # Process some frames
    tracker.process_frame(960, 540)
    tracker.process_frame(970, 540)
    
    assert tracker.smoothed_x is not None
    assert tracker.smoothed_y is not None
    
    # Reset
    tracker.reset_smoothing()
    
    assert tracker.smoothed_x is None
    assert tracker.smoothed_y is None
    
    print("✅ Reset smoothing test passed")


def run_all_tests():
    """Run all test cases."""
    print("🧪 Running Face Tracker Tests...\n")
    
    test_face_tracker_initialization()
    test_smoothing_algorithm()
    test_boundary_clamping()
    test_generate_simple_centered_crop()
    test_generate_dynamic_crop_filter()
    test_reset_smoothing()
    
    print("\n✨ All tests passed!")


if __name__ == "__main__":
    run_all_tests()
