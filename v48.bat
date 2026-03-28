@echo off
title AUCLAIRE DEPLOYER v48
echo ===========================================
echo AUCLAIRE - VERCEL DEPLOYMENT v3.16.7 (Manual Portal Link)
echo ===========================================

echo [1/4] SYNCING WITH GITHUB...
git pull origin main --rebase

echo [2/4] UPDATING HEARTBEAT...
echo %date% %time% > force_deploy.txt

echo [3/4] COMMITTING CHANGES...
git add .
git commit -m "v3.16.7: Portal Sharing - Removed auto-email, added auto-copy to clipboard - %date% %time%"

echo [4/4] PUSHING TO PRODUCTION...
git push origin HEAD:main --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deployment failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===========================================
echo DEPLOYMENT SUCCESSFUL! Version 3.16.7 is live.
echo ===========================================
pause
