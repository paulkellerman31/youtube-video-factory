# ============================================================
#  Importe tes captures Beacons dans la video beacons-shadowban.
#  Ouvre 4 fenetres "choisis un fichier". Pour chacune, selectionne
#  la capture demandee dans le titre. Le script renomme et convertit
#  en vrai PNG automatiquement. Tu n'as rien d'autre a faire.
# ============================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$dest = "C:\Users\nares\Desktop\youtube-video-factory\projects\ofm\2026-06-09_beacons-shadowban\assets\captures"
if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }

$cibles = @(
  @{ nom = "s11.png"; desc = "1/4 - les 4 PAGES BIO (jf.okay / arnaldomangini / angelgrace2 / readchoi)" },
  @{ nom = "s19.png"; desc = "2/4 - le DASHBOARD Home/Analytics (Total Views / Followers / Earnings)" },
  @{ nom = "s22.png"; desc = "3/4 - l'EDITEUR Link in Bio (blocs Header, Useful links for OFM, Text...)" },
  @{ nom = "s26.png"; desc = "4/4 - LINK IN BIO DESIGN (preview telephone ofmtools)" }
)

$ok = 0
foreach ($c in $cibles) {
  $dlg = New-Object System.Windows.Forms.OpenFileDialog
  $dlg.Title  = "Choisis : " + $c.desc
  $dlg.Filter = "Images|*.png;*.jpg;*.jpeg;*.webp;*.bmp|Tous les fichiers|*.*"
  if ($dlg.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    Write-Host ("IGNORE (annule) : " + $c.nom) -ForegroundColor Yellow
    continue
  }
  $out = Join-Path $dest $c.nom
  try {
    $img = [System.Drawing.Image]::FromFile($dlg.FileName)
    $img.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Host ("OK : " + [System.IO.Path]::GetFileName($dlg.FileName) + "  ->  " + $c.nom) -ForegroundColor Green
    $ok++
  } catch {
    Write-Host ("ERREUR sur " + $c.nom + " : " + $_.Exception.Message) -ForegroundColor Red
  }
}

Write-Host ""
Write-Host ("Termine : $ok / 4 captures importees dans :") -ForegroundColor Cyan
Write-Host $dest
Write-Host ""
Write-Host "Etape suivante : double-clique factory.bat pour relancer le rendu." -ForegroundColor Cyan
Read-Host "Appuie sur Entree pour fermer"
