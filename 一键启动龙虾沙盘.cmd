@echo off
chcp 65001 >nul
title OpenClaw Visualizer Console
echo =========================================
echo Starting OpenClaw Network Visualizer...
echo =========================================
echo.
echo Please wait, the local visualization server is booting up.
echo Your browser will open automatically.
echo.
echo [IMPORTANT] Do not close this black window.
echo If you close this window, the visualizer server will stop.
echo.
node "C:\Users\Administrator\Desktop\OpenClaw-Visualizer-App.js"
pause
