# ============================================================
#  Sauvegarde automatique vers GitHub (mode GitHub Desktop)
#  Surveille le projet et envoie chaque modification.
#  Laisse cette fenetre ouverte (tu peux la reduire).
# ============================================================

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

# --- Retrouver git (PATH, Git for Windows, ou GitHub Desktop) ---
function Get-GitPath {
    $g = Get-Command git -ErrorAction SilentlyContinue
    if ($g) { return "git" }
    $candidats = @(
        "$env:ProgramFiles\Git\cmd\git.exe",
        "${env:ProgramFiles(x86)}\Git\cmd\git.exe"
    )
    foreach ($c in $candidats) { if (Test-Path $c) { return $c } }
    # git embarque dans GitHub Desktop
    $gd = Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue |
          Sort-Object FullName -Descending | Select-Object -First 1
    if ($gd) { return $gd.FullName }
    return $null
}

$git = Get-GitPath
if (-not $git) {
    Write-Host "[ERREUR] git introuvable. Installe GitHub Desktop (ou Git for Windows)." -ForegroundColor Red
    Write-Host "   https://desktop.github.com" -ForegroundColor Yellow
    Read-Host "Appuie sur Entree pour fermer"; exit 1
}

if (-not (Test-Path ".git")) {
    Write-Host "[ERREUR] Le projet n'est pas encore publie sur GitHub." -ForegroundColor Red
    Write-Host "Ouvre d'abord GitHub Desktop et publie ce dossier (voir LISEZ-MOI.md)." -ForegroundColor Yellow
    Read-Host "Appuie sur Entree pour fermer"; exit 1
}

# Intervalle de verification (secondes). 10s = quasi temps reel.
$Intervalle = 10

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "  Sauvegarde automatique ACTIVE" -ForegroundColor Green
Write-Host "  Dossier : $RepoRoot" -ForegroundColor Gray
Write-Host "  Chaque modification part sur GitHub sous ~$Intervalle s." -ForegroundColor Gray
Write-Host ""
Write-Host "  Garde cette fenetre ouverte (tu peux la reduire)." -ForegroundColor Yellow
Write-Host "  Pour arreter : ferme la fenetre." -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Determiner la branche (main ou master)
$branche = (& $git rev-parse --abbrev-ref HEAD 2>$null)
if ([string]::IsNullOrWhiteSpace($branche)) { $branche = "main" }

while ($true) {
    try {
        $changes = & $git status --porcelain 2>$null
        if (-not [string]::IsNullOrWhiteSpace($changes)) {
            $horodatage = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            & $git add -A 2>$null
            & $git commit -q -m "Sauvegarde auto $horodatage" 2>$null
            & $git push origin $branche 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$horodatage] Modifications sauvegardees sur GitHub." -ForegroundColor Green
            } else {
                Write-Host "[$horodatage] Envoi differe (hors connexion ?). Nouvel essai bientot." -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "Erreur temporaire : $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
    Start-Sleep -Seconds $Intervalle
}
