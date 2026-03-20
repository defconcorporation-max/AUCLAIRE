@echo off
title AUCLAIRE GIT FIX & PUSH
echo ===========================================
echo [1/2] SYNCING WITH GITHUB (REBASE)
echo ===========================================
git pull origin main --rebase
echo.
echo ===========================================
echo [2/2] PUSHING TO PRODUCTION
echo ===========================================
git push origin main
echo.
echo ===========================================
echo FIX COMPLETED - CHECK VERCEL
echo ===========================================
pause
