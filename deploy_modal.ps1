# Modal Deployment Script - UTF-8 encoded
# This script sets UTF-8 encoding before running Modal deploy

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"

Write-Host "Deploying to Modal with UTF-8 encoding..." -ForegroundColor Green

python -m modal deploy python/worker/modal_worker.py 2>&1 | Out-String -Width 4096
