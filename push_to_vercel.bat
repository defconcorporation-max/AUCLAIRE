@echo off
setlocal
echo ========================================
echo AUCLAIRE - VERCEL DEPLOYMENT TRIGGER
echo ========================================

:: Check for git
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    exit /b 1
)

:: Sync first
echo [1/4] Syncing with remote...
git pull origin main --rebase

:: Heartbeat
echo [2/4] Updating heartbeat...
echo Last deploy trigger: %date% %time% > force_deploy.txt

:: Commit and Push
echo [3/4] Staging and Committing...
git add .
:: Use a more descriptive default or allow override
set COMMIT_MSG="Update: Hierarchical Product Catalog and Estimator feature (automated)"
git commit -m %COMMIT_MSG%

echo [4/4] Pushing to Vercel...
git push origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Push failed. Please check your connection or git status.
    pause
) else (
    echo.
    echo [SUCCESS] Deployment trigger sent to Vercel successfully.
    timeout /t 5
)
