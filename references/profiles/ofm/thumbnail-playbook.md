# Thumbnail Playbook — chaîne OFM · **DA VERROUILLÉE v2**

> **Ce fichier a changé de nature le 2026-08-01.** Avant : un catalogue de 7 archétypes parmi
> lesquels choisir par vidéo. C'était une consigne de *variété* — l'inverse d'une direction
> artistique. Résultat mesuré sur 22 vidéos publiées : aucun squelette commun, un décor
> réinventé à chaque fois (« dark bedroom », « trading-floor », « tech room »), des accents de
> couleur ad hoc (or, rouge), une police décrite comme « Bebas Neue **ou** Impact ». Une chaîne
> dont les miniatures ne se ressemblent pas ne se reconnaît pas dans une sidebar.
>
> Désormais : **UN squelette, zéro variation.** Tout ce qui suit est figé au niveau chaîne. La
> seule chose qui change d'une vidéo à l'autre, c'est l'objet héros, le logo de l'outil et les
> deux lignes de texte. Il n'y a plus d'archétype à choisir, plus de décor à inventer, plus de
> palette à décider. C'est le principe 20/80 appliqué à la miniature : on preset une fois, on
> ne décide plus rien par vidéo.

---

## 0. La règle qui tient tout le reste

**La cohérence prime sur l'optimisation de chaque miniature prise isolément.** Une miniature
un peu moins bonne mais qui appartient visiblement à la même série bat une miniature un peu
meilleure mais orpheline — parce que la reconnaissance se construit sur la répétition, pas sur
le pic. Si un jour tu hésites entre « respecter la DA » et « cette vidéo mériterait autre
chose » : respecte la DA.

**Corollaire — la DA ne se change pas par vidéo.** Elle se change au plus une fois par
trimestre, sur données CTR, et le changement s'applique alors à **toutes** les vidéos
suivantes, jamais à une seule. Une DA qu'on ajuste souvent n'est pas une DA.

**Statut de ce preset :** direction probable, pas vérité. Le squelette ci-dessous est construit
sur les contraintes réelles de lisibilité mobile et sur ce que la pipeline sait rendre — il
n'est pas encore validé par le CTR de CETTE chaîne. Il le sera par la §7.

---

## 1. La miniature est un livrable de pipeline, pas une étape Canva

**C'était la cause racine de la dérive.** 22 miniatures montées à la main, une par une, dans
Canva — il n'existe aucun moyen d'être cohérent comme ça. La pipeline sait déjà le faire
(`thumbnailOverlay`, ffmpeg local, $0) : le plan écrit une entrée `sceneId: "thumbnail"` dans
`image-prompts.json`, la pipeline sort **`assets/thumbnail.jpg`** (DA incrustée, 1280×720, prête
à uploader) et `assets/thumbnail-raw.png` (sans texte, pour retouche).

Sortie en **JPEG q≈92** et pas en PNG : un PNG photoréaliste 1280×720 dépasse régulièrement la
limite de 2 Mo de YouTube.

```json
{
  "sceneId": "thumbnail",
  "quality": "high",
  "prompt": "<§3 — objet héros + le bloc DA figé, recopié à l'identique>",
  "overlay": {
    "lines": ["LIGNE1", "LIGNE2"],
    "accent": "#00C8FF",
    "logo": "assets/logos/<outil>.png"
  }
}
```

- `quality: "high"` **uniquement ici** — c'est l'asset CTR, le seul endroit où le tier haut se
  rentabilise. Les scènes restent au défaut `IMAGE_QUALITY`.
- Le champ `logo` pointe un **vrai fichier PNG** (chemin relatif au dossier du projet)
  téléchargé depuis le press kit de la marque. Un logo n'est **jamais** généré par IA (le modèle
  ne sait pas écrire → baragouin). Pas de fichier = pas de logo, le reste est rendu normalement.
- La **marque de chaîne** n'est pas un champ : elle est lue une fois pour toute la chaîne dans
  `references/profiles/<channel>/channel-mark.png`. C'est voulu — un élément d'identité ne se
  redécide pas par vidéo.
- **Plus aucun `thumbnail.md`** à produire. Quatre projets en contiennent encore un
  (anti-detect, inro, onlyspoofer, onlytraffic) : ils sont caducs et à supprimer.

