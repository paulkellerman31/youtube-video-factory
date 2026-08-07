# CHANGELOG

Toute modification systémique (presets, pipeline, structure) se note ici. Une ligne par changement, datée.

## 2026-08-07 (soir) — premier rendu au format S sur SearchAtlas : trois pièges payés

Rendu de `ofm/2026-08-07_searchatlas-llm-visibility`, premier projet écrit
intégralement au quota « zéro image IA ». Trois défauts trouvés en production,
tous consignés dans `docs/LECONS.md`.

- **Débit voix : 165 → 151 mots/minute** (`references/script-director.md`).
  Quatrième valeur en trois mois, et la première à bouger **sans** changement de
  `voice-config.json` — c'est ElevenLabs qui dérive. Conséquence structurelle :
  **le débit ne sert plus à caler les fenêtres de scène.** Il sert à viser un
  nombre de mots ; les fenêtres se recalculent après l'étape audio sur
  `assets/audio/timestamps.json`, en alignant chaque paragraphe du `voiceover.txt`
  sur le flux de caractères horodaté. Un plan calé sur l'estimation était faux
  de 9 % — 143,3 s prévus contre 156,6 s réels.
- **Cloudflare protège par PAGE, pas par domaine.** `/otto-seo/` fait échouer
  l'enregistrement en arrêt dur pendant que `/`, `/llm-visibility/` et
  `/pricing/` du même site s'enregistrent sans un avertissement, et que la page
  s'ouvre normalement dans le vrai Chrome. Les deux scènes concernées ont été
  rebasculées sur la page d'accueil et sur le centre d'aide — ce dernier étant
  un meilleur plan de toute façon, puisqu'il documente lui-même la limite dont
  parle la voix. Règle ajoutée : au PLAN, toute page portant 2 scènes ou plus
  doit avoir son repli écrit.
- **`factory.bat` a coûté ~0,85 $ pour rien.** Lancé pour rendre une vidéo, il a
  régénéré voix et images d'un projet déjà terminé (dont le manifeste existait
  pourtant), puis enchaîné sur les cinq projets de juin au format périmé, la
  vidéo voulue passant en dernier. Le README le documentait déjà ; la leçon est
  ajoutée avec les deux autres pièges Windows rencontrés (`factory run` n'est pas
  une commande, `npm.ps1` bloqué par l'`ExecutionPolicy` → `npm.cmd`).
- **Point ouvert n°1 inchangé et devenu plus cher** : le projet tourne toujours
  sous `channel: "ofm"` alors qu'il vise la verticale d'`answerdelta`. L'audio et
  la moitié des enregistrements existent déjà sous le profil OFM.

## 2026-08-07 — le dépôt passe au modèle de travail du portefeuille

Aucun code ni preset touché. Mise en conformité avec
`Projets/METHODE-TRAVAIL.md`, qui sépare trois mémoires que ce dépôt gardait
fusionnées dans le seul CHANGELOG.

- **`docs/ETAT.md`** — état courant lisible en 30 s : chaînes, chiffres de la
  chaîne OFM, format en vigueur, backlog de rendu, points ouverts. Remplace le
  `STATE.md` périmé supprimé le 2026-08-01.
- **`docs/LECONS.md`** — les pièges opérationnels déjà payés, extraits des
  18 entrées du CHANGELOG et remis au format Problème → Cause → Solution,
  classés par domaine (capture, voix, FFmpeg, images, presets, outillage).
  Le CHANGELOG raconte ce qu'on a décidé ; LECONS dit ce qui casse.
- **Archivage du CHANGELOG appliqué** : le fichier actif garde les 10 dernières
  entrées, les 8 plus anciennes partent dans
  `docs/archives/CHANGELOG-2026-T2.md`. Sauvegarde préalable et contrôle du
  nombre d'entrées avant/après (18 = 10 + 8).
- **Point relevé sans le corriger** : `projects/ofm/2026-08-07_searchatlas-llm-visibility`
  porte `channel: "ofm"` alors que SearchAtlas est un outil GEO/AEO et que la
  chaîne `answerdelta`, créée la veille pour cette verticale, n'a aucun projet.
  À trancher avant rendu — c'est une décision, pas une coquille.

## 2026-08-06 (soir) — nouvelle chaîne : AnswerDelta (outils GEO/AEO)

- **Profil complet** dans `references/profiles/answerdelta/` : `style.md`, `thumbnail-playbook.md`,
  `render-config.json` (`subtitles: burned`), `hyperframes-tokens.css`, `voice-config.json`
  (même voix « Theo 2 », donc même débit mesuré de 165 mots/minute) et `voice-config.example.json`.
  Projets dans `projects/answerdelta/`. Résolution vérifiée : `channel: "answerdelta"` dans un
  `project-config.json` fait bien pointer les cinq fichiers sur le profil, aucun repli global.
- **Aucun code touché.** La factory était déjà multi-chaînes ; une nouvelle chaîne est un dossier
  de profil, pas un fork. C'est l'argument décisif contre la duplication du dépôt : une
  correction de moteur profite aux deux chaînes le jour où elle est faite.
- **Identité VERROUILLÉE — source de vérité hors factory : `answerdelta/identite.md` §9.** Accent
  ambre `#E8A33D`, tiré du logo et de la bannière, 8,76:1 sur l'encre `#111111` (au-dessus du
  seuil AAA), lisible à 360 px. Encre `#111111`, blanc, texte secondaire `#B9BEC6`, gris de
  données `#8B919B`, surface `#1C1C1C`, grille `#1F1F1F`.
