@echo off
:: Set text encoding to UTF-8
chcp 65001 > nul

echo ===================================================
echo   THE HARMONY - TU DONG CAP NHAT LEN GITHUB
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

echo [+] Dang kiem tra danh sach tep tin thay doi...
%GIT_CMD% status -s
echo.

set "COMMIT_MSG="
set /p COMMIT_MSG="Nhap noi dung cap nhat (Bam Enter de dung mac dinh 'Auto-update'): "

if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Auto-update vao luc %date% %time%
)

echo.
echo [+] Dang them cac tep tin moi...
%GIT_CMD% add .

echo [+] Dang luu tru phien ban moi...
%GIT_CMD% commit -m "%COMMIT_MSG%"

echo.
echo [+] Dang day du lieu len GitHub (nhanh main)...
%GIT_CMD% push origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   [THANH CONG] DA DAY LEN GITHUB HOAN TAT!
    echo   Trang web truc tuyen se cap nhat sau it giay.
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo   [THAT BAI] Co loi xay ra trong qua trinh day len.
    echo   Vui long kiem tra ket noi mang.
    echo ===================================================
)

echo.
pause
