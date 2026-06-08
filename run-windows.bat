@echo off
REM ============================================================
REM  YouTube Video Factory - run local (Windows)
REM  Prerequis - une seule fois :
REM    winget install OpenJS.NodeJS.LTS
REM    winget install Gyan.FFmpeg
REM  - puis rouvrir un terminal pour rafraichir le PATH -
REM ============================================================
cd /d "%~dp0"

where node >nul 2>nul || (echo [ERREUR] Node introuvable. Lance: winget install OpenJS.NodeJS.LTS & pause & exit /b 1)
where ffmpeg >nul 2>nul || (echo [ERREUR] FFmpeg introuvable. Lance: winget install Gyan.FFmpeg & pause & exit /b 1)

if not exist node_modules (
  echo [SETUP] npm install...
  call npm install --no-fund --no-audit || (pause & exit /b 1)
)
if not exist node_modules\playwright (
  echo [SETUP] npm install pour playwright...
  call npm install --no-fund --no-audit || (pause & exit /b 1)
)
if not exist "%LOCALAPPDATA%\ms-playwright" (
  echo [SETUP] Telechargement Chromium pour screen_capture - environ 170 Mo, une seule fois...
  call npx playwright install chromium || (pause & exit /b 1)
)

set PROJECT=projects/ofm/2026-06-07_brightdata-threshold-myth
if not "%~1"=="" set PROJECT=%~1

echo [RUN] factory run %PROJECT% %2 %3
call npm run factory --silent -- run %PROJECT% %2 %3
echo.
echo Termine. Verifie que final.mp4 existe dans %PROJECT%
pause
