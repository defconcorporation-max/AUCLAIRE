@echo off
echo Running Non-Interactive Deployment...

:: Sync first
echo Syncing with remote...
git pull origin main --rebase

:: Heartbeat
echo Updating heartbeat...
echo Last deploy trigger: %date% %time% > force_deploy.txt

:: Commit and Push
echo Staging and Committing...
git add .
git commit -m "Fix UI overlap and z-index stacking conflicts (automated)"
echo Pushing...
git push origin main

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Push failed.
) else (
    echo [SUCCESS] Push successful.
)
