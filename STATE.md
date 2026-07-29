# STATE — où on en est (reprise entre conversations)

> Lis ce fichier en premier pour reprendre. Historique détaillé → `CHANGELOG.md`.
> Améliorations gelées → `ROADMAP.md`. Dernière mise à jour : 2026-06-10.

## 🟢 État actuel

**7 vidéos au total sur la chaîne OFM + 1 démo corps-humain.**

Rendues / publiables :
- `ofm/2026-06-07_brightdata-threshold-myth` — RENDUE, **publiée** (7+ vues).
- `ofm/2026-06-09_nodemaven-quality-filter` — RENDUE, prête à publier (metadata + thumbnail dans le dossier).
- `corps-humain/2026-06-09_3-jours-sans-boire` — RENDUE (démo pour ton frère, pas un canal business).
- `ofm/2026-06-07_stop-being-the-machine` — vidéo test initiale.

Écrites, **PAS encore rendues** (bloquées, voir ci-dessous) — chacune a voiceover + image-prompts + project-config + metadata.md + thumbnail.md :
- `ofm/2026-06-09_anti-detect-browsers` (format B, chain ban)
- `ofm/2026-06-09_beacons-shadowban` (format B, shadowban TikTok ; s11 = capture live homepage Beacons)
- `ofm/2026-06-09_onlyspoofer-phash` (format C, farm-only)
- `ofm/2026-06-09_inro-comment-to-dm` (format B, antagoniste Horloge)
- `ofm/2026-06-09_onlytraffic-roi` (format D, ARPU/ROI)

## 🔴 LE blocage à débloquer (priorité 1)

Le rendu des 5 nouvelles a échoué : **OpenAI a atteint sa limite de facturation** (`billing_hard_limit_reached`). Les 5 VOIX sont générées (ElevenLabs OK), mais **0 image** car OpenAI a refusé dès la 1ʳᵉ.

**Reprise :**
1. platform.openai.com → Settings → Billing → **relever le hard limit** ou **recharger le crédit** (vérifier le moyen de paiement).
2. Double-cliquer `factory.bat`. Grâce à l'idempotence, les 5 voix sont skippées (0 $) ; seules les **images + montage** se font. Coût restant ≈ **10 $**.
3. Vérifier qu'un `final.mp4` apparaît dans chacun des 5 dossiers.

## ⚠️ Deux dossiers factory — à consolider

Il existe DEUX copies sur le disque :
- ✅ **`Desktop\Projets\YouTube\youtube-video-factory`** — LE bon. Tout est ici (7 projets, rendus, presets, factory.bat). **Travailler uniquement ici.**
- ❌ `Desktop\youtube-video-factory` — `projects/` vide, source de confusion. À supprimer une fois sûr que rien d'unique n'y reste.

## 🧰 Rappels d'infra (pièges connus)

- **Sync OneDrive corrompt les fichiers** en écriture rapide : `package.json`, `.bat`, `manifest.json` ont été tronqués plusieurs fois. Si un JSON/script paraît coupé → le réécrire en entier. Idéalement déplacer le projet hors OneDrive (ex. `C:\factory`).
- Les **`.bat` doivent être en CRLF** (sinon "… était inattendu"). `factory.bat` (rend tout le backlog) et `run-windows.bat` (glisser-déposer un dossier dessus = rendre celui-là) sont OK.
- `node_modules` contient des binaires Windows → un rendu ne peut se faire QUE sur ta machine, pas via l'assistant (sandbox Linux, plafond 45 s/commande).
- Ne pas lancer de dry-run côté assistant sur un projet : ça **écrase son `pipeline.log`**.

## 🔌 Connecteurs maintenant disponibles (pour la prochaine conv)

YouTube Studio, Google Analytics et Search Console sont branchés. À exploiter ensuite pour :
- **Récupérer les chiffres** des vidéos publiées (CTR, watch-time, rétention) = le vrai signal qu'on attend avant d'optimiser.
- Gérer titres/descriptions, miniatures, commentaire épinglé via l'API (l'upload de la vidéo elle-même reste manuel/hors ce connecteur).

## 🎯 Prochaine étape claire

Débloquer OpenAI → `factory.bat` → publier les 5 (Stratégie A, liens /go/ dans chaque `metadata.md`) → **collecter les chiffres** → seulement alors rouvrir la ROADMAP.
