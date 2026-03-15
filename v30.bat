@echo off
echo Deploying Auclaire App v3.8.6 - Final UI Polish & Feedback Controls
git add .
git commit -m "v3.8.6: Fix ProjectDetails JSX structure, refine Beta Feedback status logic, and fix design history editing"
echo Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git push failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Deployment successful! Version 3.8.6 pushed.
pause
