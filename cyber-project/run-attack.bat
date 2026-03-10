@echo off
echo  DDoS Attack Simulation
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" ddos-test.js
echo.
pause
