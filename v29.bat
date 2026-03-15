@echo off
echo Deploying Auclaire App v3.8.5 - Final Beta Feedback Fixes
git add .
git commit -m "v3.8.5: Fix Snapshot zero stats, add invoice project details, and automate design version archiving"
echo Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git push failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Deployment successful! Version 3.8.5 pushed.
pause
