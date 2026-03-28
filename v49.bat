@echo off
title AUCLAIRE DEPLOYER v49
echo ===========================================
echo AUCLAIRE - VERCEL DEPLOYMENT v3.16.8 (Portal UX Overhaul)
echo ===========================================

echo [1/4] SYNCING WITH GITHUB...
git pull origin main --rebase

echo [2/4] UPDATING HEARTBEAT...
echo %date% %time% > force_deploy.txt

echo [3/4] COMMITTING CHANGES...
git add .
git commit -m "v3.16.8: Portal Improvements - Manual link sharing (clipboard) + Image categorization (Initial vs 3D) - %date% %time%"

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
echo DEPLOYMENT SUCCESSFUL! Version 3.16.8 is live.
echo ===========================================
pause