> ## ✅ Implémenté le 2026-08-01 — ce que le code fait désormais
>
> `thumbnailOverlay` (`lib/ffmpeg.ts`) compose la DA complète : scrim en dégradé, seam, titre
> aligné à gauche, slots marque et logo, sortie JPEG. Les constantes de la §2 vivent dans
> `THUMBNAIL_DA`, **volontairement en dur et non configurables** : les rendre paramétrables par
> vidéo rouvrirait exactement la porte que ce playbook ferme.
>
> - **Auto-fit** : `lib/fontmetrics.ts` lit les métriques du TTF (cmap, hmtx, glyf) et calcule la
>   taille avant de composer le filtergraph — `drawtext` est incapable de mesurer un texte puis
>   de se réduire. Les deux lignes partagent toujours **une seule** taille.
> - **Placement vertical calibré, pas supposé** : `drawtext` positionne `y` sur le haut de l'encre
>   réelle, pas sur la ligne d'ascendante. Vérifié au pixel sur un rendu (y=216 → encre à la ligne
>   216). Le bloc de capitales tombe à 244→477, centre 360,5 pour une cible de 360.
> - **`overlay.logo`** existe désormais dans le type. La marque de chaîne est lue dans
>   `references/profiles/<channel>/channel-mark.png`. **Les deux slots sont optionnels** : fichier
>   absent → slot vide, un `WARN` au log, et le rendu reste valide.
> - **🔴 Le correctif décisif** : l'entrée `sceneId: "thumbnail"` est maintenant **exclue** de
>   l'ajout de la chaîne de style globale. Sans lui, le modèle recevait le bloc DA (« charcoal
>   void, no environment ») suivi de « dark luxury tech setting, silhouette only, no visible
>   face » — le décor que la §2 bannit, plus deux négations interdites par la méthode inversée.
>   La DA était littéralement inapplicable.
>
> **Reste à ta charge :** déposer `channel-mark.png` dans le profil de la chaîne. Tant qu'il
> manque, la DA tourne sans son élément de reconnaissance le plus fort.

---

## 2. LE SQUELETTE — figé, coordonnées exactes (canvas 1280×720)

Tout est en pixels absolus sur un canvas 1280×720. Rien ici ne dépend de la vidéo.

```
┌──────────────────────────────┊──────────────────────────────┐
│ ◆ marque chaîne (40,40)      ┊            logo outil (→1240)│  ← y 40, h 36 / h 52
│                              ┊                              │
│                              ┊                              │
│        OBJET HÉROS           ┊   LIGNE 1 (blanc)            │  ← capitales y 244→336
│     (débordant à gauche)     ┊   LIGNE 2 (#00C8FF)          │  ← capitales y 388→476
│                              ┊                              │
│                              ┊                              │
│                          seam┊  ZONE MORTE — rien y > 576   │
└──────────────────────────────┊──────────────────────────────┘
                            x=576                          x=1280
```

| Élément | Valeur figée |
|---|---|
| **Canvas** | 1280 × 720, sortie **JPEG q≈92** (< 2 Mo imposé par YouTube) |
| **Zone sujet** | x 0 → 576 (45 %) — l'objet héros y **déborde du bord gauche** (cadrage : §3, visé par le prompt, non garanti) |
| **Seam** | barre verticale pleine, x = 576, largeur **10 px**, hauteur totale, `#00C8FF`, glow externe 12 px à 40 % |
| **Scrim droit** | dégradé horizontal : transparent à **x = 576** (bord du seam) → `#05070C` à **92 %** à x = 760, maintenu jusqu'à 1280. Ne jamais démarrer avant 576 : ça assombrirait le bord de l'objet héros |
| **Titre** | 2 lignes exactement, **alignées à GAUCHE sur x = 632**, Impact, taille 112 px |
| ↳ interligne | **144 px** entre les deux hauts de capitales |
| ↳ bloc visible | capitales de y ≈ **244** à y ≈ **476**, centré sur y = 360 |
| ↳ ligne 1 | `#FFFFFF` · ligne 2 | `#00C8FF` |
| ↳ contour | `borderw=8`, `bordercolor=black@0.9` (lisibilité si le scrim est trop clair) |
| ↳ auto-fit | si une ligne dépasse 600 px : réduire par pas de 8 px, **plancher 96 px**. En dessous, on ne rétrécit pas — **on réécrit la ligne** |
| **Marque de chaîne** | coin haut-gauche, ancrée à (40, 40), hauteur 36 px, blanc à 85 % |
| **Logo outil** | coin haut-droit, **bord droit à x = 1240**, y = 40, hauteur 52 px, tel quel (jamais redessiné) |
| **Zone morte** | **rien** en dessous de y = 576 — barre de progression + badge de durée YouTube |

