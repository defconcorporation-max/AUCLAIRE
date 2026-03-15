@echo off
echo Deploying Auclaire App v3.6.2...
git add .
git commit -m "Snapshot: Fixed financial accuracy and activity attribution v3.6.2"
git push
echo Done! 
