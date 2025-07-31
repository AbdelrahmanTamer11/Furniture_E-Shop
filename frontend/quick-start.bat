@echo off
echo Starting FurniVision Server...
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Starting server on http://localhost:8000
echo Open your browser to: http://localhost:8000/status.html
echo.
python -m http.server 8000
echo.
echo Server stopped.
pause
