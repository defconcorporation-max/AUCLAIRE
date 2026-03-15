@echo off
echo Deploying Auclaire App v3.5.5...
git add .
git commit -m "Affiliates: Include Admins and dual sales attribution v3.5.5"
git push
echo Done! Run 'npm run build' if needed.
