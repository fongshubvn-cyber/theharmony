@echo off
chcp 65001 > nul
title The Harmony - Deploy
cd /d "%~dp0"

echo ===================================================
echo   THE HARMONY - DUA WEBSITE LEN MANG (GitHub Pages)
echo ===================================================
echo.

set "REPO=https://github.com/fongshubvn-cyber/theharmony.git"
set "SITE=https://fongshubvn-cyber.github.io/theharmony/"

rem ---- Tim Git (cai san hoac di kem GitHub Desktop) ----
set "GIT_CMD="
where git >nul 2>nul
if %errorlevel% equ 0 (
    set "GIT_CMD=git"
) else (
    for /d %%d in ("%LocalAppData%\GitHubDesktop\app-*") do (
        if exist "%%d\resources\app\git\cmd\git.exe" set "GIT_CMD=%%d\resources\app\git\cmd\git.exe"
    )
)
if not defined GIT_CMD (
    echo [LOI] Khong tim thay Git tren may.
    echo Cai GitHub Desktop hoac Git for Windows roi bam lai file nay.
    pause
    exit /b 1
)

rem ---- Lan dau: noi thu muc nay voi repo GitHub, giu nguyen lich su cu ----
if not exist ".git" (
    echo [+] Lan dau: dang ket noi voi %REPO% ...
    "%GIT_CMD%" init -q
    "%GIT_CMD%" remote add origin %REPO%
    "%GIT_CMD%" fetch -q origin main
    if errorlevel 1 (
        echo [LOI] Khong tai duoc repo. Kiem tra mang hoac quyen truy cap GitHub.
        rmdir /s /q .git
        pause
        exit /b 1
    )
    "%GIT_CMD%" reset -q --soft origin/main
    "%GIT_CMD%" branch -M main
    "%GIT_CMD%" branch -q --set-upstream-to=origin/main main
)

rem ---- Ten nguoi commit (chi dat neu may chua co) ----
"%GIT_CMD%" config user.name >nul 2>nul || "%GIT_CMD%" config user.name "The Harmony"
"%GIT_CMD%" config user.email >nul 2>nul || "%GIT_CMD%" config user.email "theharmony@users.noreply.github.com"

echo [+] Cac file thay doi:
"%GIT_CMD%" add -A
"%GIT_CMD%" status -s
echo.

"%GIT_CMD%" diff --cached --quiet
if %errorlevel% equ 0 goto nochange

set "MSG="
set /p MSG="Ghi chu cho lan cap nhat nay (Enter de bo qua): "
if "%MSG%"=="" set "MSG=Cap nhat website %date% %time%"
"%GIT_CMD%" commit -q -m "%MSG%"
if errorlevel 1 (
    echo [LOI] Khong tao duoc ban cap nhat. Chup man hinh gui lai de kiem tra.
    pause
    exit /b 1
)
goto push

:nochange
echo Khong co file nao thay doi.

:push
echo.
echo [+] Dang day len GitHub...
"%GIT_CMD%" push origin main
if %errorlevel% neq 0 (
    echo.
    echo [THAT BAI] Chua day len duoc. Thu lai sau, hoac mo GitHub Desktop de dang nhap.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   [XONG] Website se cap nhat sau 1-2 phut tai:
echo   %SITE%
echo ===================================================
start "" "%SITE%"
pause
