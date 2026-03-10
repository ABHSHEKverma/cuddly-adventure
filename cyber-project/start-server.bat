`@echo off
echo  Website Rate Limiting Security Gateway
echo.

taskkill /IM node.exe /F >nul 2>&1
timeout /t 1 /nobreak >nul

echo Starting server on http://localhost:3000 ...
echo Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" server.js
pause
