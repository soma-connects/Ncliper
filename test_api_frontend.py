"""
Frontend API Test - Submit Job Through Next.js
Tests the /api/jobs endpoint with a real YouTube video
"""

import requests
import json
import time

# Your Next.js dev server (default port is 3000)
API_BASE_URL = "http://localhost:3000"

# Test job payload
test_job = {
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "settings": {
        "clip_count": 3,
        "aspect_ratio": "9:16",
        "width": 1080,
        "height": 1920
    }
}

print("="*70)
print("TESTING NEXT.JS API - JOB SUBMISSION")
print("="*70)

try:
    # Step 1: Submit job
    print(f"\n📤 Submitting job to {API_BASE_URL}/api/jobs...")
    print(f"   Video: {test_job['video_url']}")
    
    response = requests.post(
        f"{API_BASE_URL}/api/jobs",
        json=test_job,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\n📊 Response Status: {response.status_code}")
    
    if response.status_code == 202:
        result = response.json()
        job_id = result.get("job_id")
        
        print(f"✅ Job submitted successfully!")
        print(f"   Job ID: {job_id}")
        print(f"   Message: {result.get('message')}")
        
        # Step 2: Poll for status
        print(f"\n⏳ Polling job status...")
        
        for i in range(10):  # Poll 10 times
            time.sleep(3)  # Wait 3 seconds between polls
            
            status_response = requests.get(
                f"{API_BASE_URL}/api/jobs/{job_id}"
            )
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                current_status = status_data.get("status")
                
                print(f"   [{i+1}/10] Status: {current_status}")
                
                if current_status == "completed":
                    print(f"\n🎉 Job completed!")
                    print(f"   Result: {json.dumps(status_data, indent=2)}")
                    break
                elif current_status == "failed":
                    print(f"\n❌ Job failed!")
                    print(f"   Error: {status_data.get('error')}")
                    break
            else:
                print(f"   Error polling status: {status_response.status_code}")
        
    elif response.status_code == 401:
        print(f"❌ Authentication required")
        print(f"   You need to be logged in with Clerk to submit jobs")
        print(f"\n💡 Solution:")
        print(f"   1. Open http://localhost:3001 in your browser")
        print(f"   2. Sign in with Clerk")
        print(f"   3. Copy the session token from DevTools")
        print(f"   4. Add Authorization header to this script")
        
    else:
        print(f"❌ Unexpected response: {response.status_code}")
        print(f"   Body: {response.text}")
    
    print("\n" + "="*70)
    
except requests.exceptions.ConnectionError:
    print(f"❌ Cannot connect to {API_BASE_URL}")
    print(f"   Make sure Next.js dev server is running on port 3001")
    print(f"   Run: npm run dev")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