**Pourquoi ces choix, pour que personne ne les « améliore » par erreur :**

Le seam à 45 % est la signature. C'est un élément géométrique identique sur 100 % des vidéos,
visible même à la taille d'un timbre-poste où ni la police ni le sujet ne sont lisibles — c'est
lui qui fait dire « ah, c'est cette chaîne » dans une sidebar. Il sépare aussi physiquement
sujet et texte, ce qui règle le problème de lisibilité sans travail par vidéo.

Le titre est aligné à GAUCHE sur une abscisse fixe, pas à droite. Aligné à droite (comme
aujourd'hui), le bord gauche du texte bouge à chaque titre selon sa longueur : deux miniatures
côte à côte n'ont pas le même point de départ visuel. Aligné à gauche sur x = 632, le texte
commence **toujours** exactement au même endroit.

La police est **Impact, point.** « Bebas Neue ou Impact » était une DA à deux visages : ce sont
deux polices très différentes. Et `FONT_CANDIDATES` ne cherche même pas Bebas Neue : il résout
`impact.ttf` sur Windows — la machine de rendu — et retomberait sur DejaVu Sans Bold sur Linux.
On verrouille ce qui est réellement rendu, pas ce qu'on aimerait rendre.

**Contrainte d'écriture qui en découle** (mesurée sur les métriques réelles d'Impact, moyenne
0,4534 em/caractère) : dans 600 px à 112 px, il tient **≈ 12 caractères s'ils contiennent des
espaces, mais seulement ≈ 10 pour un mot plein** — un mot long est bien plus large que la
moyenne. Règle sûre : **≤ 10 caractères par mot et ≤ 12 au total.**

Écris les deux lignes sous cette contrainte plutôt que de compter sur l'auto-fit : une ligne
rétrécie casse l'homogénéité de la série, et c'est précisément ce que la §6 rejette.

`GONE IN 90S` (11, 541 px) ✅ · `SAVED $150K` (11, 586 px) ✅ · `4 DOLLARS` (9, 452 px) ✅ ·
`OR 4 DOLLARS` (12, **600 px**) ❌ pile à la limite · `$0.50 VS $4.30` (14, 676 px) ❌ →
se réécrit `50 CENTS` / `4 DOLLARS`.

> Les exemples sont écrits en capitales parce que la pipeline applique `toUpperCase()` : ce que
> tu écris en minuscules sortira quand même en capitales, autant le voir en l'écrivant.

**Composition ffmpeg attendue** — obligatoirement `-filter_complex` à **4 entrées**, pas un
`-vf` mono-entrée : `overlay` exige deux flux vidéo et ne peut pas vivre dans la chaîne actuelle.

```
-i thumbnail-raw.png  -i scrim.png  -i channel-mark.png  -i <tool-logo>.png

-filter_complex "
  [0:v] scale=1280:720:force_original_aspect_ratio=increase,
        crop=1280:720,
        drawbox=x=576:y=0:w=10:h=720:color=0x00C8FF@1.0:t=fill   [base];
  [base][1:v] overlay=0:0                                        [scr];
  [scr] drawtext=<font>:text='LIGNE1':fontsize=<fit>:fontcolor=white:
        borderw=8:bordercolor=black@0.9:x=632:y=<y1>,
        drawtext=<font>:text='LIGNE2':fontsize=<fit>:fontcolor=0x00C8FF:
        borderw=8:bordercolor=black@0.9:x=632:y=<y2>              [txt];
  [txt][2:v] overlay=40:40                                        [mark];
  [mark][3:v] overlay=W-w-40:40                                   [out]
" -map "[out]" -frames:v 1 -update 1 -q:v 3 thumbnail.jpg
```

