@echo off
echo.
echo [ DEPLOYER_V4.0.0 - AUCLAIRE EMPIRE HUB ]
echo [ Marketing Hub + Admin Dashboard Dashboard ]
echo.
echo 1. Adding changes...
git add .
echo.
echo 2. Committing...
git commit -m "Deployment: v4.0.0 - Auclaire Empire Hub (Marketing & Admin Dashboard)"
echo.
echo 3. Pushing to GitHub...
git push origin main
echo.
echo DEPLOIEMENT ENVOYE ! 
echo Attendez 1-2 minutes que Vercel finisse le build.
echo Ensuite, faites un Ctrl + F5 sur votre navigateur.
echo.
pause
