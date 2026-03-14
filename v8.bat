@echo off
echo Deploying Auclaire App v3.4.8...
git add .
git commit -m "Dashboard: Restore 'En Attente de Collection' metric v3.4.8"
git push
echo Done! Run 'npm run build' if needed.
