@echo off
title AUCLAIRE DEPLOYER
echo ===========================================
echo AUCLAIRE - VERCEL DEPLOYMENT TRIGGER
echo ===========================================

echo [1/4] SYNCING WITH GITHUB...
git pull origin main --rebase

echo [2/4] UPDATING HEARTBEAT...
echo %date% %time% > force_deploy.txt

echo [3/4] COMMITTING CHANGES...
git add .
:: Comprehensive commit message for all recent features, fixes, mobile polish and catalog assets
git commit -m "Feature: Dynamic Selection Flow (Infinite Depth) & Catalog Drill-Down Indicators - %date% %time%"

echo [4/4] PUSHING TO PRODUCTION...
git push origin main

echo.
echo ===========================================
echo DEPLOYMENT TRIGGER COMPLETED
echo PLEASE CHECK VERCEL DASHBOARD FOR STATUS
echo ===========================================
pause
