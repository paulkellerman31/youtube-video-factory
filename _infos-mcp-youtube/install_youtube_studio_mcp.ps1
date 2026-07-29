# Installation du MCP YouTube Studio (gestion + analytics + OAuth)
$ErrorActionPreference = "Stop"
Write-Host "=== Installation du MCP YouTube Studio ===" -ForegroundColor Cyan

# 1. Detecter Python 3
$py = $null
foreach ($c in @("python","py","python3")) {
  try { $v = & $c --version 2>&1; if ($v -match "Python 3") { $py = $c; break } } catch {}
}
if (-not $py) {
  Write-Host "ERREUR : Python 3.10+ introuvable." -ForegroundColor Red
  Write-Host "Installe-le depuis https://www.python.org/downloads/ (coche 'Add Python to PATH'), puis relance."
  Read-Host "Entree pour quitter"; exit 1
}
$pyPath = (Get-Command $py).Source
Write-Host "Python detecte : $(& $py --version 2>&1) ($pyPath)" -ForegroundColor Green

# 2. Cloner / telecharger le serveur
$dir = Join-Path $env:USERPROFILE "youtube-studio-mcp"
if (Test-Path (Join-Path $dir "scripts\server.py")) {
  Write-Host "Serveur deja present : $dir" -ForegroundColor Yellow
} else {
  $hasGit = $false; try { git --version | Out-Null; $hasGit = $true } catch {}
  if ($hasGit) {
    Write-Host "Clonage du depot..."
    git clone https://github.com/i1s-abhishek/youtube-studio-mcp.git $dir
  } else {
    Write-Host "git absent : telechargement du ZIP..."
    $zip = Join-Path $env:TEMP "yts.zip"
    Invoke-WebRequest -Uri "https://github.com/i1s-abhishek/youtube-studio-mcp/archive/refs/heads/main.zip" -OutFile $zip
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    Expand-Archive -Path $zip -DestinationPath $env:TEMP -Force
    Move-Item (Join-Path $env:TEMP "youtube-studio-mcp-main") $dir
    Remove-Item $zip
  }
}

# 3. Dossier secrets
$secrets = Join-Path $dir "secrets"
if (-not (Test-Path $secrets)) { New-Item -ItemType Directory -Path $secrets | Out-Null }
$clientSecret = Join-Path $secrets "client_secret.json"
$tokenFile    = Join-Path $secrets "token.json"

# 4. Verifier la presence du client OAuth (etape Google Cloud, manuelle)
if (-not (Test-Path $clientSecret)) {
  Write-Host ""
  Write-Host "=== A FAIRE UNE FOIS DANS GOOGLE CLOUD ===" -ForegroundColor Yellow
  Write-Host "1. https://console.cloud.google.com -> cree ou choisis un projet"
  Write-Host "2. Active DEUX APIs : 'YouTube Data API v3' ET 'YouTube Analytics API'"
  Write-Host "3. Ecran de consentement OAuth -> type External -> renseigne le minimum"
  Write-Host "   -> ajoute TON adresse Gmail dans 'Test users'"
  Write-Host "   (Optionnel : clique 'Publier l'application' pour eviter de te reconnecter tous les 7 jours)"
  Write-Host "4. Identifiants -> Creer des identifiants -> ID client OAuth"
  Write-Host "   -> Type d'application : APPLICATION DE BUREAU (Desktop app) -> Creer"
  Write-Host "5. Telecharge le JSON et enregistre-le EXACTEMENT ici :"
  Write-Host "   $clientSecret" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "J'ouvre la page Google Cloud et le dossier secrets pour toi..."
  try { Start-Process "https://console.cloud.google.com/apis/credentials" } catch {}
  try { Start-Process $secrets } catch {}
  Write-Host ""
  Write-Host ">>> Depose client_secret.json dans le dossier secrets, puis RELANCE ce script. <<<" -ForegroundColor Yellow
  Read-Host "Entree pour fermer"; exit 0
}

# 5. Authentification Google (ouvre le navigateur)
Write-Host ""
Write-Host "Lancement de l'authentification Google..." -ForegroundColor Cyan
Write-Host "Ton navigateur va s'ouvrir. Connecte-toi, accepte l'acces."
Write-Host "(Si Google affiche 'Application non verifiee' : Parametres avances -> Continuer.)"
Push-Location $dir
& $py "scripts/auth.py" auth
Pop-Location
if (-not (Test-Path $tokenFile)) {
  Write-Host "Echec : token.json non cree. Verifie le client OAuth et reessaie." -ForegroundColor Red
  Read-Host "Entree pour fermer"; exit 1
}
Write-Host "Authentification reussie (token.json cree)." -ForegroundColor Green

# 6. Fusionner dans la config Claude Desktop (via Python = JSON propre)
$cfgDir = Join-Path $env:APPDATA "Claude"
if (-not (Test-Path $cfgDir)) { New-Item -ItemType Directory -Path $cfgDir | Out-Null }
$cfgPath  = Join-Path $cfgDir "claude_desktop_config.json"
$serverPy = Join-Path $dir "scripts\server.py"

$merge = @'
import json, os, sys
cfg_path, py, cwd, server, client_secret, token = sys.argv[1:7]
cfg = {}
if os.path.exists(cfg_path):
    with open(cfg_path, encoding="utf-8") as f:
        raw = f.read().strip()
    if raw:
        try:
            cfg = json.loads(raw)
        except Exception:
            os.replace(cfg_path, cfg_path + ".bak")
            print("Config existante illisible -> sauvegarde .bak creee")
            cfg = {}
cfg.setdefault("mcpServers", {})
cfg["mcpServers"]["youtube-studio"] = {
    "command": py,
    "args": [server],
    "cwd": cwd,
    "env": {"YOUTUBE_CLIENT_SECRETS": client_secret, "YOUTUBE_TOKEN_FILE": token},
}
with open(cfg_path, "w", encoding="utf-8") as f:
    json.dump(cfg, f, indent=2)
print("Config mise a jour :", cfg_path)
'@
$mergeFile = Join-Path $env:TEMP "yts_merge.py"
Set-Content -Path $mergeFile -Value $merge -Encoding UTF8
& $py $mergeFile $cfgPath $pyPath $dir $serverPy $clientSecret $tokenFile
Remove-Item $mergeFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Termine ! ===" -ForegroundColor Green
Write-Host "Ferme COMPLETEMENT Claude Desktop (clic droit icone -> Quitter) puis rouvre-le."
Write-Host "L'outil 'youtube-studio' apparaitra dans tes MCP."
Read-Host "Entree pour fermer"
