@echo off
echo Deploying Auclaire App v3.5.2...
git add .
git commit -m "Analytics: Dynamic period-specific KPIs (Day/Week/Month/Total) v3.5.2"
git push
echo Done! Run 'npm run build' if needed.