- **L'accent est une couleur à DEUX valeurs.** `#E8A33D` ne donne que 2,16:1 sur blanc — illisible.
  Tout ce que produit cette pipeline est sur fond sombre, donc `#E8A33D` partout ici ; `#A8650E`
  (4,63:1, AA) est réservé aux surfaces claires, hors factory. À ne jamais intervertir.
- **Règle non négociable de la chaîne : UN SEUL ACCENT PAR IMAGE.** L'ambre marque ce qui est
  mesuré, jamais la décoration : dans un graphique à huit séries, sept en `#8B919B` et une en
  ambre — celle dont parle la voix. Deux accents détruisent la hiérarchie et sortent du registre
  « instrument » qui est la signature de la chaîne. Vaut pour images IA, hyperframes, overlays et
  miniatures.
- **Réserve assumée** : Semrush et Ahrefs sont orange. Verrouillé en le sachant — la
  différenciation visée est celle du violet-bleu des outils de visibilité IA, pas celle des
  outils SEO historiques.
- **Faille silencieuse fermée dans la foulée** : `overlay.accent` avait `#00C8FF` en défaut dans
  le code (hérité d'OFM), donc l'omettre sur une miniature AnswerDelta sortait les couleurs de
  l'autre chaîne — sans erreur, sans avertissement, visible seulement à l'œil sur le fichier
  fini. La couleur d'accent est désormais lue dans `render-config.json` du profil de chaîne
  (`profileAccent()`, `generate-images.ts`) ; le champ par vidéo reste prioritaire, et le dry-run
  imprime la couleur retenue. Un élément d'identité ne doit pas dépendre d'un champ qu'on peut
  oublier. `accent` ajouté aux deux profils : `#00C8FF` pour ofm, `#E8A33D` pour answerdelta —
  comportement d'OFM inchangé, ses prompts portaient déjà la valeur.
- **À ne pas « réparer »** : `THUMBNAIL_DA.scrimColor` reste `#05070C` alors que l'encre
  AnswerDelta est `#111111` : sans conséquence visible (dégradé à 92 % d'opacité sur une photo),
  et y toucher invaliderait le cache de miniature des DEUX chaînes.
- **Reste à déposer** : `references/profiles/answerdelta/channel-mark.png` (logo carré, fond
  transparent). Absent = `WARN` au log et miniature sans son élément de reconnaissance le plus
  fort.

## 2026-08-06 — captures authentifiées (construites puis mises hors formule), et grand nettoyage

- **Scènes authentifiées `"auth": true`** (`lib/capture.ts`, `lib/recording.ts`). Filme un
  dashboard derrière login avec le moteur habituel, **sans jamais automatiser une connexion** : le
  login est fait une fois à la main par `record-profile.bat`, dans un dossier de profil séparé
  (`.chrome-record`, gitignoré). Dossier séparé et non un profil du menu Chrome, parce que **Chrome
  verrouille tout le dossier « User Data », pas un profil** — sinon il faudrait fermer tout Chrome
  avant chaque rendu.
- **Interdits codés, pas recommandés** : aucun beat `click` dans une scène `auth` (erreur dure —
  dans un compte réel, aucun clic n'est garantissable inoffensif) ; profil absent = arrêt dur, pour
  ne pas filmer une page déconnectée sans s'en apercevoir.
- **La capture tourne sans affichage**, y compris authentifiée. Deux échecs avant d'y arriver :
  fenêtre normale → bandes noires (l'interface du navigateur mange ~90 px, le cadre réel est plus
  plat que demandé, l'enregistreur complète en noir) ; plein écran kiosque → pire, la mise à
  l'échelle Windows ×2 a donné 715×405 pour 1440×810 demandés. **Leçon : en mode visible la
  géométrie dépend de l'écran physique**, que la pipeline ne contrôle pas. Échappatoire
  `RECORD_HEADFUL=1`.
- **Garde-fou de cadrage** : après chargement, comparaison du rapport du cadre réel au rapport
  demandé, `WARN` au-delà de 1 %. Le défaut était invisible au code — le mp4 sortait aux bonnes
  dimensions, avec des bandes.
- **Traduction automatique coupée** (`--disable-features=Translate,TranslateUI --lang=en-US` dans
  `LAUNCH_ARGS`, donc sur les captures publiques aussi) + **arrêt dur** si la page porte la marque
  de Google Translate. Une page traduite est un défaut de *contenu* : le clip serait net, cadré,
  de la bonne durée, et raconterait autre chose que le produit.
- **`networkidle` n'est plus le critère de chargement** : une application temps réel garde une
  connexion ouverte, le silence réseau n'arrive jamais et on payait le timeout entier. Chargement
  sur `load`, puis `networkidle` en bonus plafonné à 8 s.
- **DOCTRINE — `auth` est hors formule standard.** Un compte d'essai est vide : il prouve qu'on
  s'est inscrit, ce que personne ne met en doute. Il ne départage aucune hypothèse, donc il ne
  convainc pas, quel qu'ait été son coût. **Ce qu'on filme à la place** : les pages produit
  publiques (`/platform/`, `/features/`, `/use-cases/`) qui embarquent déjà des captures de
  l'interface de l'éditeur, souvent peuplées de données de démo. Gratuit, sans session, sans
  expiration. Conditions pour rallumer `auth`, dans cet ordre : **1) l'offre est validée
  (mesurée)**, 2) le compte est peuplé parce que l'outil est utilisé au quotidien. Sans mesure du
  clic par outil (`/go/<tool>`), la condition 1 est invérifiable. Détail dans
  `screen-recording-contract.md` §4-bis.
- **Piège de maintenance** : une scène `auth` rend un projet non re-rendable dès que la session
  expire. La scène 08 de BotPenguin, testée en authentifié, a été remise sur la page publique pour
  cette raison — le projet redevient rendable indéfiniment.
- **Nettoyage** : tout le rebut est dans `_POUBELLE-2026-08-06/` (107 Mo), à supprimer à la main.
  Contenu : sorties de démo régénérables, harnais de test ponctuels, l'expérience A/B de juin sans
  point d'entrée, un `STATE.md` périmé, l'ancien `final-v1.mp4`. `demo-*.mp4` et `_POUBELLE-*/`
  ajoutés au `.gitignore`. **Vérifié après coup** : 35 imports relatifs résolus, `tsc --noEmit`
  strict propre sur tout `scripts/`.

## 2026-08-01 (nuit) — voix propre « Theo 2 », découpage anti-dérive, débit auto-mesuré

- **Nouvelle voix** : clone Pro de Théo (« Theo 2 »), `eleven_v3`, `stability 0.40` /
  `similarityBoost 0.65` / `style 0.05` / speaker boost activé. Réglages bas volontairement : au
  -dessus de 0,5 de stabilité le ton devient constant, et un ton constant est le premier signal
  « machine ». Détail et bornes à ne pas dépasser dans le nouveau **`references/voice-contract.md`**.
- **Découpage automatique des générations** (`generate-audio.ts`, `maxCharsPerRequest: 800`). Sur
  une longue génération le ton DÉRIVE — posé au début, plat à la fin — et **aucun réglage ne
  corrige ça**. Le script est désormais découpé en segments de ≤ 800 caractères, **uniquement sur
  des frontières de paragraphe** : dans cette pipeline un paragraphe est une scène, donc la coupure
  tombe sur un silence et ne s'entend pas. Effet de bord utile : le CTA final est presque toujours
  généré seul, donc avec un ton neuf.
- **Piège résolu au passage** : chaque segment revient avec un alignement relatif à lui-même, et
  `timestamps.json` alimente les sous-titres. Le décalage se mesure à l'**ffprobe du fichier
  produit**, jamais sur la fin du dernier caractère — un segment se termine par du silence, et
  prendre la fin du texte avancerait tous les sous-titres un peu plus à chaque segment, l'erreur
  s'accumulant jusqu'au bout de la vidéo.
- **Repli de modèle** : `/with-timestamps` exige un modèle qui expose l'alignement caractère par
  caractère et la doc ElevenLabs ne le garantit pas pour tous. Si `eleven_v3` est refusé, bascule
  unique sur `eleven_multilingual_v2` avec un `WARN` explicite — la vidéo se rend, mais la voix
  n'est pas celle choisie. **Conséquence d'écriture : aucune balise audio (`[pause]`, `[sighs]`)
  dans `voiceover.txt`** — elles sont propres à v3, et v2 les LIT À VOIX HAUTE.
- **Le débit est désormais mesuré et imprimé** à chaque génération
  (`DÉBIT MESURÉ 207 mots/minute`). C'est une constante d'instrument dont `script-director.md` se
  sert pour dimensionner les scènes : la voix précédente tournait à 206 quand le preset supposait
  150, et toutes les fenêtres étaient rééchelonnées d'un facteur 0,73 en silence. À relever et
  reporter à chaque changement de voix.
- **Ce qui ne transfère pas de l'interface web** : « génère trois fois et garde la meilleure »
  suppose une oreille humaine. La pipeline génère une fois. Pour reprendre la main : écouter
  `assets/audio/voice.mp3`, et si la prise ne va pas, supprimer le fichier et relancer.

## 2026-08-01 (nuit, après visionnage du premier rendu) — zéro image IA, zéro Ken Burns, crf 16

Trois défauts relevés par Théo sur `botpenguin-review`, le premier rendu au nouveau preset.
Trois causes distinctes, toutes dans le preset — aucune dans l'exécution.

- **Défaut 1 — « il faut aucune image IA, juste la vidéo du tool ».** Le plan était pourtant
  conforme : 3 `ai_image` sur 14, soit 21 %, sous le quota « ≤ 30 % » écrit la veille. Le quota
  mesurait la mauvaise chose. Une seule image générée au milieu de captures réelles ne se fond
  pas : elle signale « généré » et contamine la lecture des plans réels autour d'elle.
  **Nouveau seuil : `ai_image` = 0 scène dans le corps d'une vidéo tool-centric, hook compris.**
  La miniature reste la seule image générée. Les hyperframes ne comblent plus un trou de
  footage : un graphique HTML n'est autorisé que pour une donnée qu'aucune page ne montre.
- **Défaut 2 — « à 0:56 jusqu'à 1:03 la vidéo est hyper zoomée super laide, pareil à 1:16 ».**
  Ce sont exactement les deux scènes `screen_capture` en `motion: "push-in"`. Le Ken Burns
  recadre dans le pixel : invisible sur une photo générée en 1536×1024, c'est un
  **agrandissement d'un texte déjà à sa résolution native** sur une page web en 1920×1080.
  **Nouvelle règle : toute scène capture/enregistrement est `motion: "static"`.** Le mouvement
  vient du curseur et du scroll, il est DANS le clip. La règle « aucun plan totalement statique »
  de §VISUAL CADENCE est satisfaite par ce mouvement interne — les deux ne se contredisent pas.
- **Défaut 3 — « la vidéo de l'outil a l'air pixélisée ».** Le contenu d'écran (texte fin,
  aplats, bordures d'un pixel) est le pire cas de x264, et la chaîne empilait **trois
  générations** (webm du screencast → mp4 → `conformClip` → mux final) repartant chacune de
  `crf 20 + preset veryfast`. Réglage unique désormais dans `lib/ffmpeg.ts` :
  **`VIDEO_CRF = "16"`, `VIDEO_PRESET = "medium"`**, repris par `kenBurnsClip`, `conformClip`,
  `normalizeClip`, `finalMux` et `lib/recording.ts`. Filmage au viewport de sortie exact
  (`1920x1080`) pour supprimer tout rééchantillonnage. Coût : du temps CPU local, zéro dollar.
- **Leçon transversale, à retenir avant d'écrire le prochain quota** : un seuil en pourcentage
  autorise par construction ce qu'il plafonne. Quand le défaut est de NATURE (« ça se voit que
  c'est généré »), seul un seuil à zéro le corrige. Le quota « ≤ 30 % » n'a pas tenu 24 heures.
- `botpenguin-review` réécrit en conséquence : **14 scènes sur 14 en `screen_recording`**, toutes
  en `motion: "static"`, sur 6 pages réelles du site (home, use-case support, chatbot-for-website,
  pricing, mobile-app, chatbot-for-instagram). `voiceover.txt` inchangé au bit près — la voix
  ElevenLabs n'est pas refacturée. Anciens assets déplacés dans `_to_delete/` pour que la sonde
  disque d'`assemble` ne repêche pas un clip périmé (elle préfère `hyperframes/` à
  `recordings/`).

## 2026-08-01 (nuit) — repérage du site avant écriture

- **Nouvelle étape STEP 0-bis : REPÉRAGE** (`scripts/recon.ts` + `lib/recon.ts`, `recon.bat`).
  Avant d'écrire une vidéo tool-centric, la pipeline visite le site de l'outil et en dresse la
  carte : pages réelles classées (home/features/pricing/docs/blog), sections avec **sélecteur CSS
  stable** et position de scroll, boutons voisins, **prix tels qu'écrits sur la page**. Sortie
  dans `tool-maps/<domaine>.{json,md}`. Public uniquement, lecture seule, même trousse
  anti-blocage que la capture ; une page bloquée est écartée avec son motif.
- **Ce que ça change :** le script s'écrit en face de la carte (plus de fonctionnalité ni de prix
  inventés) et les beats visent des sélecteurs réels au lieu de coordonnées à l'aveugle — le
  curseur atteint vraiment le bouton dont parle la voix. C'était la pièce manquante pour que
  l'image et le script soient synchronisés par construction.
