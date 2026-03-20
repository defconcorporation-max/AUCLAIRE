@echo off
title AUCLAIRE GIT FIX & PUSH (v33)
echo ===========================================
echo [1/3] COMMITTING LOCAL FIXES
echo ===========================================
git add .
git commit -m "Fix: Tasks page crash & defensive checks"
echo.
echo ===========================================
echo [2/3] SYNCING WITH GITHUB (REBASE)
echo ===========================================
git pull origin main --rebase
echo.
echo ===========================================
echo [3/3] PUSHING TO PRODUCTION (HEAD -> main)
echo ===========================================
git push origin HEAD:main --force
echo.
echo ===========================================
echo FIX COMPLETED - VERIFIEZ VERCEL
echo ===========================================
pause
