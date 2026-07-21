@echo off
:: Set text encoding to UTF-8
chcp 65001 > nul

echo ===================================================
echo   THE HARMONY - DONG BO DU LIEU TU GITHUB VE LOCAL
echo ===================================================
echo.

rem Di chuyen vao thu muc chua file batch
cd /d "%~dp0"

rem Tim duong dan Git tu dong
set GIT_CMD=
where git >nul 2>nul
if %errorlevel% equ 0 (
    set GIT_CMD=git
) else (
    rem Tim trong thu muc GitHub Desktop
    for /d %%d in ("%LocalAppData%\GitHubDesktop\app-*") do (
        if exist "%%d\resources\app\git\cmd\git.exe" (
            set GIT_CMD="%%d\resources\app\git\cmd\git.exe"
        )
    )
)

if not defined GIT_CMD (
    echo [LOI] Khong tim thay phan mem Git tren he thong!
    echo Vui long mo Github Desktop de thuc hien.
    echo.
    pause
    exit /b
)

echo [+] Dang keo du lieu moi nhat tu GitHub (git pull)...
%GIT_CMD% pull origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   [THANH CONG] DA DONG BO DU LIEU VE MAY CUC BO!
    echo   Thu muc cua ban da duoc cap nhat ban moi nhat.
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo   [THAT BAI] Co loi xay ra trong qua trinh dong bo.
    echo   Vui long kiem tra ket noi mang.
    echo ===================================================
)

echo.
pause