- **Piège corrigé au passage, valable pour tout code passé à `page.evaluate`** : `tsx`/esbuild
  réécrit les fonctions nommées en y injectant un helper `__name` qui n'existe pas dans le
  navigateur → « __name is not defined » à l'exécution, jamais à la compilation. Le code
  navigateur est donc écrit en **chaîne**, avec les antislashs doublés (dans un littéral de
  gabarit, `\s` vaut `s` — les deux pannes se sont produites en séquence au premier test).
- Vérifié de bout en bout sur un site à 5 pages : 4 pages cartographiées, 12 sections, 3 prix
  relevés, sélecteurs `data-testid` préférés aux chemins CSS quand ils existent, page vide
  écartée avec son motif.

## 2026-08-01 (soir) — le format passe en court, sur données de la chaîne

Analytics YouTube, 90 jours : **1 236 vues / 22 vidéos = 56 par vidéo**, durée vue moyenne
**85 s**, pourcentage moyen regardé **31,7 %**, 22 abonnés. Comparatif par cohorte : les vidéos
informationnelles de janvier (Anti-Freeze Banking 124 vues, Recruit Models 121, Start Agency 44)
écrasent les reviews mono-outil de juin (Anti-Detect 36, Bright Data 25, Inrō 19), avec des
durées vues trois fois supérieures. Conclusion : la factory produisait un format de 5-6 min que
personne ne regarde, sur un packaging qui ne clique pas.

