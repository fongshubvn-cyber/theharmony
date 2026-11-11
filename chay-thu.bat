@echo off
chcp 65001 > nul
title The Harmony - Xem thu tren may
cd /d "%~dp0"
echo Mo trinh duyet tai http://localhost:8080  (dong cua so nay de tat)
echo.
where python >nul 2>nul && (start "" http://localhost:8080/ & python -m http.server 8080 & goto :eof)
where py >nul 2>nul && (start "" http://localhost:8080/ & py -m http.server 8080 & goto :eof)
where npx >nul 2>nul && (start "" http://localhost:8080/ & npx --yes http-server -p 8080 -c-1 & goto :eof)
echo [LOI] May chua co Python hoac Node.js de chay thu.
echo Cai Python tai https://www.python.org/downloads/ (tick "Add Python to PATH").
pause
