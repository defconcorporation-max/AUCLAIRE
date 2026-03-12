@echo off
echo =======================================================
echo Auclaire APP - Push to Vercel
echo =======================================================
echo.

cd /d "f:\Entreprises\Auclaire\Auclaire APP"

echo Cleaning up any git locks...
IF EXIST ".git\index.lock" (
    del /f /q ".git\index.lock"
    echo Cleaned git lock file.
) ELSE (
    echo No lock file found.
)

echo.
echo [1/3] Staging all changes...
git add -A
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: git add failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Committing changes...
git commit -m "fix: resolve all TypeScript build errors - remove framer-motion"
IF %ERRORLEVEL% NEQ 0 (
    echo NOTE: Nothing to commit or commit failed. Trying push anyway...
)

echo.
echo [3/3] Pushing to GitHub...
git push origin main
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Push failed! You may need to authenticate.
    echo Try running: git push origin main
    pause
    exit /b 1
)

echo.
echo =======================================================
echo SUCCESS! Vercel should start deploying now.
echo =======================================================
pause