- **RETRAIT de la règle « pas de Review dans le titre »** — c'était une erreur d'analyse de ma
  part, corrigée après objection de Théo. L'écart de CTR (0,65 % vs 13,3 %) avait été lu comme un
  problème de packaging ; c'est un écart de **volume de recherche**. `<Outil> Review` EST le
  mot-clé de la vidéo : le renommer en bénéfice aurait supprimé la seule requête sur laquelle
  elle peut se positionner. Les 9 titres concernés restent en l'état. Nouvelle règle : le titre
  commence toujours par le mot-clé visé, et seul l'angle après les deux-points se retravaille.
- **Nouvelle §MIX ÉDITORIAL.** Le vrai défaut n'était pas les titres mais le mix : 9 reviews
  mono-outil sur 22, toutes sur des requêtes à faible volume. Deux types désormais distingués —
  LARGE (« Best X for Y », « How to X » : gros volume, apporte vues et abonnés) et REVIEW
  (faible volume, forte intention : convertit). **Ratio cible 2 LARGE pour 1 REVIEW**, l'inverse
  d'aujourd'hui. Et une review **ne se juge jamais sur ses vues** mais sur ses clics `/go/` ÷
  vues : 25 vues qui envoient 4 clics battent 300 vues qui n'en envoient aucun.
