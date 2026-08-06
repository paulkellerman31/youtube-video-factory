# Contrat — `source: "screen_recording"` (capture vidéo animée, $0)

> **Pourquoi cette source existe.** Retour terrain 2026-08-01 : les vidéos 100 % IA sont lues
> comme « délégué à quelqu'un qui n'y connaît rien ». Mesure sur les 6 plans OFM (relevé
> 2026-08-01) : **79 % à 97 % des scènes en `ai_image`**, de 23/29 à 29/30. Un diaporama de
> ~30 images générées avec une voix par-dessus
> ne contient **aucune trace qu'un humain ait touché l'outil**. Un curseur qui bouge, une page
> qui défile, une ligne de pricing qu'on survole — c'est la preuve la moins chère et la plus
> lisible qu'il y a quelqu'un derrière. Ça règle simultanément le grief « c'est du robot » et
> le grief « on parle d'un outil qu'on ne montre jamais ».
>
> `screen_capture` (existant) fige une page. `screen_recording` la **filme**. Même Playwright,
> même Chrome local, même $0.

---

## 1. Format dans `image-prompts.json`

```json
{
  "sceneId": "s14",
  "source": "screen_recording",
  "recording": {
    "url": "https://nodemaven.com/pricing",
    "viewport": "1920x1080",
    "cursor": true,
    "hideSelectors": ["#cookie-banner"],
    "startAt": { "selector": ".pricing-grid" },
    "beats": [
      { "do": "settle",   "ms": 900 },
      { "do": "moveTo",   "selector": ".plan--pro",        "ms": 900 },
      { "do": "dwell",    "ms": 2400 },
      { "do": "scrollTo", "selector": ".comparison-table", "ms": 1600 },
      { "do": "dwell",    "ms": 2600 }
    ]
  }
}
```

**Champs.** `url` (requis, http(s) public) · `viewport` (défaut `1920x1080`, à garder égal à la
résolution de sortie) · `cursor` (défaut `true`) · `hideSelectors` (en plus des sélecteurs
cookies génériques) · `startAt` (`{ selector }` ou `{ y }` — position de départ appliquée hors
caméra, voir §2) · `beats` (requis, ≥ 2).

**Verbes de beat :**

| `do` | Cible | Effet |
|---|---|---|
| `settle` | — | ne rien faire, laisser la page respirer |
| `moveTo` | `selector` **ou** `x`/`y` | déplace le curseur en courbe amortie |
| `scrollTo` | `selector` **ou** `y` | défile par à-coups de molette jusqu'à la cible — un seul par scène, ≤ 600 px |
| `dwell` | — | curseur immobile, la scène se lit |
| `hover` | `selector` | `moveTo` + maintien, déclenche les états `:hover` |
| `click` | `selector` | clic — **usage restreint, voir §4** |

**Durée — le piège à connaître.** La somme des `ms` vise la durée audio planifiée de la scène,
mais ce n'est pas la fenêtre finale : `assemble.ts` rééchelonne **toutes** les scènes
(`factor = audioDur / planEnd`) et verse en plus tout le `drift` résiduel sur la dernière. Le
tournage a lieu à l'étape *images*, avant l'assemblage — ce facteur est donc inconnu au moment
où l'on filme.

Conséquence : enregistrer **+30 % de la durée planifiée, minimum 3 s de rab**. Si la fenêtre
finale dépasse quand même la durée enregistrée, `conformClip` applique
`tpad=stop_mode=clone` → **la dernière frame est gelée**, c'est-à-dire exactement le plan figé que
§VISUAL CADENCE qualifie de « retention killer ». Dans ce cas, logguer un `WARN` explicite plutôt
que de laisser passer silencieusement un plan mort.

---

## 2. Ce qui fait « humain » — le cœur du sujet

Un scroll linéaire piloté par script se voit immédiatement : c'est ça qui trahit l'automate.
Trois détails font toute la différence, et ils ne coûtent rien à l'exécution.

