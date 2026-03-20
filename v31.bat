@echo off
title AUCLAIRE DEPLOYER v31
echo ===========================================
echo AUCLAIRE - VERCEL DEPLOYMENT v3.12.0
echo ===========================================

echo [1/4] SYNCING WITH GITHUB...
git pull origin main --rebase

echo [2/4] UPDATING HEARTBEAT...
echo %date% %time% > force_deploy.txt

echo [3/4] COMMITTING CHANGES...
git add .
git commit -m "v3.12.0: Professional French PDF Invoice Generator with Canadian Tax Support & Payment History - %date% %time%"

echo [4/4] PUSHING TO PRODUCTION...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deployment failed! Check your internet or git credentials.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===========================================
echo DEPLOYMENT SUCCESSFUL! Version 3.12.0 is live.
echo Please check Vercel for the build status.
echo ===========================================
pause
