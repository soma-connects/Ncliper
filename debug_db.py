
import os
from supabase import create_client
from dotenv import load_dotenv

# Load env vars
load_dotenv('.env.local')

supabase = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def check_data():
    print("--- Checking Projects ---")
    projects = supabase.table("projects").select("*").execute()
    for p in projects.data:
        print(f"Project: {p['id']} | Title: {p['title']} | Status: {p['status']}")
        
        # Check clips for this project
        clips = supabase.table("clips").select("*").eq("project_id", p['id']).execute()
        print(f"  -> Clips count: {len(clips.data)}")
        for c in clips.data:
            print(f"     - Clip: {c['id']} | URL: {c['video_url']}")
            
    print("\n--- Checking Jobs ---")
    jobs = supabase.table("jobs").select("*").execute()
    for j in jobs.data:
        print(f"Job: {j['id']} | Status: {j['status']}")
        if j.get('result_data'):
            print(f"  -> Has result data with {len(j['result_data'].get('clips', []))} clips")
        else:
            print("  -> No result data")

if __name__ == "__main__":
    check_data()
