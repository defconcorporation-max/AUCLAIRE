@echo off
echo Deploying Auclaire App v3.5.3...
git add .
git commit -m "Analytics: Add Profit Réel and À Récolter KPIs v3.5.3"
git push
echo Done! Run 'npm run build' if needed.
