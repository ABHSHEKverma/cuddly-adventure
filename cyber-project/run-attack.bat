@echo off
echo ==============================================
echo  DDoS Attack Simulation
echo ==============================================
echo.
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" ddos-test.js
echo.
pause
