@echo off
title AUCLAIRE FINAL STABILIZE PUSH (v37.1)
echo ===========================================
echo [1/3] STAGING ALL CHANGES
echo ===========================================
git add .
echo.
echo ===========================================
echo [2/3] COMMITTING FINAL BUILD FIX
echo ===========================================
git commit -m "[v%VERSION%] %MESSAGE%" --no-verify
echo.
echo ===========================================
echo [3/3] FORCE PUSHING TO PRODUCTION
echo ===========================================
git push origin HEAD:main --force
echo.
echo All stabilized and pushed.
echo ===========================================
echo ALL DONE! REFRESH YOUR BROWSER IN 1 MINUTE
echo ===========================================
pause
