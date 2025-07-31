@echo off
echo Starting FurniVision Web Server...
echo.
echo Navigate to: http://localhost:8000/frontend/
echo.
python -m http.server 8000
pause
