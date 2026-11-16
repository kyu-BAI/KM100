@echo off
title PETC Inventory & Document Viewing System
echo ===================================================
echo   Starting PETC Inventory & Document Viewing System
echo ===================================================
echo.

set "PATH=C:\Program Files\nodejs;%PATH%"

echo Starting Backend Server (Port 5000)...
start "PETC-Backend" cmd /k "cd /d "%~dp0BACKEND" && node server.js"

timeout /t 2 >nul

echo Starting Frontend Web App (Port 3000)...
start "PETC-Frontend" cmd /k "cd /d "%~dp0FRONTEND" && npm.cmd run dev -- --port 3000"

timeout /t 3 >nul

echo Opening Browser...
start http://localhost:3000

echo.
echo Both servers are running!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
