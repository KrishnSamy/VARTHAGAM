@echo off
chcp 65001 > nul
title VARTHAGAM Web App Launcher

echo ======================================================
echo    VARTHAGAM (வர்த்தகம்) - Web App Launcher
echo ======================================================
echo.
echo [*] Starting local web server...

set PATH=C:\Users\acer\tools\node;%PATH%

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [*] Running with Node.js engine...
    node "%~dp0server.js"
    goto end
)

echo [*] Starting via Windows PowerShell engine...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = 5173; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:' + $port + '/'); $listener.Start(); Write-Host 'Listening at http://localhost:' $port '/'; Start-Process ('http://localhost:' + $port + '/'); while ($listener.IsListening) { $context = $listener.GetContext(); $req = $context.Request; $res = $context.Response; $path = Join-Path '%~dp0' ($req.Url.LocalPath.TrimStart('/')); if (-not (Test-Path $path) -or (Test-Path $path -PathType Container)) { $path = Join-Path '%~dp0' 'index.html' }; $bytes = [System.IO.File]::ReadAllBytes($path); $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length); $res.OutputStream.Close() }"

:end
pause
