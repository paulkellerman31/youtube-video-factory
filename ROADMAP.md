# ROADMAP — améliorations priorisées (ordre 20/80)

> Référence future. RIEN n'est implémenté tant que Théo n'a pas publié et validé quelques
> vidéos. Chaque chantier, le moment venu : implémentation via Claude Code, entrée CHANGELOG,
> non-régression OFM en dry-run avant adoption.

## 0. ✅ Profils multi-chaînes (fait — 2026-06-07)

`references/profiles/<channel>/`, champ `channel` dans project-config, projets rangés par
chaîne, style adaptatif par famille esthétique. Voir CHANGELOG.

## 1. Gains coût triviaux — sans nouveau fournisseur

- **Images : `gpt-image-1-mini` + API Batch OpenAI** → −50 % sur le poste images
  (aujourd'hui ~2,60 $/vidéo de 37 scènes). Qualité à valider sur 2-3 scènes avant bascule ;
  le tier image peut être un champ de profil.
  - Recherche prix 2026-06-11 : mini ≈ 0,01-0,02 $/img (−70/85 % vs 0,07 $), Batch −50 %
    en plus. Plan B si mini déçoit : **Imagen 4 Fast (Google, 0,02 $/img)** — qualité
    comparable, mais nouveau fournisseur = re-valider la chaîne de style par profil.
    Flux/SDXL écartés : moins chers mais tuning contraire au 20/80.
  - **La voix n'est PAS un levier coût** : ElevenLabs ≈ 0,4-1 $/vidéo seulement, et seul
    à donner les timestamps mot nativement (OpenAI TTS : alignement post-gen requis ;
    Google : balisage SSML manuel). Le tiering voix ci-dessous reste pertinent uniquement
    à gros volume, jamais en premier.
- **Tiering voix par profil** : champs `voice_tier` / `voice_provider` dans `voice-config.json`.
  Premium (ElevenLabs) pour les vidéos héros ; OpenAI TTS ou Google TTS pour le bulk.
  **EN DIRECT chez le fournisseur, jamais via un revendeur d'API.**
  Attention : changer de provider = adapter la génération des timestamps sous-titres.
- **Pool d'assets réutilisables par chaîne** : images génériques récurrentes (ambiances,
  transitions, CTA) mutualisées dans le profil au lieu d'être régénérées par vidéo.

## 2. Sortie automatisée

- **Upload YouTube auto depuis le manifest** : API YouTube Data v3, token OAuth par profil
  (une chaîne = un token). Titre/description/tags/miniature lus depuis le projet.
  **Un seul gate humain « READY TO PUBLISH » par batch** — cohérent avec la doctrine
  un-seul-gate ; la publication reste une décision humaine, groupée.
- **Musique de fond auto avec ducking** : bed musical par chaîne (mood dans le profil),
  sidechain/ducking sous la voix dans `finalMux` (aujourd'hui : mix statique 16 % si un
  fichier est déposé à la main dans `assets/music/`).

## 3. Phase 2 — après validation par les chiffres

- **Cohérence visuelle renforcée (identité, pas seulement style)** — *priorité qualité haute.*
  Aujourd'hui : la chaîne de style globale du profil donne une cohérence d'**ambiance/palette**
  intra-vidéo et intra-chaîne, mais gpt-image-1 génère chaque image indépendamment → l'**identité
  exacte** d'un objet/décor dérive d'une scène à l'autre (le même rein/cerveau n'est pas
  identique scène 5 vs scène 9). Pistes, du moins au plus lourd :
  1. **Seed partagé par projet** (champ `seed` dans project-config, passé à chaque génération)
     → variations plus proches sans changer de modèle.
  2. **Image de référence + édition** (gpt-image-1 edit / modèle à image de référence) : une
     "image-ancre" par chaîne ou par entité récurrente, réutilisée comme base → identité stable.
  3. **Bascule modèle** si besoin (GPT Image 1.5 ou équivalent à cohérence par référence).
  Objectif : des vidéos qui *semblent* montées par un humain — décor/objets stables, transitions
  fluides — car la cohérence visuelle est un levier direct de rétention (le viewer reste si ça
  ne "saute" pas d'un plan à l'autre). À valider sur une vidéo avant de généraliser ; passe par
  un champ de profil, jamais par vidéo.
- **Clips vidéo IA ciblés** : 2-4 clips de 3-5 s par vidéo (hook + moments clés), le reste
  en Ken Burns. Renforce la cohérence : un vrai mouvement vidéo sur un plan clé casse l'effet
  diaporama.
  - **API d'accès = fal.ai comme point d'entrée / banc de test.** Une seule intégration
    (`FAL_KEY`, déjà dans `.env.example`) → comparer **Veo 3.1** (~0,03 $/s) et **Seedance
    Fast** (~0,022 $/s) sur 2 clips réels dans une vraie vidéo, puis trancher sur du concret.
    **PAS Kling** (premium). Pari : pour du b-roll abstrait faceless, Seedance suffit → rester
    sur fal. Bascule **Veo-via-Gemini direct** seulement SI Veo s'impose nettement et qu'on
    veut optimiser coût/first-party (petit swap d'adaptateur).
  - **Point d'extension déjà en place** : le champ `source` des scènes. La vidéo-gen = un
    nouveau `source: "ai_video"` avec l'adaptateur provider derrière — comme `screen_capture`.
    **NE PAS pré-concevoir d'endpoint/interface** : abstraction prématurée (les providers ont
    des I/O et des modèles async différents ; on dessine le joint en branchant le provider n°1,
    informé par le réel). En image→vidéo pour partir des assets gpt-image-1 existants.
  - **Gaté sur validation chiffres** : rien tant que CTR / watch-time / clics affiliés ne
    disent pas « la chaîne marche, ça vaut l'optimisation ».
