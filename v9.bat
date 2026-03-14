@echo off
echo Deploying Auclaire App v3.4.9...
git add .
git commit -m "Dashboard: Correct 'En Attente de Collection' calculation v3.4.9"
git push
echo Done! Run 'npm run build' if needed.
