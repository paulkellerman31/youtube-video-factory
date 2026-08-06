@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo == TEST : capture du dashboard connecte (profil .chrome-record) ==
echo.

if not exist ".chrome-record" (
  echo [ARRET] Le profil d enregistrement n existe pas encore.
  echo.
  echo   1. Lance record-profile.bat
  echo   2. Connecte-toi a BotPenguin dans la fenetre qui s ouvre
  echo   3. FERME cette fenetre
  echo   4. Relance ce fichier
  echo.
  pause
  exit /b 1
)

echo   Aucune fenetre ne va s ouvrir : le navigateur tourne sans affichage.
echo   Ton ecran reste libre, ca prend ~15 s.
echo.

set DEMO_URL=https://app.botpenguin.com/home-v2
set DEMO_AUTH=1
npx tsx scripts/demo-recording.ts

echo.
echo   Sortie : demo-app-botpenguin-com-home-v2.mp4
echo.
pause