- **Nouveau format par défaut : S — SHORT TOOL BRIEF.** 2 min 30, 350-400 mots, 13-15 scènes,
  six blocs verrouillés : hook (8 s) · l'outil en une phrase (homepage filmée) · les 3 choses qui
  comptent (parcours filmé + le chiffre qui tranche) · le prix (vraie grille) · **la limite**
  (page réelle qui l'atteste) · CTA. Le mix 40B/30C/20D/10A est périmé.
- **Ordre pensé pour l'abandon réel** : prix et limite arrivent avant la 85ᵉ seconde. Un
  spectateur qui part à la moyenne a quand même eu les deux informations qui décident du clic.
- **Le bloc « limite » n'est pas optionnel** : dire pour qui l'outil ne convient PAS est ce qui
  rend crédibles les blocs précédents. Une vidéo qui ne dit que du bien se lit comme une
  plaquette en dix secondes.
- **Supprimé du contrat de script** : PROMISE, les 5-8 blocs de BODY, PROOF séparée, les [PI]
  toutes les 60-90 s, l'open loop payé avant 50 %. Sur 150 s, ces dispositifs de rétention longue
  n'ont pas le temps d'exister.
- **CONTENT SELECTION passe de 5-8 insights à exactement 3**, filtrés par : ça change la décision
  d'achat / ça se MONTRE à l'écran / ça se dit en quinze secondes. Et le point le plus fort quitte
  le hook pour le bloc 3 — le hook porte le problème, pas la solution.
- **Quota de footage recalibré** : ≥9 scènes réelles sur 13-15 et ≥90 s, soit **60 % du temps
  d'écran** ; `ai_image` **≤30 %** (contre 65 % sur l'ancien gabarit) ; ≥3 `screen_recording`,
  dont les beats 2 et 3 ; 8-12 s par scène filmée. Les 4 beats obligatoires ne sont plus des
  ajouts à caser : ils SONT les blocs 2 à 5.
- Coût de production divisé par deux (13-15 images au lieu de 30, voix deux fois plus courte).

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

---

_Historique plus ancien (9 entrées de juin) : `docs/archives/CHANGELOG-2026-T2.md`._