**Le curseur suit une courbe, pas une droite.** Une main ne va jamais d'un point A à un point B
en ligne droite. Interpoler sur une Bézier quadratique dont le point de contrôle est décalé
perpendiculairement de 8 à 14 % de la distance parcourue (signe alterné d'un mouvement à
l'autre). Vitesse en ease-in-out, jamais constante.

**Le mouvement dépasse puis se corrige.** À l'arrivée d'un `moveTo`, dépasser la cible de 5 à
8 px, marquer ~120 ms, revenir. Idem sur un `scrollTo` : dépasser de 3 à 6 px et corriger. C'est
le geste le plus reconnaissablement humain qui existe et il est trivial à coder.

**Le défilement se fait par à-coups, pas d'un seul glissement.** ⚠️ **Corrigé le 2026-08-01
après visionnage — la première version était fausse.** Elle animait toute la distance en une
seule courbe ease-in-out plafonnée à 900 px/s : fluide, continue, et produite par aucun humain.
Une molette avance la page par crans — trois ou quatre en rafale, puis la main s'arrête pendant
que l'œil lit, puis une autre rafale. **Ce qui trahit l'automate n'est pas la vitesse, c'est
l'absence de pauses** : une page à vitesse constante est aussi robotique qu'un curseur à vitesse
constante.

Implémentation (`humanScrollTo`) : rafales de 180 à 420 px, chacune en décélération (ease-out,
comme une molette qui s'arrête), séparées par de courtes hésitations, avec une pause de lecture
plus longue toutes les trois ou quatre rafales. **Le temps de beat non consommé par le mouvement
part dans les pauses, jamais dans un glissement plus lent** — c'est l'immobilité qui se lit comme
humaine, donc c'est elle qu'on achète avec les millisecondes restantes. Aléa déterministe (LCG
semé sur la distance) : le même spec filme deux fois pareil, contrairement à `Math.random`.

Piège annexe : les sites en `scroll-behavior: smooth` ou en scroll-jacking (Lenis,
ScrollSmoother) se battront contre le script — dans ce cas neutraliser le CSS via
`addStyleTag`, ou basculer la scène en `manual_asset`.

**Une scène ne s'ouvre pas sur un trajet — elle s'ouvre sur son sujet.** Champ `startAt`
(`{ selector }` ou `{ y }`) : la page est positionnée pendant le pré-roll, donc AVANT la
frontière de rognage, donc jamais à l'écran. Sans lui, toute scène parlant d'une section à
4 000 px devait commencer par cinq secondes de transit — sur une fenêtre de huit secondes,
l'essentiel du plan passe à voyager, et ça se lit comme une machine qui cherche, pas comme
quelqu'un qui lit. Le pré-positionnement descend par paliers de ~1 400 px pour déclencher le
lazy-load : atterrir à froid sur un offset profond filme une page à moitié construite.

**Le curseur arrive quand la voix nomme la chose — ancrage sur le mot (2026-08-01).**
Défaut relevé au visionnage : *« la souris n'est pas parfaitement synchro avec ce qui est dit »*,
constaté sur la scène qui énumère les plans tarifaires. Deux causes, cumulées.

1. Les beats étaient répartis « à peu près » sur la fenêtre, sans rapport avec la position des
   mots dans le paragraphe. Le curseur passait sur la carte à vingt-neuf dollars pendant que la
   voix parlait encore de la gratuite.
2. `conformClip` rogne par la **fin**. Avec 15 % de marge de tournage, la dernière seconde et
   demie disparaît — et si un déplacement de curseur s'y trouve, il n'arrive jamais à l'écran.

**Méthode.** Pour chaque cible nommée par la voix, estimer sa date par la position du mot dans le
paragraphe (`index / total × durée de la fenêtre` — les mots sont à peu près isochrones), puis
construire les beats **à rebours** pour que le `moveTo` ATTERRISSE à cette date : on part de la
date d'arrivée, on soustrait la durée du déplacement, et le `dwell` qui précède comble l'écart.

**Et tout le surplus va dans le dwell FINAL.** C'est la partie rognable : elle ne doit jamais
contenir autre chose qu'une attente. Un plan dont le dernier beat est un déplacement est un plan
dont le geste final ne sera pas vu.

> Exemple réel (fenêtre 10,17 s, quatre plans nommés) : voix à 0,58 / 3,49 / 6,10 / 8,43 s →
> curseur à 0,65 / 3,49 / 6,10 / 8,43 s, queue rognable de 1,53 s en `dwell` pur.

*Précision d'honnêteté : l'isochronie des mots est une approximation. `timestamps.json` contient
l'alignement réel caractère par caractère et permettrait un ancrage exact — l'étape audio tourne
avant l'étape images, donc rien ne s'y oppose techniquement. Non fait à ce jour ; l'approximation
suffit tant qu'un paragraphe ne mélange pas des mots très longs et très courts.*

**Budget d'immobilité — règle de composition, pas d'implémentation.**

- **Un seul beat `scrollTo` par scène**, et **≤ 600 px** à l'écran. Au-delà, c'est un `startAt`
  qu'il fallait écrire.
- **Le curseur est au repos au moins la moitié de la scène.** Enchaîner les `moveTo` produit un
  curseur qui balaie sans raison ; une main pose la souris et la laisse.
- Sur un `dwell` de plus de 2,2 s, un micro-déplacement unique et lent (une dizaine de pixels)
  vaut mieux qu'une immobilité au pixel près, qui est son propre tell.

Le curseur lui-même est un élément DOM injecté (flèche SVG blanche, ombre portée douce,
`position: fixed`, `pointer-events: none`, `z-index` max) — le vrai curseur système n'apparaît
pas dans l'enregistrement Playwright. Déplacer **aussi** `page.mouse` aux mêmes coordonnées pour
que les états `:hover` réels se déclenchent : c'est ce qui fait s'ouvrir les menus et s'allumer
les boutons, et donc ce qui rend la page vivante.

Deux pièges : un nœud DOM injecté est **détruit à chaque navigation** (y compris un `click`
d'onglet qui recharge) → l'injecter via `context.addInitScript` pour qu'il soit re-posé
automatiquement à chaque document. Et un `<dialog>` ou un élément en plein écran vit dans le
*top layer*, au-dessus de n'importe quel `z-index` : le curseur disparaîtra derrière une modale.

---

## 3. Implémentation — ✅ FAITE le 2026-08-01 (`lib/recording.ts`)

Le module existe et a été vérifié de bout en bout sur une page réelle : curseur visible,
courbe de Bézier avec dépassement-correction, scroll amorti, **états `:hover` réels déclenchés**
(la carte tarifaire s'allume au passage du curseur dans l'enregistrement — la preuve que
`page.mouse` bouge en plus du curseur dessiné), tête de clip coupée (2,0 s retirés sur un test),
sortie mp4 CFR 30 fps conforme au `concat -c copy`.

Champ supplémentaire au passage : **`plannedDurationSec`** — la durée prévue de la scène, qui
sert à calculer la marge d'enregistrement (§ Durée).

Le déroulé, pour référence :

0. **Refactor préalable de `lib/capture.ts` — fait.** `REALISTIC_UA`,
   `COMMON_COOKIE_SELECTORS`, `BLOCK_PATTERNS`, `BLOCK_STATUSES`, `LAUNCH_ARGS` et
   `diagnoseCapture` étaient module-private ; ils sont désormais exportés, avec les helpers
   `loadChromium`, `launchBrowser`, `contextOptions`, `hideAutomation`, `hideCookieBanners` et
   `probePage`. Le sondage anti-blocage est ainsi **strictement identique** entre capture fixe
   et enregistrement : sans ça, une page bloquée passerait d'un côté et pas de l'autre.
1. `chromium.launch` avec la **même trousse anti-blocage** que `lib/capture.ts` : channel
   `chrome` si dispo, `REALISTIC_UA`, `addInitScript` qui masque `navigator.webdriver`, locale
   et timezone cohérentes, `--disable-blink-features=AutomationControlled`.
2. `browser.newContext({ recordVideo: { dir: tmp, size: { width, height } }, … })`.
3. `page.goto(url, { waitUntil: "networkidle" })`, fallback `load`.
4. Masquer les bandeaux cookies (`COMMON_COOKIE_SELECTORS` + `hideSelectors`).
5. **Sonder la page AVANT de jouer les beats** avec `probePage` + `diagnoseCapture` (statut de
   blocage, motif Cloudflare/captcha, frame vide). Page inexploitable → **échec bruyant**, aucun
   fichier écrit, message qui renvoie vers `manual_asset`. Jamais une frame Cloudflare au montage.
   ⚠️ **Ne pas réutiliser le probe de `screenCapture` tel quel** : il scrolle jusqu'en bas puis
   remonte (déclenchement du lazy-load) — inoffensif pour une capture fixe, mais ici **c'est
   enregistré**.
6. Injecter le curseur, **horodater `t0Beats`**, jouer les beats, puis `context.close()`.
   ⚠️ **Playwright n'a aucune API start/stop d'enregistrement** : `recordVideo` couvre toute la
   vie du contexte. Le `.webm` contient donc la page blanche, le chargement, le flash du bandeau
   cookies avant masquage et le probe. **Cette tête doit être coupée** au `-ss` de l'étape 7,
   avec `offset = t0Beats − t0Contexte`.
7. Récupérer le fichier via `await page.video().path()` — **après** `context.close()`, le nom
   est aléatoire et le chemin indisponible avant (et `page.video()` est `null` si `recordVideo`
   n'a pas été activé). Puis **une seule passe** : `ffmpeg -ss <offset> -i <webm> … conformClip`
   vers `assets/recordings/<sceneId>.mp4`. Ne pas ré-encoder deux fois : `conformClip` produit
   déjà du libx264/`VIDEO_PRESET`/`VIDEO_CRF`/30 fps/`-an`, c'est lui qui rend le
   `concat -c copy` valide.
   Forcer `-vsync cfr -r 30` : le screencast Playwright sort en cadence variable et la durée de
   conteneur du `.webm` est peu fiable.
8. **Idempotence** : hash sha256 du spec normalisé (`url` + `viewport` + `beats` + `cursor` +
   `hideSelectors`). Re-tourné uniquement si le spec change — pas de retournage à chaque run.
9. Playwright reste un import dynamique paresseux : la pipeline tourne sans lui tant qu'aucune
   scène n'utilise `screen_capture` ni `screen_recording`.

**Au montage :** `motion: "static"` **obligatoire** sur ces scènes — le mouvement est déjà dans
le clip, et un Ken Burns par-dessus agrandit un texte déjà à sa résolution native (défaut relevé
au premier rendu : deux passages lus comme « hyper zoomé super laid »). Sous-titres incrustés
supprimés — comme `screen_capture`, `manual_asset` et `hyperframes`. `subs.srt` reste produit
intégralement pour les CC YouTube. `textOverlay` est **ignoré** sur un clip : ne pas en écrire.

---

## 3-bis. Qualité — le contenu d'écran est le pire cas de x264

Texte fin, aplats, bordures d'un pixel : ce que `crf 20 + preset veryfast` laisse passer sur une
photo devient visiblement pixelisé sur une page web. La chaîne empile **trois générations**
(webm du screencast → mp4 → `conformClip` → mux final) qui repartaient chacune du même crf.

- Réglage unique dans `lib/ffmpeg.ts` : **`VIDEO_CRF = "16"`**, **`VIDEO_PRESET = "medium"`**,
  utilisés par `kenBurnsClip`, `conformClip`, `normalizeClip`, `finalMux` — et repris tels quels
  par `lib/recording.ts`. Un seul endroit à changer, jamais quatre.
- **Filmer au viewport de sortie exact** : `1920x1080`, la résolution du master. Tout viewport
  plus petit est upscalé au montage et aucun crf ne le rattrape.
- Ne jamais corriger une source molle au montage : c'est la capture qu'on refait.
- Le coût est du temps CPU local, pas de l'argent. `medium` sur 150 s de 1080p reste de l'ordre
  de la minute.

**Local uniquement.** Chromium + ffmpeg + plafond de 45 s par commande côté assistant → ces
scènes ne se rendent que sur la machine de Théo, via `factory.bat`.

---

## 4. Interdits — non négociables

- **Aucune automatisation de login, jamais.** Pas de saisie d'identifiants, pas de formulaire
  d'authentification, pas de cookie de session rejoué, aucun secret transmis à l'assistant. Une
  page derrière login se filme uniquement via le profil décrit en 4-bis, où l'humain s'est
  connecté lui-même, à la main, hors de toute automatisation.
- `click` est réservé aux interactions **inoffensives et locales à la page** : onglet, accordéon,
  bascule mensuel/annuel d'une grille tarifaire, carrousel. Interdit : tout ce qui soumet un
  formulaire, crée un compte, lance un paiement, un essai, ou navigue hors du domaine.
- Pas de proxy résidentiel, pas de solveur de captcha. Un site vraiment blindé → `manual_asset`.
- Ne jamais filmer une page contenant des données personnelles de tiers.

---

## 4-bis. Scènes authentifiées — `"auth": true` (ajouté le 2026-08-06)

Le dashboard connecté est le footage le plus convaincant qui existe : il prouve que l'outil est
réellement utilisé, pas seulement lu. On sait maintenant le filmer avec le moteur de l'usine, sans
jamais automatiser une connexion.

### Le principe

La connexion est faite **une seule fois, à la main, par un humain**, dans un Chrome normal. Le
moteur ne fait que rouvrir ce profil déjà connecté et filmer. Aucune étape du login n'est
scriptée — c'est ce qui rend la chose à la fois sûre et fonctionnelle : Google refuse activement
les connexions depuis un navigateur piloté (« ce navigateur n'est peut-être pas sécurisé »), donc
tenter de scripter le login échouerait de toute façon.

### Pourquoi un dossier séparé et pas le profil Chrome habituel

**Chrome verrouille tout le dossier « User Data », pas un profil.** Un profil créé depuis le menu
Chrome vit à l'intérieur du dossier partagé : tant que le Chrome principal tourne, Playwright ne
peut pas l'ouvrir, et il faudrait tout fermer à chaque rendu. Un `--user-data-dir` distinct a son
propre verrou : les deux Chrome cohabitent. C'est la seule raison de ce détour.

`storageState` (export des cookies) a été écarté : il faut d'abord se connecter dans un navigateur
piloté pour le produire, ce qui ramène au blocage Google.

### La marche à suivre

1. Lancer `record-profile.bat` à la racine du repo. Il ouvre un Chrome sur `.chrome-record/`.
2. Se connecter à l'outil à filmer, vérifier que le dashboard s'affiche proprement.
3. **Fermer cette fenêtre.** Le Chrome habituel peut rester ouvert.
4. Marquer les scènes concernées `"auth": true` dans `recording` (`image-prompts.json`).

À refaire seulement quand la session expire. Le dry-run avertit si `.chrome-record` est absent —
l'erreur se voit à la vérification, pas après dix minutes de capture.

### Règles codées, pas recommandées

- **Aucun beat `click` dans une scène `auth`** — erreur dure dans `screenRecording()`. Sur un site
  vitrine, « interaction inoffensive » a un sens : un onglet, un accordéon. Dans un compte réel, la
  même notion s'effondre — un clic supprime un bot, lance un abonnement, vide une liste. On ne peut
  pas énumérer d'avance ce qui est sûr, donc la catégorie entière est interdite. Il reste
  `scrollTo`, `moveTo`, `hover` : largement de quoi faire une scène vivante.
- **Profil absent = arrêt dur.** Playwright créerait sinon un profil vide sans broncher et on
  filmerait une page déconnectée en croyant filmer le dashboard — défaut invisible jusqu'au
  visionnage.
- **`auth` entre dans le hash** de la scène : basculer une scène en authentifié la re-rend.
- `.chrome-record/` est **gitignoré**. Ce dossier contient des sessions actives : il vaut un mot de
  passe. Jamais versionné, jamais copié, jamais envoyé — il ne quitte pas la machine.
- **Ne jamais filmer de données personnelles de tiers.** Dans un dashboard, ça veut dire : pas de
  liste de contacts, pas de conversations réelles, pas d'emails de clients. Compte de démo ou
  données factices — et on vérifie l'image avant de publier, pas après.

### Ce que ça ne remplace pas

Une scène de dashboard greffée sur un script déjà écrit se voit. Le bon usage est de la prévoir
**au moment du script** : la promesse annonce ce qu'on va montrer, la scène le montre. Sinon,
`manual_asset` reste parfaitement valable.

---

## 5. `manual_asset` accepte toujours une vidéo

Voie manuelle, complémentaire de 4-bis : utile quand la session est trop pénible à ouvrir, quand
le parcours demande des clics (donc interdits en `auth`), ou quand il faut couper au montage. Extension : si `assets/captures/<sceneId>.mp4` (ou `.mov`) existe, il est conformé
comme un clip ; sinon `<sceneId>.png` est utilisé comme aujourd'hui. Aucun des deux = **arrêt
dur**, jamais de repli silencieux sur `ai_image`. Hash = hash des octets du fichier.

Ce que Théo enregistre lui-même, à la souris, dans son propre compte : la vue connectée qui
prouve qu'il utilise vraiment l'outil. 6 à 10 s suffisent.

---

## 6. Où ces scènes vont dans une vidéo

Voir le quota et les beats obligatoires dans `script-director.md` § TOOL FOOTAGE. En résumé :

- **Durée par scène : 5 à 9 s**, plafond 12 s. En dessous de 5 s on n'a pas le temps de lire ce
  qu'on montre ; au-delà de 12 s ça s'affaisse.
- **Ne pas enchaîner plus de deux scènes filmées** sans casser avec une image ou un hyperframe.
  Trois captures de suite redeviennent un tunnel, juste d'une autre nature.
- **Le scroll de ton propre article de blog** (`ofm-tools.com/...`) est une source de premier
  choix : jamais bloquée, elle prouve que le travail de recherche existe, et elle expose le site
  au passage. Bon candidat pour la scène de preuve ou pour la transition vers le CTA.
