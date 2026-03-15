@echo off
echo Force Refreshing and Deploying Auclaire App v3.6.1...
git add .
git commit -m "Analytics: Critical Fix - Move Snapshot to CRMLayout and update Version v3.6.1"
git push
echo Done! 
