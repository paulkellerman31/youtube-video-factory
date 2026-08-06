@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo == Lecture des sections du dashboard connecte ==
echo    Lecture seule : aucun clic, aucune modification, rien ne sort de la machine.
echo.

if not exist ".chrome-record" (
  echo [ARRET] Profil d enregistrement absent. Lance record-profile.bat d abord.
  pause
  exit /b 1
)

npx tsx scripts/list-dashboard-urls.ts %1

echo.
pause
