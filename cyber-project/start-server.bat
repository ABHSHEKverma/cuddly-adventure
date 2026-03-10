@echo off
echo ==============================================
echo  Website Rate Limiting Security Gateway
echo ==============================================
echo.

:: Kill any existing node process to free port 3000
taskkill /IM node.exe /F >nul 2>&1
timeout /t 1 /nobreak >nul

echo Starting server on http://localhost:3000 ...
echo Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" server.js
pause
