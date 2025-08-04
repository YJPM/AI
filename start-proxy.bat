@echo off
echo ========================================
echo AI Assistant Proxy Server Startup
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found. Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting proxy server...
echo.
echo The proxy server will be available at:
echo - HTTP Proxy: http://127.0.0.1:8889
echo - WebSocket: ws://127.0.0.1:9998
echo.
echo Press Ctrl+C to stop the server
echo.

node dark-server.js 