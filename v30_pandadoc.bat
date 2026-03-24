@echo off
echo ===========================================
echo [1/3] COMMITTING PANDADOC INTEGRATION
echo ===========================================
git add .
git commit -m "feat: PandaDoc contract generation directly from HTML"
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
echo ALL DONE! REFRESH VERCEL IN 1 MINUTE
echo ===========================================
