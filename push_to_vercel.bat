@echo off
echo =======================================================
echo Auclaire APP - Simplified Push to Vercel
echo =======================================================
echo.

:: Ensure we are in the right directory
cd /d "%~dp0"
echo Current Directory: %cd%

echo [1/5] Diagnostics...
git --version
git remote -v
echo.

echo [2/5] Cleaning git locks...
if exist ".git\index.lock" (
    del /f /q ".git\index.lock"
    echo Cleaned lock file.
)

echo [3/5] Syncing with remote...
git pull origin main --rebase

echo [4/5] Updating heartbeat...
echo Last deploy trigger: %date% %time% > force_deploy.txt

echo [5/5] Committing changes...
git add -A
git status --short

set MSG=%*
if "%MSG%"=="" set MSG="Update: Luxury Features & Tax - %date% %time%"

echo Committing with message: %MSG%
git commit -m %MSG%

echo.
echo [6/6] Pushing to GitHub...
git push origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Push failed.
    echo Check your internet or if GitHub needs a password.
    pause
    exit /b 1
)

echo.
echo =======================================================
echo SUCCESS! Vercel deployment triggered.
echo =======================================================
echo.
pause
