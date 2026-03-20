@echo off
title AUCLAIRE DEFINITIVE FIX PUSH (v35)
echo ===========================================
echo [1/3] COMMITTING HYPER-DEFENSIVE FIXES (v35)
echo ===========================================
git add .
git commit -m "Fix: Hyper-defensive checks for Tasks page (v35)"
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
