# Reparation + rangement du MCP youtube-studio (robuste)
Write-Host "=== Reparation + rangement MCP youtube-studio ===" -ForegroundColor Cyan

# 1. Verifier que Claude Desktop est ferme (sinon fichiers verrouilles)
$proc = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
if ($proc) {
  Write-Host "Claude Desktop est encore OUVERT." -ForegroundColor Yellow
  Write-Host "Ferme-le completement : clic droit sur l'icone (barre des taches, en bas a droite) -> Quitter."
  Read-Host "Quand c'est ferme, appuie sur Entree"
  Start-Sleep -Seconds 1
  $proc = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
  if ($proc) { Write-Host "Toujours ouvert : je vais quand meme reparer la config (le deplacement peut echouer)." -ForegroundColor Yellow }
}

# 2. Python
$py = $null
foreach ($c in @("python","py","python3")) {
  try { $v = & $c --version 2>&1; if ($v -match "Python 3") { $py = $c; break } } catch {}
}
if (-not $py) { Write-Host "Python introuvable." -ForegroundColor Red; Read-Host "Entree"; exit 1 }
$pyPath = (Get-Command $py).Source

# 3. Localiser le dossier youtube-studio-mcp
$docs    = [Environment]::GetFolderPath("MyDocuments")
$mcpRoot = Join-Path $docs "MCP"
$inDocs  = Join-Path $mcpRoot "youtube-studio-mcp"
$inHome  = Join-Path $env:USERPROFILE "youtube-studio-mcp"

$studio = $null
if (Test-Path (Join-Path $inDocs "scripts\server.py")) {
  $studio = $inDocs
  Write-Host "Trouve (deja range) : $inDocs" -ForegroundColor Green
} elseif (Test-Path (Join-Path $inHome "scripts\server.py")) {
  if (-not (Test-Path $mcpRoot)) { New-Item -ItemType Directory -Path $mcpRoot | Out-Null }
  try {
    Move-Item -Path $inHome -Destination $inDocs -ErrorAction Stop
    $studio = $inDocs
    Write-Host "Deplace vers : $inDocs" -ForegroundColor Green
  } catch {
    $studio = $inHome
    Write-Host "Deplacement impossible (verrouille ?). Je garde l'emplacement actuel et je repare la config." -ForegroundColor Yellow
  }
} else {
  Write-Host "ERREUR : dossier youtube-studio-mcp introuvable." -ForegroundColor Red
  Read-Host "Entree"; exit 1
}

# 3b. Ranger aussi youtube-mcp-server si present (best effort, sans casser)
$ymsHome = Join-Path $env:USERPROFILE "youtube-mcp-server"
$ymsDocs = Join-Path $mcpRoot "youtube-mcp-server"
if ((Test-Path $ymsHome) -and -not (Test-Path $ymsDocs)) {
  if (-not (Test-Path $mcpRoot)) { New-Item -ItemType Directory -Path $mcpRoot | Out-Null }
  try { Move-Item -Path $ymsHome -Destination $ymsDocs -ErrorAction Stop; Write-Host "Range aussi : youtube-mcp-server" -ForegroundColor Green } catch {}
}

# 4. Reecrire une config COMPLETE et correcte (avec cwd)
$cfgPath  = Join-Path (Join-Path $env:APPDATA "Claude") "claude_desktop_config.json"
$serverPy = Join-Path $studio "scripts\server.py"
$cs       = Join-Path $studio "secrets\client_secret.json"
$tok      = Join-Path $studio "secrets\token.json"

$merge = @'
import json, os, sys
cfg_path, py, cwd, server, cs, tok = sys.argv[1:7]
cfg = {}
if os.path.exists(cfg_path):
    raw = open(cfg_path, encoding="utf-8").read().strip()
    if raw:
        cfg = json.loads(raw)
cfg.setdefault("mcpServers", {})
cfg["mcpServers"]["youtube-studio"] = {
    "command": py,
    "args": [server],
    "cwd": cwd,
    "env": {"YOUTUBE_CLIENT_SECRETS": cs, "YOUTUBE_TOKEN_FILE": tok},
}
open(cfg_path, "w", encoding="utf-8").write(json.dumps(cfg, indent=2))
print("Config reecrite -> cwd =", cwd)
'@
$mf = Join-Path $env:TEMP "mcp_fix.py"
Set-Content -Path $mf -Value $merge -Encoding UTF8
& $py $mf $cfgPath $pyPath $studio $serverPy $cs $tok
Remove-Item $mf -ErrorAction SilentlyContinue

# 5. Verification finale
Write-Host ""
Write-Host "--- Verification ---" -ForegroundColor Cyan
Write-Host ("server.py     : " + (Test-Path $serverPy))
Write-Host ("client_secret : " + (Test-Path $cs))
Write-Host ("token.json    : " + (Test-Path $tok))
Write-Host ("Emplacement final : $studio") -ForegroundColor Green
Write-Host ""
Write-Host "Rouvre Claude Desktop -> Parametres -> Developpeur : 'youtube-studio' doit etre 'running'." -ForegroundColor Green
Read-Host "Entree pour fermer"
