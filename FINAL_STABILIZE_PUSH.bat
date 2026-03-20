@echo off
title AUCLAIRE FINAL STABILIZE PUSH (v36.1)
echo ===========================================
echo [1/3] STAGING ALL CHANGES
echo ===========================================
git add --all
echo.
echo ===========================================
echo [2/3] COMMITTING FINAL BUILD FIX
echo ===========================================
git commit -m "Fix: Final build stability v36.1 - Task differentiation & manual creation" --no-verify
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
