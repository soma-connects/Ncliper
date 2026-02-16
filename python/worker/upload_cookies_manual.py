# -*- coding: utf-8 -*-
"""
Upload manually exported cookies.txt to Modal secret.
Usage:
1. Export cookies using "Get cookies.txt LOCALLY" extension.
2. Save as 'cookies.txt' in this folder.
3. Run this script.
"""
import base64
import os
import sys
import subprocess

# Force UTF-8 output
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

COOKIE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cookies.txt")

def store_as_modal_secret(cookie_file: str):
    """Base64 encode the cookie file and store it as a Modal secret."""
    
    if not os.path.exists(cookie_file):
        print(f"ERROR: File not found: {cookie_file}")
        print("Please save your exported cookies as 'cookies.txt' in this folder.")
        sys.exit(1)

    with open(cookie_file, "rb") as f:
        cookie_data = f.read()
    
    encoded = base64.b64encode(cookie_data).decode("utf-8")
    
    print(f"[ManualUpload] Cookie file size: {len(cookie_data)} bytes")
    print(f"[ManualUpload] Base64 size: {len(encoded)} chars")
    
    # Store as Modal secret using CLI
    cmd = [
        sys.executable, "-m", "modal", "secret", "create",
        "ncliper-youtube-cookies",
        f"YOUTUBE_COOKIES_B64={encoded}",
        "--force",
    ]
    
    print("[ManualUpload] Storing as Modal secret 'ncliper-youtube-cookies'...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("[ManualUpload] Modal secret created successfully!")
    else:
        print(f"[ManualUpload] Failed to create Modal secret:")
        print(result.stderr)
        sys.exit(1)


if __name__ == "__main__":
    print("=" * 50)
    print("  Ncliper - Manual Cookie Uploader")
    print("=" * 50)
    print(f"Target file: {COOKIE_FILE}")
    print()
    
    store_as_modal_secret(COOKIE_FILE)
    
    print()
    print("Done! Now redeploy the worker with: .\\deploy_modal.ps1")