- **`scrim.png`** : le dégradé 576 → 760 est un PNG RGBA 1280×720 **généré une fois** et mis en
  cache dans le profil de la chaîne. Plus simple, plus rapide et bien plus stable qu'un `geq`.
- **`<fit>`, `<y1>`, `<y2>`** sont calculés **côté TypeScript** avant de composer la commande :
  largeur du texte à partir des métriques du TTF, taille retenue par l'auto-fit, puis positions
  verticales pour que le bloc de capitales reste centré sur y = 360. ffmpeg ne sait pas faire
  cette mesure lui-même.
- Le logo est facultatif : sans fichier, on saute simplement la dernière branche.

---

## 3. LE PROMPT IMAGE — bloc figé + une seule variable

Le prompt de la miniature est un gabarit avec **un seul trou**. Le bloc DA se recopie mot pour
mot ; ne jamais le paraphraser, ne jamais « adapter le décor au sujet » — c'est précisément ce
qui a produit l'incohérence des 22 premières.

```
A high-impact YouTube thumbnail. Subject: one single oversized ultra-detailed
[OBJET HÉROS], isolated, held by one bare human hand with visible skin texture,
positioned in the LEFT 45% of the frame and cropped so it bleeds off the LEFT edge.

<<< BLOC DA — RECOPIER À L'IDENTIQUE, NE JAMAIS REFORMULER >>>
Background: charcoal void studio backdrop, no environment, no furniture, no room
detail, soft blue bokeh depth far behind. Lighting: one single cyan rim light from
the upper right, extreme contrast, deep black falloff. Palette: near-black #05070C
base, cyan #00C8FF accent, white highlights, nothing else. Composition: the entire
RIGHT half of the frame is empty background — no object, no detail, no light source
there. Sharp focus, photorealistic, 8k, 16:9.
<<< FIN BLOC DA >>>
```

**Méthode inversée obligatoire** (cf. `style.md`) : ne jamais écrire les mots `text, word,
letter, label, logo, sign` — gpt-image-1 ignore les négations et le mot **attire** l'artefact.
Décrire les surfaces en positif : « plain blank surfaces, unmarked casing, empty clean screen,
abstract glowing panels ». Le texte et le logo réel sont posés en overlay par la pipeline,
jamais demandés au modèle.

### La seule variable : l'objet héros

| L'angle de la vidéo porte sur… | Objet héros |
|---|---|
| Un ban / un blocage / un risque de compte | une grille de vignettes de comptes dont une vire au rouge alarme |
| Un proxy / une IP / du réseau | un nœud réseau en verre avec des filaments lumineux qui en sortent |
| De l'argent / du ROI / du pricing | une pile de jetons en verre, ou une balance qui penche |
| Un CRM / des DM / des leads | un smartphone débordant de bulles lumineuses |
| Un outil / un dashboard / une infra | une dalle de verre flottante à panneaux lumineux abstraits |
| Du juridique / un contrat / une banque | une chemise cartonnée en verre, ou une carte bancaire fissurée |

Un seul objet. Jamais deux. Jamais une scène. Si le sujet n'entre dans aucune ligne, prendre
« dalle de verre flottante » — le défaut générique — plutôt que d'inventer.

### Couleur d'alarme — la seule exception tolérée

