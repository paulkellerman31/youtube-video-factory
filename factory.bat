@echo off
REM ============================================================
REM  FACTORY - rend TOUS les projets en attente (backlog)
REM  Idempotent : les videos deja rendues sont skippees (0 cout).
REM  Double-clique pour tout rendre. Pour un seul projet :
REM  glisse-depose son dossier sur run-windows.bat
REM ============================================================
cd /d "%~dp0"

where node >nul 2>nul || (echo [ERREUR] Node introuvable. ^& pause ^& exit /b 1)
where ffmpeg >nul 2>nul || (echo [ERREUR] FFmpeg introuvable. ^& pause ^& exit /b 1)
if not exist node_modules call npm install --no-fund --no-audit
if not exist node_modules\playwright call npm install --no-fund --no-audit
if not exist "%LOCALAPPDATA%\ms-playwright" call npx playwright install chromium

for /r "%~dp0projects" %%f in (project-config.json) do call :render "%%~dpf"
echo.
echo ============================================================
echo  Termine. Verifie final.mp4 dans chaque dossier projet.
echo ============================================================
pause
exit /b

:render
set "DIR=%~1"
if "%DIR:~-1%"=="\" set "DIR=%DIR:~0,-1%"
echo %DIR% | find "_example" >nul && exit /b
echo.
echo [RENDU] %DIR%
call npm run factory --silent -- run "%DIR%"
exit /b
