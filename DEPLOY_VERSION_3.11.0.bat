@echo off
echo.
echo [ DEPLOYER_V3.11.0 - TYPE SECURITY & PERFORMANCE FIXES ]
echo.
git add .
git commit -m "Deployment: v3.11.0 - Fixed synchronous setState in FlashCalculator, converted prices to constants, and reduced 'any' types for better security."
git push origin main
echo.
echo DEPLOIEMENT ENVOYE ! Attendez 1-2 minutes que Vercel finisse le build.
pause
