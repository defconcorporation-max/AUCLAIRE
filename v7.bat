@echo off
echo ===========================================
echo AUCLAIRE - VERCEL DEPLOYMENT (v3.4.7)
echo ===========================================
echo [1/3] ADDING CHANGES...
git add .
echo [2/3] COMMITTING v3.4.7...
git commit -m "Deployment: v3.4.7 - Hierarchy Restructuring Ready"
echo [3/3] PUSHING TO PRODUCTION...
git push origin main
echo ===========================================
echo DONE! PLEASE CHECK VERCEL
echo ===========================================
pause