`#FF3B30` est autorisé **uniquement** quand l'angle est un ban / un blocage / une perte, et
**uniquement sur ≤ 15 % de la surface** (une vignette qui vire au rouge, pas un fond rouge).
**Bannis sans exception : or, vert, violet, orange, magenta.** Chacune de ces couleurs est
apparue dans les prompts de miniature des projets existants (or sur onlytraffic, rouge et
ambiances divergentes ailleurs) et chacune casse la série. *(Constaté dans les `thumbnail.md`
des projets ; les miniatures publiées elles-mêmes n'ont pas été inspectées pixel à pixel.)*

---

## 4. Le texte — 2 lignes, et ce qu'elles doivent dire

- **2 lignes exactement.** Pas une, pas trois.
- ≤ 12 caractères par ligne (§2). ALL CAPS. Chiffres en chiffres (`90s`, `$175`) — ils sont
  posés en overlay, donc nets, contrairement à l'image.
- **Ligne 1 = le sujet ou la perte. Ligne 2 = la conséquence ou le chiffre.** La ligne 2 est en
  cyan : c'est elle que l'œil attrape en premier, elle doit porter l'information qui pique.
- Le texte **ne répète jamais le titre** de la vidéo. Titre et miniature sont deux moitiés d'une
  même phrase, pas la même phrase deux fois. Si le titre dit « Stop the TikTok Shadowban »,
  la miniature ne dit pas « SHADOWBAN » — elle dit ce que ça coûte : `1 CLIP` / `15 BANNED`.
- Jamais le mot « OnlyFans » sur la miniature.

**Exemples conformes** (repris des vidéos existantes, recalibrés) :
`1 FLAG` / `5 BANNED` · `2AM BUYER` / `GONE IN 90s` · `1 CLIP` / `15 BANNED` ·
`$175` / `SAVED $150K`

---

## 5. Le logo de l'outil

Sur une vidéo qui parle d'un produit nommé, le vrai logo booste le CTR : reconnaissance
immédiate par l'audience qui cherche ce produit. Il est donc **par défaut présent** sur toute
vidéo centrée sur un outil.

- Fichier réel, téléchargé depuis le site ou le press kit de la marque, rangé dans
  `assets/logos/<outil>.png` du projet. Jamais généré, jamais redessiné, jamais retapé à la main.
- Position et taille figées (§2). Il ne vole pas la vedette : 52 px de haut sur 720.
- **Droits :** usage nominatif (montrer le produit qu'on critique) généralement admis ; comme
  on est affilié, vérifier les brand/affiliate guidelines de la marque et ne jamais laisser
  entendre un partenariat ou un endorsement officiel.

---

## 6. Rejet automatique — checklist avant de valider une miniature

Une seule case cochée = on refait. Ce sont toutes des façons de casser la série.

- [ ] Un décor est visible (bureau, chambre, salle de marché) au lieu du fond charcoal void
- [ ] Une couleur hors palette apparaît (or, vert, violet, orange, magenta)
- [ ] Le rouge alarme dépasse ~15 % de la surface, ou apparaît sur un angle qui n'est pas un ban
- [ ] Deux objets héros, ou une scène au lieu d'un objet isolé
- [ ] Quelque chose occupe la moitié droite de l'image générée (elle doit être vide)
- [ ] Du texte lisible dans l'image générée (≠ overlay)
- [ ] Une ligne de titre a dû être rétrécie sous 96 px pour tenir
- [ ] Une seule ligne de titre, ou trois
- [ ] Quoi que ce soit sous y = 576
- [ ] Le seam, la marque de chaîne ou le logo manquent
- [ ] La miniature a été montée à la main dans Canva plutôt que sortie par la pipeline
- [ ] Le log a émis un WARN « titre réduit à N px » ou « marque de chaîne absente »

---

## 7. Mesure — ce qui fait sortir ce preset du statut « hypothèse »

Le squelette ci-dessus est cohérent par construction, mais son CTR n'est pas encore démontré
sur cette chaîne. Ce qui le validera :

1. Journal : pour chaque vidéo publiée sous la DA v2, consigner CTR à 7 j et à 28 j
   (`youtube_video_analytics`), avec l'objet héros et les deux lignes.
2. **Comparaison honnête** : les 22 premières vidéos ne sont pas un groupe témoin propre (titres
   « X Review » à CTR effondré, sujets différents, miniatures manuelles). Le vrai signal, c'est
   la **variance** : si le CTR des vidéos DA v2 se resserre autour d'une moyenne plus haute, la
   DA travaille. Le baseline documenté à battre : 0,65 % (packaging review) à 13,3 % (packaging
   problème + ressource gratuite).
3. Révision **trimestrielle**, jamais à chaud, jamais par vidéo. Ce qui gagne remonte dans la
   §3 (objet héros) ou la §4 (formulation) — le squelette §2, lui, ne bouge qu'en cas
   d'échec franc.

> Ce qu'il ne faut PAS faire : ajuster la DA après une vidéo décevante. Un CTR de vidéo isolée
> est du bruit — le sujet, le titre et l'heure de publication pèsent plus lourd que la
> miniature. Changer la DA à chaque déception, c'est reproduire exactement l'incohérence qu'on
> vient de corriger.
