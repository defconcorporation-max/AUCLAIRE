@echo off
echo Deploying Auclaire App v3.6.5...
git add .
git commit -m "Snapshot historical backfill and logic polish v3.6.5"
git push
echo Done! 
