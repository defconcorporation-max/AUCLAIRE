@echo off
title AUCLAIRE GIT FIX & PUSH
echo ===========================================
echo [1/2] SYNCING WITH GITHUB (REBASE)
echo ===========================================
:: Forcer le pull du repo principal
git pull origin main --rebase
echo.
echo ===========================================
echo [2/2] PUSHING TO PRODUCTION (HEAD -> main)
echo ===========================================
:: Pousse le code actuel directement vers main
git push origin HEAD:main
echo.
echo ===========================================
echo FIX COMPLETED - VERIFIEZ VERCEL
echo ===========================================
pause
