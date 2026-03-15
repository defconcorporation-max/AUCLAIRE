@echo off
echo Deploying Auclaire App v3.5.6...
git add .
git commit -m "Profile: Comprehensive sales history with client names v3.5.6"
git push
echo Done! Run 'npm run build' if needed.
