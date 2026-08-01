@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PROJ=projects/ofm/2026-08-01_botpenguin-review

echo.
echo ====================================================
echo   ETAPE 1/2 : VERIFICATION (aucun cout, rien genere)
echo ====================================================
echo.
call npm run factory -- run %PROJ% --dry-run
echo.
echo ====================================================
echo   Relis les lignes ci-dessus.
echo   WARN ou ERROR ? -^> repond N et envoie le log.
echo   Tout est propre ? -^> repond O pour lancer le rendu.
echo ====================================================
echo.
set /p GO="Lancer le rendu reel (environ 1 dollar) ? [O/N] : "
if /i not "%GO%"=="O" goto :fin

echo.
echo ====================================================
echo   ETAPE 2/2 : RENDU (5 a 10 minutes)
echo ====================================================
echo.
call npm run factory -- run %PROJ%
echo.
echo Termine. Le fichier final.mp4 est dans :
echo   %PROJ%

:fin
echo.
pause
