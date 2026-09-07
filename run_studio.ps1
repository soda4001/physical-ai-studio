# Physical AI Studio - PowerShell Launcher
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🤖 Physical AI Studio - Easy DevTool for Beginners" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (Get-Command uv -ErrorAction SilentlyContinue) {
    Write-Host "[INFO] Using 'uv' fast package manager..." -ForegroundColor Green
    uv run python server.py
} else {
    Write-Host "[INFO] Using Python..." -ForegroundColor Green
    python server.py
}
