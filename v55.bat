@echo off
title AUCLAIRE DEPLOYER v55
echo ===========================================
echo AUCLAIRE - VERCEL DEPLOYMENT v3.18.1 (3D Model Notifications)
echo ===========================================

echo [1/4] SYNCING WITH GITHUB...
git pull origin main --rebase

echo [2/4] UPDATING HEARTBEAT...
echo %date% %time% > force_deploy.txt

echo [3/4] COMMITTING CHANGES...
git add .
git commit -m "v3.18.1: Added 3D model email notifications for staff and automated alerts - %date% %time%"

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
echo DEPLOYMENT SUCCESSFUL! Version 3.18.1 is live.
echo ===========================================
pause
