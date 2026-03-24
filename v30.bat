@echo off
echo Deploying Auclaire App v3.8.6 - PandaDoc Direct Integration Fix
git add .
git commit -m "v3.8.6: Fix PandaDoc 401 error and switch to direct HTML generation"
echo Pushing to GitHub...
git pull origin main --rebase
git push origin HEAD:main --force
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git push failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Deployment successful! Version 3.8.6 pushed.
pause
