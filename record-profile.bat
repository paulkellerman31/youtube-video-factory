@echo off
REM ===========================================================================
REM  PROFIL D'ENREGISTREMENT — a lancer UNE FOIS pour te connecter aux outils.
REM
REM  Pourquoi un dossier separe et pas ton profil Chrome habituel :
REM  Chrome verrouille tout le dossier "User Data", pas un profil. Un profil cree
REM  depuis le menu Chrome vit DEDANS — donc tant que ton Chrome tourne, la
REM  machine ne peut pas l'ouvrir. Avec un dossier a part, les deux cohabitent :
REM  tu gardes ton Chrome ouvert pendant que le rendu tourne.
REM
REM  Ce que tu fais dans cette fenetre :
REM    1. tu te connectes a l'outil a reviewer (Google, email, peu importe)
REM    2. tu verifies que le dashboard s'affiche bien
REM    3. tu FERMES la fenetre  <-- important, sinon le rendu ne pourra pas l'ouvrir
REM
REM  La session reste sur cette machine : le dossier .chrome-record est gitignore
REM  et n'est jamais envoye nulle part. Il vaut un mot de passe.
REM ===========================================================================

setlocal
set PROFILE_DIR=%~dp0.chrome-record

set CHROME="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% (
  echo [ERREUR] Chrome introuvable. Ouvre ce fichier et corrige le chemin.
  pause
  exit /b 1
)

echo.
echo   Ouverture du profil d'enregistrement...
echo   Connecte-toi aux outils, verifie le dashboard, PUIS FERME LA FENETRE.
echo.

%CHROME% --user-data-dir="%PROFILE_DIR%" --no-first-run --no-default-browser-check about:blank

echo.
echo   Fenetre fermee. Le profil est pret : %PROFILE_DIR%
echo   Les scenes marquees "auth": true filmeront cette session.
echo.
pause
