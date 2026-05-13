@echo off
title AMDOX Certificate System — Backend Server
echo ============================================
echo   AMDOX Certificate Verification System
echo   Starting backend on http://localhost:4000
echo ============================================
echo.
cd /d "%~dp0backend"
call npm run dev
pause
