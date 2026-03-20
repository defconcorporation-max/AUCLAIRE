@echo off
title AUCLAIRE FINAL STABILIZE PUSH (v35.4)
echo ===========================================
echo [1/3] STAGING ALL CHANGES
echo ===========================================
git add --all
echo.
echo ===========================================
echo [2/3] COMMITTING FINAL BUILD FIX
echo ===========================================
git commit -m "Fix: Final build stability v35.4 - enhanced error reporting" --no-verify
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
