@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI Assistant Proxy Server Manager
echo ========================================
echo.

:menu
echo 请选择操作:
echo 1. 启动代理服务器
echo 2. 停止代理服务器
echo 3. 重启代理服务器
echo 4. 检查状态
echo 5. 退出
echo.
set /p choice="请输入选项 (1-5): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto exit
echo 无效选项，请重新选择
echo.
goto menu

:start
echo.
echo 正在启动代理服务器...
echo 检查端口占用情况...

netstat -ano | findstr ":8889" >nul 2>&1
if %errorlevel% equ 0 (
    echo 警告: 端口8889已被占用
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8889"') do (
        echo 占用进程PID: %%a
        set /p kill_choice="是否终止该进程? (y/n): "
        if /i "!kill_choice!"=="y" (
            taskkill /PID %%a /F >nul 2>&1
            echo 进程已终止
        ) else (
            echo 取消启动
            goto menu
        )
    )
)

netstat -ano | findstr ":9998" >nul 2>&1
if %errorlevel% equ 0 (
    echo 警告: 端口9998已被占用
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9998"') do (
        echo 占用进程PID: %%a
        set /p kill_choice="是否终止该进程? (y/n): "
        if /i "!kill_choice!"=="y" (
            taskkill /PID %%a /F >nul 2>&1
            echo 进程已终止
        ) else (
            echo 取消启动
            goto menu
        )
    )
)

echo 启动代理服务器...
start "AI Assistant Proxy Server" node dark-server.js
echo 代理服务器已启动
echo 服务器地址:
echo - HTTP代理: http://127.0.0.1:8889
echo - WebSocket: ws://127.0.0.1:9998
echo.
pause
goto menu

:stop
echo.
echo 正在停止代理服务器...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8889"') do (
    echo 终止进程PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9998"') do (
    echo 终止进程PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo 代理服务器已停止
echo.
pause
goto menu

:restart
echo.
echo 正在重启代理服务器...
call :stop
timeout /t 2 /nobreak >nul
call :start
goto menu

:status
echo.
echo 检查代理服务器状态...
echo.
echo 端口8889状态:
netstat -ano | findstr ":8889" >nul 2>&1
if %errorlevel% equ 0 (
    echo [运行中] HTTP代理服务器
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8889"') do (
        echo 进程PID: %%a
    )
) else (
    echo [未运行] HTTP代理服务器
)

echo.
echo 端口9998状态:
netstat -ano | findstr ":9998" >nul 2>&1
if %errorlevel% equ 0 (
    echo [运行中] WebSocket服务器
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9998"') do (
        echo 进程PID: %%a
    )
) else (
    echo [未运行] WebSocket服务器
)

echo.
pause
goto menu

:exit
echo.
echo 感谢使用AI Assistant Proxy Server Manager
echo.
exit /b 0 