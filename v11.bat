@echo off
echo Deploying Auclaire App v3.5.1...
git add .
git commit -m "Analytics: Add interactive KPI trends and timeframe comparisons v3.5.1"
git push
echo Done! Run 'npm run build' if needed.
