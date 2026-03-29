@echo off
title AUCLAIRE DEPLOYER - PRODUCTION
setlocal enabledelayedexpansion

echo ===========================================
echo AUCLAIRE - PRODUCTION DEPLOYMENT
echo ===========================================

:: [1/4] SYNCING WITH GITHUB
echo [1/4] SYNCING WITH GITHUB...
git pull origin main --rebase
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Sync failed or merge needed. Attempting to continue...
)

:: [2/4] UPDATING HEARTBEAT
echo [2/4] UPDATING HEARTBEAT...
echo %date% %time% > force_deploy.txt

:: [3/4] COMMITTING CHANGES
echo [3/4] COMMITTING CHANGES...
git add .
set COMMIT_MSG=%~1
if "!COMMIT_MSG!"=="" set COMMIT_MSG=System Update - %date% %time%
git commit -m "!COMMIT_MSG!" --no-verify

:: [4/4] PUSHING TO PRODUCTION
echo [4/4] PUSHING TO PRODUCTION...
git push origin HEAD:main --force

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deployment failed! Check your connection and credentials.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===========================================
echo DEPLOYMENT SUCCESSFUL! Vercel build started.
echo ===========================================
pause
