@echo off
echo Deploying Auclaire App v3.6.4...
git add .
git commit -m "Snapshot deduplication and unique markers v3.6.4"
git push
echo Done! 
