@echo off
echo.
echo [ DEPLOYER_V4.1.0 - QUICK ACTIONS UPDATE ]
echo [ Marketing Hub + Floating Action Button ]
echo.
echo 1. Adding changes...
git add .
echo.
echo 2. Committing...
git commit -m "feat(marketing): implement floating quick action button and creation modal v4.1.0"
echo.
echo 3. Synchronizing with Remote...
git pull origin main --rebase
echo.
echo 4. FORCING PUSH TO PRODUCTION...
git push origin HEAD:main
echo.
echo DEPLOIEMENT ENVOYE ! (v4.1.0)
echo Attendez 1-2 minutes que Vercel finisse le build.
echo.
pause
