@echo off
echo Deploying Auclaire App v3.5.4...
git add .
git commit -m "Analytics: Include Admins in Sales Leaderboard with role badges v3.5.4"
git push
echo Done! Run 'npm run build' if needed.
