@echo off
echo Deploying Auclaire App v3.6.3...
git add .
git commit -m "Snapshot database fix and accuracy v3.6.3"
git push
echo Done! 
