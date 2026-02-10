# FFmpeg Installation Guide for Windows

## Quick Install (Recommended - Using Chocolatey)

If you have Chocolatey installed:
```powershell
choco install ffmpeg -y
```

## Manual Install (5 minutes)

### Step 1: Download FFmpeg
1. Go to: https://www.gyan.dev/ffmpeg/builds/
2. Download: **ffmpeg-release-essentials.zip** (latest version)
3. Extract to: `C:\ffmpeg`

### Step 2: Add to PATH
1. Press `Win + X` → "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find `Path`
5. Click "Edit" → "New"
6. Add: `C:\ffmpeg\bin`
7. Click "OK" on all dialogs

### Step 3: Verify Installation
Open a NEW PowerShell window and run:
```powershell
ffmpeg -version
```

You should see FFmpeg version information.

### Step 4: Restart Worker
After installing FFmpeg, restart your Python worker:
1. Press `Ctrl+C` in the Python terminal
2. Run: `python main.py`

---

## Alternative: Use FFmpeg from Conda/pip

If you have conda or prefer Python-based:
```bash
# In your venv
pip install ffmpeg-python
```

**Note:** The worker expects `ffmpeg` command to be available in PATH.

---

## Verify FFmpeg Works

After installation, test with:
```powershell
ffmpeg -i input.mp4 -c copy output.mp4
```

Once FFmpeg is installed, the worker will be able to render clips! 🎬
