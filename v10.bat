@echo off
echo Deploying Auclaire App v3.5.0...
git add .
git commit -m "Analytics: Refine Annual Growth chart with 3-way financial split v3.5.0"
git push
echo Done! Run 'npm run build' if needed.
