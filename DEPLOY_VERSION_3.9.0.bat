@echo off
echo.
echo [ DEPLOYER_V3.9.0 - CONTEXTUAL PROJECT CHAT ]
echo.
git add .
git commit -m "Deployment: v3.9.0 - Feature Contextual Project Chat (Internal/Client Channels)"
git push origin main
echo.
echo DEPLOIEMENT ENVOYE ! Attendez 1-2 minutes que Vercel finisse le build.
pause
