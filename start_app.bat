@echo off
echo Starting Auclaire App...
cd /d "%~dp0"

echo Installing dependencies (if missing)...
if not exist node_modules call npm install

echo Starting Development Server...
echo The app will be available at http://localhost:5173
echo Press specific keys as shown by Vite to interact.
echo.

call npm run dev
pause
