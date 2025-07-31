@echo off
title FurniVision Quick Start
echo.
echo ========================================
echo    🚀 FurniVision Quick Start
echo ========================================
echo.
echo Starting development server...
echo.

cd /d "%~dp0"
python server.py

echo.
echo Press any key to exit...
pause >nul
