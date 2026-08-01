@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p URL="URL de l outil (ex: https://botpenguin.com/) : "
npx tsx scripts/recon.ts %URL%
echo.
pause
