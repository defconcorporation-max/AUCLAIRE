@echo off
echo.
echo [ DEPLOYER_V3.11.1 - CRITICAL BUILD FIX ]
echo.
git add .
git commit -m "Deployment: v3.11.1 - Fixed missing useMemo import in FlashCalculator.tsx causing build failure."
git push origin main
echo.
echo DEPLOIEMENT ENVOYE ! Attendez 1-2 minutes que Vercel finisse le build.
pause
