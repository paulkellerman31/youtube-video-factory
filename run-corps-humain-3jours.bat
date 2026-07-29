@echo off
REM ============================================================
REM  Lanceur dedie : video "3 jours sans boire" (chaine corps-humain)
REM  Double-clique ce fichier pour lancer le rendu.
REM  Qualite image forcee en HIGH pour cette chaine cartoon.
REM ============================================================
cd /d "%~dp0"
set IMAGE_QUALITY=high
call "%~dp0run-windows.bat" projects/corps-humain/2026-06-09_3-jours-sans-boire
