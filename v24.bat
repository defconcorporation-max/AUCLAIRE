@echo off
echo Deploying Auclaire App v3.6.6...
git add .
git commit -m "Snapshot full historical synchronization v3.6.6"
git push
echo Done! 
