# CHANGELOG

Toute modification systémique (presets, pipeline, structure) se note ici. Une ligne par changement, datée.

## 2026-06-13

- **Prompt négatif INVERSÉ (data 2026)** : gpt-image-1 ignore les négations et le mot « text/logo »
  attire l'artefact. On arrête de coller « no text, no logos… » ; on décrit les surfaces en positif
  (« plain blank surfaces, unmarked screens ») et on ne nomme plus text/logo/sign. Appliqué à
  `script-director.md` (règle + prompt thumbnail), `image-prompt-style.md` et aux 3 `style.md`.
  Écrit par le skill par-prompt → pas de régénération payante du backlog.
- **Règles de rétention encodées** (`script-director.md` §VISUAL CADENCE, data 2026) : aucun plan
  figé (motion obligatoire Ken Burns/hyperframes), cap ~7 s par visuel, cuts synchronisés aux beats,
  open loop payé avant 50 %, reveal fort à 60-70 %, [PI] toutes les 20-30 s.
- **Lead modèle** : OpenAI **gpt-image-1.5** dispo (texte/prompt-adherence best-in-class, coût
  comparable). Candidat upgrade drop-in (`model:` dans generate-images.ts) — à valider sur 1 render
  avant flip (vérifier noms de paliers qualité + tarif exact, MAJ rates.ts).
- **Capture durcie + garde-fou** (`scripts/lib/capture.ts`) : vrai Chrome (channel + UA réaliste,
  `navigator.webdriver` masqué), attente `networkidle` + stabilisation + fermeture cookies. Surtout :
  détection page bloquée (HTTP 403/429/503, signatures Cloudflare/captcha) et frame vide → retries
  puis **échec du rendu** au lieu de livrer du déchet. Sites non capturables → `manual_asset`
  (beacons.ai/Cloudflare, onlytraffic.co/rendu blanc).
- **`hyperframes` = renderer par défaut des scènes GRAPHIC** (preset `references/hyperframes/` :
  CONTRACT.md + template-ofm.html). gpt-image-1 ne sait pas écrire → un GRAPHIC IA sort avec du
  texte cassé ; hyperframes rend du texte net animé en local, 0 $. `style.md` (ofm) mis à jour.
  Prouvé sur beacons s20 (funnel SOURCE/BUFFER/DESTINATION) et s27 (break-even 9% vs $30, $334/mo).
- **Tokens DA hyperframes par chaîne** : `references/profiles/<chaîne>/hyperframes-tokens.css`
  (bloc `:root` couleurs/police, inliné dans chaque compo). La compo style avec `var(--…)`, jamais
  de HEX en dur → la DA suit le projet. ofm (dark/bleu), corps-humain (cartoon clair teal/corail,
  no glow), rome-antique (or/bronze, provisoire). Contrat preset MAJ.

## 2026-06-11

- **4e source d'asset : `hyperframes`** (ROADMAP §3 « Scènes animées HTML via HyperFrames ») :
  scènes animées HTML (graphiques, compteurs, texte cinétique) rendues en clip MP4 local —
  zéro API, 0 $. `image-prompts.json` : `source: "hyperframes"` + champ optionnel
  `hyperframes: { dir?, fps?, quality? }` (défauts : `hyperframes/<sceneId>`, 30, standard).
  Le plan écrit la composition `hyperframes/<sceneId>/index.html` dans le projet (HTML autonome,
  `data-duration` = durée de la scène, animations GSAP via `window.__timelines`) ; le step
  images appelle la CLI HyperFrames (`npm i -D hyperframes`, bin local via node — pas de npx)
  → `assets/hyperframes/<sceneId>.mp4` ; assemble conforme le clip à la fenêtre de scène
  (`conformClip` : scale/pad 1920x1080, 30 fps, durée exacte, dernière frame tenue si plus
  court, mêmes params x264 que Ken Burns → concat -c copy intact) à la place du Ken Burns.
  Idempotent par hash (fichiers de la composition + fps + quality). Sous-titres burned masqués
  sur ces scènes (comme screen_capture) ; `textOverlay` ignoré avec WARN (le texte vit dans le
  HTML). Rendu local uniquement — jamais les commandes cloud de la CLI. Prérequis one-shot :
  `npx hyperframes browser ensure` (Chrome headless ~100 Mo dans `~/.cache/hyperframes`).
  Nouveaux fichiers : `scripts/lib/hyperframes.ts` ; modifiés : `generate-images.ts`
  (dispatch), `lib/ffmpeg.ts` (conformClip), `assemble.ts` (routage clip, assets manquants,
  protection subs). Test live (`projects/ofm/2026-06-11_hyperframes-test`, 1 scène 8 s
  compteur + bar chart palette OFM) : dry-run $0 → rendu réel 17 s (240 frames, GSAP inliné
  par le compilateur HF) → re-run = SKIP (idempotence) → `--only assemble` avec voix
  silencieuse FFmpeg = conform + concat + mux OK, animation vérifiée frame par frame.
  Non-régression : brightdata 37/37 SKIP + assemble SKIP (hash final 950b6496e7ff784a
  inchangé), capture-test SKIP, nodemaven 32 skipped, corps-humain 14 skipped (avec
  `IMAGE_QUALITY=high`, celui du dernier rendu réel). Reste gaté chiffres pour l'usage en
  prod (rétention scènes data) — l'infra est prête, aucun projet publié n'est modifié.

