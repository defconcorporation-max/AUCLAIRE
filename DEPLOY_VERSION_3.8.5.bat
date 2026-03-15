@echo off
echo.
echo [ DEPLOYER_V3.8.5 - BETA FEEDBACK FINAL FIXES ]
echo.
git add .
git commit -m "Deployment: v3.8.5 - Beta Feedback Final Collaboration Fixes"
git push origin main
echo.
echo DEPLOIEMENT ENVOYE ! Attendez 1-2 minutes que Vercel finisse le build.
pause
