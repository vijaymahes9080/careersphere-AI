@echo off
setlocal
title CareerSphere AI

echo ===================================================
echo   CareerSphere AI - Career Intelligence Platform
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in your PATH.
    echo Please install Node.js from https://nodejs.org/ to run CareerSphere AI locally.
    echo.
    echo Alternatively, you can use the live hosted version at:
    echo https://vijaymahes9080.github.io/careersphere-AI/
    echo.
    pause
    exit /b 1
)

echo Starting local server at http://localhost:8080 ...
echo Opening your default browser...
echo Press Ctrl+C in this window to stop the server.
echo.

:: Launch browser in background after 1 second
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:8080"

:: Start the zero-dependency Node server
node server.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server stopped with an error.
    pause
)
