# CHANGELOG

Toute modification systémique (presets, pipeline, structure) se note ici. Une ligne par changement, datée.

## 2026-08-01 — retour terrain : cohérence, légitimité, substance

Trois griefs remontés par des personnes extérieures après visionnage de la chaîne. Chacun avait
une cause identifiable dans les presets plutôt que dans l'exécution. Deux sources d'audit,
distinguées partout ci-dessous parce qu'elles ne disent pas la même chose : le **dépôt**
(`projects/ofm/*/image-prompts.json`, `thumbnail.md`, code) et l'**API YouTube**
(`youtube_list_videos`, relevé 2026-08-01). Les presets réécrits ont ensuite été relus en
vérification adversariale contre le code ; les erreurs trouvées sont corrigées dans cette même
entrée.

- **DA miniature verrouillée** (`profiles/ofm/thumbnail-playbook.md`, réécriture complète v2).
  Cause : le playbook demandait de *choisir* un archétype parmi 7 par vidéo — une consigne de
  variété, l'inverse d'une DA — et les miniatures étaient montées à la main dans Canva
  (`thumbnail.md` par projet ; aucune entrée `sceneId: "thumbnail"`, aucun champ `overlay`, donc
  aucun `thumbnail.png` jamais généré, sur aucun projet). Correctif : un
  squelette unique en coordonnées absolues (seam cyan à x=576, titre aligné à gauche sur x=632,
  slots marque/logo figés, zone morte sous y=576), un bloc de prompt DA recopié à l'identique
  (fond charcoal void, une seule rim light cyan, palette #05070C/#00C8FF/blanc), police **Impact**
  seule (« Bebas Neue ou Impact » = deux DA ; `FONT_CANDIDATES` ne liste que Impact / Arial Bold /
  DejaVu, donc Bebas n'est de toute façon jamais rendue), rouge alarme #FF3B30 toléré à ≤15 % sur
  les angles ban uniquement, or/vert/violet/orange/magenta bannis. Géométrie recalculée sur les
  métriques réelles d'Impact (capitale = 0,79 em → 88,5 px à 112 ; interligne 144 ; ≈12 caractères
  par ligne avec espaces, ≈10 pour un mot plein). La miniature redevient un livrable de pipeline.
  **La DA ne change qu'au trimestre, jamais par vidéo.**
- **Quota de footage réel contraignant** (`script-director.md`, nouvelle §TOOL FOOTAGE). Cause :
  l'ancienne règle disait « à utiliser généreusement » — non contraignant. Mesure sur les 6 plans
  OFM (`projects/ofm/*/image-prompts.json`) : **79 % à 97 % de scènes `ai_image`** — anti-detect
  28/30, inro 29/30, onlyspoofer 28/29, onlytraffic 29/30, nodemaven 29/32, beacons 23/29. Inrō :
  1 seule capture pour une review de CRM ; OnlyTraffic : 0 capture automatique (1 `manual_asset`,
  site non capturable). Correctif : 4 beats obligatoires sourcés (homepage <90 s, parcours cœur en
  `screen_recording` à 60-70 %, pricing réel avant CTA, **preuve contradictoire**), **≥10 scènes
  réelles / ≥90 s**, `ai_image` **≤65 %**, **≥3 `screen_recording`**, 6-12 s par scène filmée
  (exception explicite au cap ~7 s : une scène filmée n'est pas un plan figé). Les quatre chiffres
  sont mutuellement cohérents sur le gabarit ≈30 scènes — contrôle arithmétique inclus dans le
  preset. Contrôle au PLAN : un plan sans les 4 beats sourcés est invalide et se réécrit avant le
  gate.
- **Nouvelle source `screen_recording`** (`references/screen-recording-contract.md`, nouveau
  fichier). Page publique **filmée** : curseur synthétique en courbe de Bézier avec dépassement
  et correction, scroll amorti ≤900 px/s, `hover` réel via `page.mouse`. Playwright + Chromium
  local déjà en place, $0. Réutilise la trousse anti-blocage et le diagnostic de blocage de
  `lib/capture.ts` — **après refactor** : ces symboles sont module-private et le probe est inline
  dans `screenCapture` (cf. liste d'implémentation ci-dessous). Page bloquée = échec bruyant,
  jamais une frame Cloudflare au montage. `manual_asset` accepte désormais `.mp4`/`.mov`
  (l'écran connecté filmé à la main — le footage le plus convaincant, et le seul non
  automatisable).
- **Contrôle anti-« Review » au PLAN** (`script-director.md` §DO NOT + STEP 1). Audit, source
  **YouTube Data API** (`youtube_list_videos`, 22 vidéos publiées, relevé 2026-08-01) : **9 titres
  sur 22 contiennent `Review`** alors que le preset l'interdit depuis juin (0,65 % vs 13,3 % de
  CTR). Le preset existait, il n'était pas appliqué → il devient un contrôle explicite. Les
  3 titres candidats **remontent de STEP 2 vers STEP 1** : ils étaient produits après le gate,
  donc le contrôle n'avait rien à contrôler. Correction rétroactive gratuite via
  `youtube_update_video`.
- **⚠️ `STATE.md` est périmé** (daté 2026-06-10) : il annonce « 7 vidéos, 5 non rendues, blocage
  facturation OpenAI ». L'API en montre **22 publiées**, dont les 5 dites non rendues (mises en
  ligne du 14 au 17 juin). À reprendre — un fichier de reprise faux coûte plus cher qu'un fichier
  absent.
- **Palette et police déplacées vers le profil de chaîne** (`profiles/ofm/style.md`). Elles
  avaient été écrites dans `image-prompt-style.md`, qui est le **fallback global multi-chaînes** :
  y bannir « l'or sans exception » aurait cassé `rome-antique` (or/bronze) et `corps-humain`
  (teal/corail). Le fichier global ne garde qu'une règle universelle : **une seule police par
  chaîne**, jamais « X ou Y ».
- **Corrections factuelles dans `image-prompt-style.md`** : la génération est en **1536x1024**
  (3:2), pas 1792x1024 (taille DALL·E 3, inexistante chez gpt-image) ; les scènes GRAPHIC passent
  par **hyperframes**, pas par une image IA « clean infographic with large legible text » — la
  consigne inverse y traînait encore et se retrouve dans `nodemaven` s16/s27, à corriger ; le
  banc d'essai vidéo est **fal.ai**, pas Kling.
- **Point de vigilance modèle** : tous les presets justifient la méthode inversée et le routage
  hyperframes par « gpt-image-1 ne sait pas écrire ». Le défaut réel est **`gpt-image-1.5`**,
  décrit par l'A/B du 2026-06-13 comme *meilleur en texte*. Règles maintenues par prudence, mais
  **à re-tester sur 1.5** : c'est peut-être une contrainte qu'on s'impose pour rien.
- **✅ CODE IMPLÉMENTÉ le 2026-08-01** — les cinq points ci-dessous sont faits et vérifiés
  (`tsc --noEmit` propre, rendu miniature contrôlé au pixel, enregistrement testé de bout en bout
  sur une page réelle avec états `:hover` déclenchés). Nouveaux fichiers : `lib/fontmetrics.ts`,
  `lib/recording.ts`. Modifiés : `lib/ffmpeg.ts`, `lib/capture.ts`, `generate-images.ts`,
  `assemble.ts`. **Reste à fournir : `references/profiles/ofm/channel-mark.png`** (slot optionnel,
  WARN au log tant qu'il manque). Détail :
  1. `thumbnailOverlay` → `-filter_complex` à 4 entrées (scrim PNG mis en cache, seam, alignement
     gauche, slots logo/marque), auto-fit calculé **côté TypeScript** depuis les métriques du TTF
     (ffmpeg ne sait pas mesurer un texte), sortie **JPEG q≈92** (un PNG 1280×720 photoréaliste
     dépasse souvent les 2 Mo de YouTube).
  2. Champ `overlay.logo` à ajouter au type (aujourd'hui `{ lines, accent }` — le champ est
     silencieusement ignoré).
  3. **🔴 Exclure l'entrée `sceneId: "thumbnail"` de l'append de la chaîne de style globale.**
     `generate-images.ts` fait `${p.prompt}. ${style}` sans exception : le bloc DA « charcoal
     void, no environment » se ferait suivre de « dark luxury tech setting, silhouette only, no
     visible face » — le décor que la DA bannit, plus deux négations interdites par la méthode
     inversée. **Sans ce correctif, la DA est inapplicable.**
  4. Source `screen_recording` — prérequis : exporter `REALISTIC_UA`, `COMMON_COOKIE_SELECTORS`,
     `launchArgs`, `diagnoseCapture` (tous module-private aujourd'hui) et extraire le probe en
     `probePage(page)`. Attention : `recordVideo` couvre toute la vie du contexte (pas d'API
     start/stop) → couper la tête au `-ss` ; chemin via `page.video().path()` après
     `context.close()` ; `-vsync cfr -r 30` (le screencast sort en cadence variable).
  5. Extension vidéo de `manual_asset` (`.mp4`/`.mov`) et ajout de `screen_recording` à
     `protectedSceneIds` (suppression des sous-titres incrustés).
  Non-régression OFM en dry-run avant adoption.

## 2026-06-13

- **Routage review « tool footage first »** (`script-director.md`) : sur une vidéo review/outil, les
  scènes feature/preuve partent par défaut en `screen_capture` de pages publiques (homepage/pricing/
  features/demo — montrent souvent l'UI), à utiliser généreusement. `manual_asset` = vue login au cas
  par cas (login NON automatisé, par règle). `ai_image` réservé hook/concept/transition. Dashboard
  derrière login = pas de système d'auto-capture (non automatisable proprement).
- **Prompt négatif INVERSÉ (data 2026)** : gpt-image-1 ignore les négations et le mot « text/logo »
  attire l'artefact. On arrête de coller « no text, no logos… » ; on décrit les surfaces en positif
  (« plain blank surfaces, unmarked screens ») et on ne nomme plus text/logo/sign. Appliqué à
  `script-director.md` (règle + prompt thumbnail), `image-prompt-style.md` et aux 3 `style.md`.
  Écrit par le skill par-prompt → pas de régénération payante du backlog.
- **Règles de rétention encodées** (`script-director.md` §VISUAL CADENCE, data 2026) : aucun plan
  figé (motion obligatoire Ken Burns/hyperframes), cap ~7 s par visuel, cuts synchronisés aux beats,
  open loop payé avant 50 %, reveal fort à 60-70 %, [PI] toutes les 20-30 s.
- **Modèle image → défaut `gpt-image-1.5`** (était gpt-image-1). Paramétrable par env `IMAGE_MODEL`
  (rollback : `IMAGE_MODEL=gpt-image-1`). Décision après **A/B réel** (3 scènes, runner
  `scripts/ab-test/`) : 1.5 gagne sur hero (plus cinématographique), texte court « RED FLAG » (les 2
  corrects, 1.5 plus léché), cohérence mascotte ; `quality=medium` accepté ; **moins cher**
  (medium 0,05 $ vs 0,07 $). `rates.ts` MAJ (medium 0,05 / high 0,20, à confirmer via usage facturé).
  Note : le hash d'image n'inclut pas le modèle → le backlog déjà rendu n'est PAS régénéré (voulu).
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
