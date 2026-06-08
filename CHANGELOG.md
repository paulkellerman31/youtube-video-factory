# CHANGELOG

Toute modification systémique (presets, pipeline, structure) se note ici. Une ligne par changement, datée.

## 2026-06-08

- **3 sources d'asset par scène** (`image-prompts.json`, champ `source`) : `ai_image` (défaut,
  comportement et hash historiques intacts), `screen_capture` (Playwright + Chromium local,
  pages PUBLIQUES uniquement — jamais de login automatisé, pas de service tiers ; champs
  url/viewport/fullPage/selector/hideSelectors/delayMs ; idempotent par hash de spec ; 0 $),
  `manual_asset` (fichier humain `assets/captures/<sceneId>.png`, jamais généré ni écrasé,
  absent = arrêt dur sans fallback IA). Sortie unifiée `assets/images/<sceneId>.png` →
  assemblage inchangé. Nouveaux fichiers : `scripts/lib/capture.ts` ; refonte
  `generate-images.ts`. Playwright ajouté à package.json + install Chromium auto dans le .bat.
  Docs : SKILL.md (choix de source par scène), script-director §format des scènes.
  Non-régression : dry-run OFM identique au baseline (0 capture, 0 $, 37 skipped).
  Test live validé (`projects/ofm/2026-06-08_capture-test`) : capture réelle → PNG 1920x1080
  au chemin standard → re-run = SKIP (idempotence) → `--only assemble` = Ken Burns + mux OK.
  Note : depuis le sandbox, certains sites servent une page anti-bot (IP datacenter) — en
  local sur machine résidentielle, les pages publiques rendent normalement.
- **ROADMAP.md posé** (aucune implémentation) : 1) coûts — gpt-image-1-mini + Batch API,
  tiering voix par profil (providers en direct), pool d'assets par chaîne ; 2) upload YouTube
  auto (gate unique « READY TO PUBLISH » par batch), musique auto avec ducking ; 3) phase 2 —
  clips IA ciblés (Seedance Fast / Veo 3.1, pas Kling), analytics qui informent les presets
  sans auto-modification. Gelé tant que des vidéos publiées n'ont pas validé le format.

## 2026-06-07

- **Profils multi-chaînes** : création de `references/profiles/<channel>/` (style.md, voice-config.json,
  thumbnail-playbook.md). Presets OFM migrés dans `profiles/ofm/` — chaîne de style globale copiée à
  l'identique (hash images intact, zéro régénération). Stub `profiles/rome-antique/` créé, à remplir.
- **Pipeline** : nouveau `scripts/lib/profile.ts` ; `generate-audio` et `generate-images` lisent
  voix/style depuis le profil du `channel` déclaré dans `project-config.json` (défaut `ofm`,
  fallback legacy vers `references/` à la racine pour les anciens projets).
- **Projets rangés par chaîne** : `projects/<channel>/<date>_<slug>/`. Les deux projets existants
  copiés dans `projects/ofm/` (`channel: "ofm"` ajouté à leurs configs). ⚠️ Les originaux à la racine
  de `projects/` sont à supprimer à la main (suppression bloquée côté Cowork).
- **Style adaptatif** : `style.md` décrit une famille esthétique par chaîne ; prompts adaptés au sujet
  de chaque vidéo, ancrés par la chaîne de style ; sujets techniques → visuels littéraux (dashboards,
  schémas) plutôt que métaphores.
- **Fix FFmpeg Windows (drawtext)** : fontconfig cassé sur les builds Windows + le `:` du lecteur
  (C:) incompatible avec le parseur de filtres → la police (Impact) est copiée dans
  `assets/clips/_font.ttf` et référencée en chemin relatif sans `:`. Sous-titres : `force_style`
  FontName=Arial. (`scripts/lib/ffmpeg.ts`)
- **SKILL.md** : étape d'entrée "déterminer la chaîne + charger son profil" ; règle visuels
  littéraux pour sujets techniques.
- **Presets verrouillés (avant refactor)** : V3.1 MASTER collé dans `references/script-director.md`
  + section §PIPELINE ADAPTATION ; défauts OFM : LANGUAGE=English, CTA=SUBSCRIBE, OBJECTIVE=GROW.
- **Vidéo 01 OFM produite** : `projects/ofm/2026-06-07_brightdata-threshold-myth` — format C
  (Myth Buster), 339 s, 37 scènes, 3,27 $.

