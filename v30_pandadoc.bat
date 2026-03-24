@echo off
echo Deploying PandaDoc Integration - Maison Auclaire
git add .
git commit -m "feat: PandaDoc contract generation directly from HTML (v3.8.6)"
echo Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git push failed!
    exit /b %ERRORLEVEL%
)
echo.
echo Deployment successful! PandaDoc integration pushed.
