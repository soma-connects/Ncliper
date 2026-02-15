# -*- coding: utf-8 -*-
"""
Export YouTube cookies from local browser for Modal worker.
Writes cookies.txt in Netscape format, then base64 encodes it
and stores it as a Modal secret.
"""
import browser_cookie3
import http.cookiejar
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

def export_youtube_cookies() -> str:
    """Export YouTube cookies from Chrome/Edge/Firefox to Netscape format file."""
    
    # Try browsers in order of preference
    browsers = [
        ("edge", browser_cookie3.edge),
        ("chrome", browser_cookie3.chrome),
        ("firefox", browser_cookie3.firefox),
    ]
    
    jar = None
    for name, loader in browsers:
        try:
            print(f"[CookieExport] Trying {name}...")
            jar = loader(domain_name=".youtube.com")
            # Test if we got any cookies
            yt_cookies = [c for c in jar if "youtube" in c.domain]
            if yt_cookies:
                print(f"[CookieExport] Found {len(yt_cookies)} YouTube cookies from {name}")
                break
            else:
                print(f"[CookieExport] No YouTube cookies found in {name}")
                jar = None
        except Exception as e:
            print(f"[CookieExport] {name} failed: {e}")
            jar = None
    
    if not jar:
        print("[CookieExport] Could not load cookies from any browser.")
        print("[CookieExport] Make sure you are logged into YouTube in Chrome, Edge, or Firefox.")
        sys.exit(1)
    
    # Save as Netscape format cookie file
    cookie_jar = http.cookiejar.MozillaCookieJar(COOKIE_FILE)
    for cookie in jar:
        if "youtube" in cookie.domain or "google" in cookie.domain:
            cookie_jar.set_cookie(cookie)
    
    cookie_jar.save(ignore_discard=True, ignore_expires=True)
    print(f"[CookieExport] Saved cookies to {COOKIE_FILE}")
    return COOKIE_FILE


def store_as_modal_secret(cookie_file: str):
    """Base64 encode the cookie file and store it as a Modal secret."""
    
    with open(cookie_file, "rb") as f:
        cookie_data = f.read()
    
    encoded = base64.b64encode(cookie_data).decode("utf-8")
    
    print(f"[CookieExport] Cookie file size: {len(cookie_data)} bytes")
    print(f"[CookieExport] Base64 size: {len(encoded)} chars")
    
    # Store as Modal secret using CLI
    cmd = [
        sys.executable, "-m", "modal", "secret", "create",
        "ncliper-youtube-cookies",
        f"YOUTUBE_COOKIES_B64={encoded}",
        "--force",
    ]
    
    print("[CookieExport] Storing as Modal secret 'ncliper-youtube-cookies'...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("[CookieExport] Modal secret created successfully!")
    else:
        print(f"[CookieExport] Failed to create Modal secret:")
        print(result.stderr)
        sys.exit(1)


if __name__ == "__main__":
    print("=" * 50)
    print("  Ncliper - YouTube Cookie Exporter")
    print("=" * 50)
    print()
    
    cookie_file = export_youtube_cookies()
    store_as_modal_secret(cookie_file)
    
    print()
    print("Done! Now redeploy the worker with: .\\deploy_modal.ps1")
