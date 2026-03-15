@echo off
echo Deploying Auclaire App v3.7.3 - Beta Feedback System
git add .
git commit -m "v3.7.3: Implement Beta Feedback system (widget, screenshots, admin dashboard) and final audit fixes"
echo Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git push failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Deployment successful!
pause
