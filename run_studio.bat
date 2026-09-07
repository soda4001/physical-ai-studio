@echo off
title Physical AI Studio Launcher

echo ========================================================
echo   Physical AI Studio - Easy DevTool for Beginners
echo ========================================================
echo.

cd /d "%~dp0"

where uv >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Fast launching with 'uv'...
    uv run python server.py
) else (
    echo [INFO] Launching with python...
    python server.py
)

pause
