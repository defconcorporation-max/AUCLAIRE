@echo off
echo.
echo [ DEPLOYER_V3.10.0 - FINANCE INTELLIGENCE & LUXURY UI ]
echo.
git add .
git commit -m "Deployment: v3.10.0 - Advanced Finance Intelligence, Luxury UI upgrades & Showroom Mode"
git push origin main
echo.
echo DEPLOIEMENT ENVOYE ! Attendez 1-2 minutes que Vercel finisse le build.
pause
