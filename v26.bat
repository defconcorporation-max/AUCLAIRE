@echo off
echo Deploying Auclaire App v3.7.1...
echo.
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Error during git add
    pause
    exit /b %ERRORLEVEL%
)

git commit -m "Fix build error and finalize standardized reporting v3.7.1"
if %ERRORLEVEL% NEQ 0 (
    echo No changes to commit or commit failed.
)

git push
if %ERRORLEVEL% NEQ 0 (
    echo Git push failed. Please check your internet connection or credentials.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Deployment successful! Version v3.7.1 is now live.
pause
