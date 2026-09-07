#!/usr/bin/env bash
# Physical AI Studio - Linux/macOS Launcher

echo "========================================================"
echo "  🤖 Physical AI Studio - Easy DevTool for Beginners"
echo "========================================================"
echo ""

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if command -v uv &> /dev/null; then
    echo "[INFO] Using 'uv' package manager..."
    uv run python server.py
else
    echo "[INFO] Using python3..."
    python3 server.py
fi
