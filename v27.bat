@echo off
echo Deploying Auclaire App v3.7.2 - Technical Audit Fixes
git add .
git commit -m "v3.7.2: Fix void invoice sync, calendar dashboard logic, share financial utils, and Supabase Storage migration"
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