## 2026-06-07 (avant cette session)

- Scaffold + pipeline v1 (Claude Code) ; vidéo test `stop-being-the-machine` validée (31,6 s, 0,41 $).

## 2026-06-08 (suite — leçons vidéo 01)

- **Fix alignement s18 (vidéo 01)** : « Here is their real pricing grid » démarrait 3 s avant la
  capture pricing → frontière s17/s18 avancée à 185.3 (plan) via timestamps ElevenLabs.
  Ré-assemblage seul, 0 $.
- **Preset CTA (script-director STEP 0)** : défaut AFFILIATE (Stratégie A — lien /go/<tool>)
  quand la vidéo cible une intention d'achat ; SUBSCRIBE sinon. La 01 reste SUBSCRIBE à l'écran —
  compensé en description/commentaire épinglé/écran de fin.
- **Preset hook (script-director)** : 2–3 changements d'image dans les 8 premières secondes,
  scènes de hook ≤ 4 s. Jamais une seule image zoomée sur tout le hook.
- **Preset style OFM** : interdiction de texte lisible dans les scènes AI_IMAGE (« no readable
  text » dans le prompt) ; mots lisibles réservés aux GRAPHIC, 2–4 labels courts max.
- **Preset sous-titres** (`render-config.json` par profil, champ `subtitles`, override par
  projet) : `burned` (défaut ofm — segments ≤ 4 mots, une ligne, FontSize 20, remontés
  au-dessus des contrôles player, fond noir semi-transparent, auto-masqués sur les scènes
  capture/manual_asset et overlay, via `subs-burned.srt` dédié) ; `cc` (défaut rome-antique —
  image propre) ; `none`. `subs.srt` CC TOUJOURS produit. Non-régression : `burned` n'entre
  pas dans le hash d'assemblage → vidéo 01 intouchée (dry-run : audio SKIP, 37 images
  skippées, 0 $). Note : `node_modules` contient désormais des binaires Windows (npm install
  local) — le sandbox utilise sa propre toolchain, sans impact sur la machine de prod.
- **Règle ZERO texte dans les images IA** (limite dure de gpt-image-1) : négatif canonique
  « no text, no words, no letters, no numbers, no labels, no logos, no readable seals or
  stamps » ajouté à CHAQUE prompt AI_IMAGE écrit par le skill — volontairement PAS dans la
  chaîne de style globale (elle est hashée → la modifier régénérerait toutes les images de
  tous les projets, et elle s'applique aux GRAPHIC qui gardent leurs 2-4 labels). Scènes à
  mots/chiffres/documents/écrans : taguées au PLAN et routées vers screen_capture /
  manual_asset / GRAPHIC / overlay — jamais ai_image. (style.md, script-director, SKILL.md)
- **Fix vidéo 01** : 11 prompts AI_IMAGE porteurs de texte (facture, carte, sceau, écrans,
  calculatrice, étiquettes…) réécrits sans texte → 11 régénérations à 0,77 $, 26 images +
  audio skippés par hash, ré-assemblage gratuit. s17 (arche « 50 ») conservée : chiffre
  unique rendu correctement, hors catégories à risque.
- **Raffinement règle no-text : STRIP ≠ ROUTE** (go-forward, pas de re-rendu 01). Avant
  d'enlever du texte d'un prompt : décoratif (fausse facture, sceau bidon) → blank OK ;
  porteur de sens (calendrier = mois, dashboard = données, panneau = chiffre) → NE PAS vider,
  router (overlay vrais mots / GRAPHIC / capture). Vider une scène à texte porteur la tue.
  Leçon de la 01 : s08 (3 calendriers → 3 boîtes vides) — fade mais sans tell de crédibilité,
  on garde tel quel ; la classe de défaut réelle (baragouin) est éliminée. (style.md,
  script-director, SKILL.md)

## 2026-06-08 (PUBLIÉE)

- **🚀 Vidéo 01 PUBLIÉE sur YouTube** : `ofm/2026-06-07_brightdata-threshold-myth` — review
  Bright Data (format C), 342 s, 4 captures réelles, CTA Stratégie A (/go/brightdata),
  miniature sphère + nœud rouge + logo Bright Data. Première sortie complète de la factory.
  Prochaine étape = collecter les chiffres (CTR, rétention 10 premières sec, clics affiliés)
  qui piloteront la 02/03 et les arbitrages roadmap (hook animé, GPT Image 1.5, etc.).