- **Scènes animées HTML via HyperFrames** (https://github.com/heygen-com/hyperframes) —
  **✅ infra faite (2026-06-11, voir CHANGELOG)** : `source: "hyperframes"` implémenté et
  validé en local (test `projects/ofm/2026-06-11_hyperframes-test`, non-régression OK).
  Restent gatés chiffres : l'usage en prod et les templates de scènes par profil dans
  `references/`.
  graphiques animés, texte cinétique, compteurs/comparaisons — pour les scènes données/texte
  où une image fixe est faible. Upgrade direct de la route « texte porteur de sens ».
  - **Zéro API, zéro coût par rendu** : open source (Apache 2.0), tourne en local sur la
    stack existante (Node + Chromium Playwright + FFmpeg). Remplace même des générations
    gpt-image-1 → légère baisse du coût API. Coût réel = temps de rendu local (capture
    frame par frame en Chrome headless) + une brique de pipeline de plus à maintenir.
  - **Intégration** : nouveau `source: "hyperframes"` dans le champ `source` des scènes
    (même point d'extension que `screen_capture` / futur `ai_video`). Le plan écrit le HTML
    de la scène (comme il écrit les prompts d'images) ; le render appelle la CLI HyperFrames
    pour produire le clip, FFmpeg l'assemble comme un asset normal. Templates de scènes
    (bar chart, compteur, versus, texte cinétique) versionnés par profil dans `references/`.
  - **Gaté chiffres** : à déclencher si la rétention décroche sur les scènes données/chiffres,
    ou si une nouvelle chaîne à scènes data majoritaires (finance, stats, classements) le
    justifie. Valider sur 1-2 scènes d'une vraie vidéo avant de généraliser.
- **Analytics YouTube → presets** : remonter CTR / rétention / vues par vidéo depuis l'API
  Analytics et les rapprocher des choix (format, antagoniste, miniature, chaîne de style).
  Les données **INFORMENT** les ajustements de presets — **aucune auto-modification par le
  skill : l'humain décide**, le CHANGELOG trace.

## 4. Cheap wins montage (sans nouvelle clé, faible risque) — quand les chiffres le justifient

- **Transitions douces** entre scènes : fondu enchaîné court (FFmpeg `xfade`) au lieu de coupe
  franche. Réglable par profil.
- **Sous-titres animés** mot par mot (style « karaoké ») : booste la rétention sur le format
  court / vulgarisation. Variante du mode `burned`.
- **Ducking musical** : la musique baisse automatiquement sous la voix (sidechain dans
  `finalMux`), au lieu du mix statique 16 %.
- **LUT par chaîne** (`lut3d` FFmpeg) : une LUT `.cube` par profil, appliquée au rendu →
  palette homogène sur toutes les images IA d'une vidéo. Sert le chantier « cohérence
  visuelle » (§3) à coût quasi nul. Option amont : `color-matcher` (CLI Python) pour caler
  les images sur une image-référence du profil. (Recherche 2026-06-11 : transitions GLSL
  type node-ffmpeg-concat écartées — lib peu maintenue, casse le concat `-c copy` ; `xfade`
  d'abord. Auto-Editor/PySceneDetect non pertinents : pipeline génératif, pas de footage.)

> Ces trois-là ne demandent aucune clé ni provider externe — uniquement du FFmpeg. Mais ils
> restent du polissage montage : à faire quand la rétention dit OÙ ça décroche, pas avant.

## 5. Méthode style spec — "simple = robuste" (note, pas un chantier)

Leçon (vidéo 01) : un style volontairement **simple** (doodle / stickman / MS-Paint, flat,
contours wobbly) est stratégiquement robuste pour l'IA faceless — il **cache les failles du
modèle** (pas de texte à garbler, pas de visage réaliste à rater, pas de main à 6 doigts),
il est brandable et moins cher à générer proprement. Technique : verrouiller par une **liste
de négatifs** (no 3D, no cinematic, no Disney, no anime…), comme la règle no-text étendue au
style entier.
- **Règle d'écriture des profils** : pour une nouvelle niche, pencher *simple + verrouillé par
  négatifs*. Gratuit, épargne des régénérations.
- **Refonte style OFM vers plus simple/illustratif** : idée valable (robustesse + cohérence),
  mais **NE PAS** la faire avant que les chiffres le justifient. OFM réaliste actuel = publié,
  fonctionne. Refonte = chantier post-validation, jamais un retard sur la prochaine vidéo.

## Hors scope explicite (pour mémoire)

- Pas d'industrialisation supplémentaire tant que des vidéos publiées n'ont pas validé le
  format (qualité, CTR, rétention).
- Toute modification systémique passe par les presets/profils versionnés — jamais par vidéo.
