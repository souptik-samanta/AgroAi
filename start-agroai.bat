@echo off
title AgroAI Server
echo ========================================
echo         AgroAI Crop Monitor
echo ========================================
echo.

cd /d "c:\Users\Souptik\Desktop\Ai-crop\my-app"

echo Killing any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo Starting AgroAI server...
echo.
npm start

echo.
echo Server stopped. Press any key to exit...
pause >nul