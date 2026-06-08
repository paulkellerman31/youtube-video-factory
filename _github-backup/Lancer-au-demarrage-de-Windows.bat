@echo off
chcp 65001 >nul
REM Ajoute la sauvegarde auto au demarrage de Windows (raccourci dans le dossier Demarrage)
cd /d "%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%~dp0Demarrer-Sauvegarde-Auto.bat"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP%\Sauvegarde-GitHub.lnk'); $s.TargetPath='%TARGET%'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()"

echo.
echo La sauvegarde automatique demarrera maintenant a chaque ouverture de session Windows.
echo Pour la retirer : supprime 'Sauvegarde-GitHub.lnk' dans le dossier
echo   %STARTUP%
echo.
pause