## 2026-06-09 (suite — qualite corps-humain)

- **Casting recurrent (coherence "storyboard")** : style.md corps-humain documente la regle —
  personnages recurrents decrits VERBATIM a chaque scene (gpt-image-1 sans memoire). Video
  "3-jours-sans-boire" : mascotte goutte d'eau (s01/s03/s12/s13/s14) + perso humain
  (s02/s11/s12/s13) + organes-personnages a look fige. Cohérence ~80 %, vrai fix image-to-image
  reste en ROADMAP.
- **Qualite image high** : `IMAGE_QUALITY=high` force dans le launcher du projet
  (run-corps-humain-3jours.bat). Defaut pipeline inchange (medium) pour les autres chaines.
  Note dans style.md. Cout ~3-4x medium.

## 2026-06-09

- **Nouveau profil de chaine `corps-humain`** (`references/profiles/corps-humain/`) :
  vulgarisation science grand public, sous-titres `burned`, voix ElevenLabs George
  (`JBFqnCBsd6RMkjVDRZzb`).
- **Style corps-humain -> cartoon 2D plat (facon TED-Ed)** : abandon du look medical 3D
  initial avant tout rendu. Nouvelle global style string (flat vector, contours nets, formes
  ludiques) ; palette teal `#2EC4B6` + corail `#FF6B6B` sur creme `#FFF4E0` ; thumbnail-playbook
  mis a jour (archetype Emotional Hook). Regle texte (negatif AI_IMAGE) inchangee.
- **Voix : support du champ `speed`** (`voice-config.json` -> `settings.speed`, transmis a
  ElevenLabs `voice_settings.speed`). Forwarde uniquement si present -> profils ofm/rome-antique
  intacts. corps-humain regle a `1.1` (~10% plus rapide). Le hash audio inclut deja `settings`,
  donc tout changement de vitesse regenere la voix proprement.

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

## 2026-06-09

- **Chaîne #2 créée : `corps-humain`** (démo) — profil complet (style médical 3D cyan/rouge,
  voix George FR, sous-titres burned, playbook). Vidéo démo « 3 jours sans boire » rendue
  (89 s, 14 scènes, FR). Prouve la répétabilité : 2e chaîne sans toucher au code.
- **ROADMAP §3 enrichie — cohérence visuelle (identité)** : priorité qualité. Aujourd'hui la
  cohérence est au niveau style/palette (chaîne de style globale) ; l'identité exacte des objets
  dérive entre scènes (gpt-image-1 sans seed/référence). Pistes posées : seed partagé par projet
  → image de référence/édition → bascule modèle. Levier de rétention. Non implémenté (phase 2,
  après validation chiffres).

- **Décision API vidéo-gen (ROADMAP, non implémenté)** : point d'entrée = **fal.ai** comme banc
  de test (1 intégration → comparer Veo 3.1 vs Seedance Fast sur 2 clips réels, trancher au
  concret) ; bascule Veo-via-Gemini direct seulement si Veo s'impose. PAS Kling. Point
  d'extension déjà en place (`source: ai_video`, comme screen_capture) → **aucun pré-design
  d'endpoint** (abstraction prématurée). Gaté sur validation chiffres. Rien codé ni setup.
- **ROADMAP §4 — cheap wins montage** notés (transitions xfade, sous-titres animés mot-à-mot,
  ducking musical) : FFmpeg only, aucune clé, mais polissage → après les chiffres.

## 2026-06-09 (process de rendu — scalabilité)

- **`factory.bat` (launcher unique de backlog)** : scanne `projects/**/project-config.json` et
  rend tout ce qui n'est pas à jour (idempotent → déjà-rendu = skip 0 $). Exclut `_example`.
  Remplace le pattern « un run-<nom>.bat par vidéo » qui ne scalait pas. Pour rendre UN seul
  projet : glisser-déposer son dossier sur `run-windows.bat` (gère déjà l'argument %1).
  → Les launchers dédiés (run-corps-humain, run-nodemaven) deviennent obsolètes, à supprimer.
- **Vidéo 2 OFM écrite** : `projects/ofm/2026-06-09_nodemaven-quality-filter` — NodeMaven review,
  format B, 32 scènes (3 captures, 2 GRAPHIC, 27 AI_IMAGE), CTA Stratégie A (/go/nodemaven, NM80),
  voix OFM inchangée, medium. Dry-run OK ~2,30 $.
