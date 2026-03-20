@echo off
title AUCLAIRE DEFINITIVE FIX & PUSH (v34)
echo ===========================================
echo [1/3] COMMITTING STABILITY FIXES
echo ===========================================
git add .
git commit -m "Fix: Final defensive checks for Tasks page"
echo.
echo ===========================================
echo [2/3] SYNCING WITH GITHUB
echo ===========================================
git pull origin main --rebase
echo.
echo ===========================================
echo [3/3] FORCE PUSHING TO PRODUCTION
echo ===========================================
git push origin HEAD:main --force
echo.
echo ===========================================
echo ALL DONE! REFRESH YOUR BROWSER IN 1 MINUTE
echo ===========================================
pause
