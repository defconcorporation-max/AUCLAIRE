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
:: Comprehensive commit message for all recent features, fixes and mobile polish
git commit -m "Feature: Flash Quote v4 (Final Mobile Polish, Zero Overlap, Selection Memory, Stability, Commission Fix) - %date% %time%"

echo [4/4] PUSHING TO PRODUCTION...
git push origin main

echo.
echo ===========================================
echo DEPLOYMENT TRIGGER COMPLETED
echo PLEASE CHECK VERCEL DASHBOARD FOR STATUS
echo ===========================================
pause
