@echo off
echo Deploying Auclaire APP v3.15.0 - GHL Task Synchronization...
echo.

:: 1. Force a change to trigger Vercel
echo %date% %time% > force_deploy.txt
echo v3.15.0 - GHL Task Sync Deployment >> force_deploy.txt

:: 2. Git operations
git add .
git commit -m "feat: GHL Task Synchronization (v3.15.0)"
git pull --rebase origin main
git push origin HEAD:main --force

echo.
echo Deployment triggered! Check Vercel dashboard.
pause
