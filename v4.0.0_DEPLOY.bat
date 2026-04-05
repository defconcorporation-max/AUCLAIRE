@echo off
echo.
echo [ DEPLOYER_V4.0.0 - AUCLAIRE EMPIRE HUB ]
echo [ Marketing Hub + Admin Dashboard ]
echo.
echo 1. Adding changes...
git add .
echo.
echo 2. Committing...
git commit -m "Deployment: v4.0.0 - Auclaire Empire Hub (Marketing & Admin Dashboard)"
echo.
echo 3. Synchronizing with Remote (Pulling main changes)...
git pull origin main --rebase
echo.
echo 4. FORCING PUSH TO PRODUCTION...
echo (Pushing current HEAD to main)
git push origin HEAD:main
echo.
echo DEPLOIEMENT ENVOYE ! 
echo Attendez 1-2 minutes que Vercel finisse le build.
echo.
pause
