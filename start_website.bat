@echo off
title PRILOK Website Local Server
echo Starting PRILOK Website on http://localhost:8080/ ...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080
pause
