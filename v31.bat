@echo off
echo [ DEPLOYER_V31 - PROFESSIONAL PDF UPGRADE ]
echo.
echo Version change: 3.11.1 -^> 3.12.0
echo Features: Professional French PDF Invoice, Canadian Tax (TPS/TVQ), Payment History.
echo.
git add .
git commit -m "v3.12.0: Professional French PDF Invoice Generator with Canadian Tax Support & Payment History"
echo Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git push failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo DEPLOIEMENT REUSSI ! La version 3.12.0 est en ligne.
pause
