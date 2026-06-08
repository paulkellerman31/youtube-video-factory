# YouTube Video Factory

Outil de création de vidéos faceless YouTube, en bulk, à ~20% d'effort humain.

## Installation (après clone)

```bash
npm install                                   # dépendances
npx playwright install chromium               # navigateur pour les captures (screen_capture)
cp .env.example .env                          # puis renseigne tes clés OpenAI + ElevenLabs
cp references/profiles/ofm/voice-config.example.json references/profiles/ofm/voice-config.json
# édite voice-config.json avec ton voiceId ElevenLabs
```

Prérequis machine : **Node** + **FFmpeg** installés et dans le PATH.
Lancer un rendu : `npm run factory -- run projects/<channel>/<projet>` (ou `run-windows.bat`).

> Ce repo ne contient ni clés API (`.env`), ni voix perso (`voice-config.json`), ni vidéos
> rendues (`projects/`). Voir `projects/_example/` pour le format des fichiers d'entrée.

---


## Deux couches
- **Cerveau** (`SKILL.md` + `references/`) → s'opère dans **Cowork**. Décide, brief, écrit le plan d'exécution.
- **Mains** (`scripts/`) → se construit dans **Claude Code** à partir de `BUILD-SPEC.md`. Exécute : API + FFmpeg.

Un seul dossier, deux sièges : Code pour bâtir, Cowork pour opérer.

## Le principe (20/80)
Ton 20% : déposer un sujet (ou une liste) + approuver le **plan** (groupé en bulk). Le reste (script,
voix, images, assemblage, sous-titres, metadata, miniature) = 80% automatisé. Tout est préréglé dans
`references/` — on ne décide rien par vidéo.

## Pour rendre la factory opérationnelle (dans l'ordre)
1. **Remplir les `references/`** (le levier qualité) :
   - `script-director.md` ← coller ton V3.1 (Doc1)
   - `thumbnail-playbook.md` ← coller ton Doc3
   - `voice-config.json` ← ton `voiceId` ElevenLabs + réglages
   - `image-prompt-style.md` ← verrouiller le HEX de marque
2. **`.env`** ← copier `.env.example`, mettre les clés (OpenAI, ElevenLabs). Jamais commité.
3. **Construire la pipeline** dans Claude Code (voir `BUILD-SPEC.md` §9). Spine d'abord, en `--dry-run`.
4. **Prérequis machine** : Node + FFmpeg installés. Sous-titres : champ `subtitles` (burned/cc/none) dans `references/profiles/<channel>/render-config.json` — le `subs.srt` est toujours produit pour les CC YouTube. Pour les scènes `screen_capture`
   (captures de pages publiques) : `npm i playwright` + `npx playwright install chromium`
   — `run-windows.bat` s'en charge automatiquement au premier lancement.
5. **