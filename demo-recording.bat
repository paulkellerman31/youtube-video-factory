@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo == Demo capture video d un site outil ==
echo.
if not exist node_modules\playwright (
  echo Installation de Playwright ^(une seule fois^)...
  call npm i playwright
  call npx playwright install chromium
)
npx tsx scripts/demo-recording.ts
echo.
pause
