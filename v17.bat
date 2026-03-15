@echo off
echo Deploying Auclaire App v3.6.0...
git add .
git commit -m "Analytics: Toggleable Daily Business Report (Snapshot) v3.6.0"
git push
echo Done! Run 'npm run build' if needed.
