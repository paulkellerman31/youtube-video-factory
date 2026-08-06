# Style — chaîne AnswerDelta

Chaîne spécialisée **outils GEO / AEO** : être cité dans les réponses des moteurs génératifs
(AI Overviews, ChatGPT, Perplexity, Copilot) plutôt que classé dans dix liens bleus. Audience :
SEO, growth, fondateurs, agences — des gens techniques qui achètent des outils.

> **Source de vérité de l'identité : `answerdelta/identite.md`, §9.** Les valeurs recopiées ici
> sont celles du logo et de la bannière, déjà verrouillées de fait. En cas de divergence, c'est
> `identite.md` qui fait foi et ce fichier qui a tort — ne jamais trancher une question
> d'identité ici.

**Famille esthétique de la chaîne** (pas un look rigide) : **studio produit sur fond quasi noir**,
objet héros unique et surdimensionné, une seule source de lumière rasante ambre, surfaces
propres, ombres nettes, photoréalisme 8k. Pas de « bureau », pas de « salle serveur », pas de
décor. Registre **instrument de laboratoire** : clinique, contrasté, précis — l'inverse du bleu
nébuleux générique de l'IA.

**Adaptatif par vidéo :** chaque prompt d'image se compose à partir du SUJET de la vidéo, puis la
pipeline y injecte telle quelle la chaîne de style globale ci-dessous. Cohérence interne d'une
vidéo > variété : pas de rupture de palette en cours de vidéo.

**Sujets techniques : visuels LITTÉRAUX d'abord.** Sur cette chaîne c'est presque toujours le cas —
on parle d'outils, de tableaux de bord, de citations, de classements. Panneaux de réponse
empilés, cartes de citation, comparatifs, interfaces stylisées, plutôt que des métaphores
abstraites. La métaphore reste permise pour une transition ou une émotion, jamais pour expliquer
une mécanique.

## Global style string (append verbatim to every image prompt)
```
<BRAND COLORS: amber + white>, single hard amber rim light from upper right, near-black studio
void backdrop, no environment, isolated hero object, sharp shadows, high contrast, laboratory
instrument register, photorealistic, 8k, 16:9
```

## Rules

- **16:9 always**. Never crop in post.
- **UN SEUL ACCENT PAR IMAGE.** L'ambre marque **ce qui est mesuré**, jamais la décoration. Dans
  un graphique à huit lignes, une seule est ambre : celle dont parle la vidéo. Deux accents dans
  une même image détruisent la hiérarchie et le registre instrument — c'est-à-dire exactement ce
  qui distingue la chaîne des vingt-trois autres. Cette règle vaut pour les images IA, les
  hyperframes, les overlays et les miniatures, sans exception.
- **No visible faces** — silhouettes, mains ou objets seulement. Quand une main apparaît,
  préciser « visible skin texture » (sinon rendu CGI).
- **Palette : ambre `#E8A33D` + blanc sur encre `#111111`.** Tableau complet plus bas.
- **ZÉRO texte parasite — méthode INVERSÉE.** Le modèle ne sait pas écrire **et ignore les
  négations** : écrire « no text / no logo » ATTIRE le mot et fait APPARAÎTRE l'artefact. On
  n'écrit donc **JAMAIS** les mots `text, word, letter, label, logo, sign, billboard,
  screen text` dans un prompt. À la place :
  - décrire les surfaces en **positif** : « plain blank surfaces, unmarked panels, empty clean
    screens, smooth featureless background, abstract glowing panels ».
  - pictogramme sans lettrage → « icon / emblem / symbol », jamais « logo ».
  - objets pièges décrits vides : facture→papiers vierges, écran→lueurs abstraites,
    classement→barres unies sans graduation.
  ⚠️ Consigne à écrire dans CHAQUE prompt AI_IMAGE — pas dans la chaîne globale (qui est hashée).
- **Une scène qui DOIT montrer des mots, des chiffres, un document ou un écran ne passe JAMAIS
  en AI_IMAGE.** Routage décidé au PLAN, jamais après rendu : `screen_capture`,
  `screen_recording`, `manual_asset`, GRAPHIC-hyperframes, ou image abstraite + text overlay.
  **Sur cette chaîne c'est la règle la plus souvent engagée** : une réponse d'IA avec ses
  citations, un classement, un tableau de bord de visibilité — c'est du texte porteur de sens,
  ça se filme ou ça se compose, ça ne se génère pas.
- **STRIP ≠ ROUTE.** Avant d'enlever le texte d'un prompt : décoratif ou porteur de sens ?
  Décoratif (faux sceau, motif de fond) → on vide, l'image garde son sens. Porteur de sens
  (un classement, un score, une citation) → **ne pas vider**, router. Une boîte vide à la place
  d'un classement ne corrige rien, elle tue la scène.
- **Hero object oversized** pour la lisibilité mobile.

## Motifs propres à la chaîne

Trois familles d'objet héros couvrent presque tous les sujets. S'y tenir construit la
reconnaissance ; en inventer une quatrième par vidéo la détruit.

1. **Panneaux de réponse empilés** — plaques de verre translucides flottantes, décalées en
   profondeur, une seule éclairée en ambre : la réponse citée. Pour tout ce qui touche à la
   citation, la visibilité, l'inclusion dans une réponse.
2. **Le delta** — un prisme triangulaire net, en verre ou en métal brossé, isolé, lumière
   rasante. Signature de la marque. Pour l'écart, la progression, la mesure, le avant/après.
3. **Instrument de mesure** — cadran, sonde, capteur, curseur physique surdimensionné, sans
   graduation lisible. Pour l'audit, le score, le suivi, le classement.

## Part du réel vs part de l'IA

Même quota que l'usine, et il vaut encore plus ici : on vend des outils, et une vidéo entièrement
générée est lue comme « déléguée à quelqu'un qui n'y connaît rien ».

- Format S (défaut, 13-15 scènes / ~150 s) : `ai_image` **≤ 30 % des scènes**, **≥ 9 scènes de
  footage réel** (≥ 90 s, soit 60 % du temps d'écran), dont **≥ 3 en `screen_recording`**. Quota,
  beats et contrôle arithmétique : `script-director.md` §TOOL FOOTAGE. Contrat de la source
  filmée : `references/screen-recording-contract.md`.
- **Pour montrer « l'intérieur » d'un outil, viser les pages produit qui embarquent des captures
  de l'interface** (`/platform/`, `/features/`, `/use-cases/`). Les éditeurs y affichent leur
  propre console, en haute définition, déjà peuplée de données de démo. Gratuit, sans session,
  sans expiration. Les scènes authentifiées (`"auth": true`) sont **hors formule standard** —
  conditions de réactivation dans `screen-recording-contract.md` §4-bis.
- `ai_image` reste le bon outil pour le concept, la métaphore, la transition. Plus pour montrer
  un produit.
- Ne pas enchaîner plus de trois scènes filmées d'affilée. Le cap ~7 s/plan vaut pour les plans
  IA, **pas** pour les scènes filmées (8-12 s) qui portent leur propre mouvement.

## Palette — VERROUILLÉE (logo + bannière, cf. `identite.md` §9)

| Rôle | HEX | Usage |
|---|---|---|
| Encre / fond | `#111111` | fonds, noirs profonds |
| **Accent sombre** | `#E8A33D` | ambre de marque — rim light, seam de miniature, ligne 2 des titres. **8,76:1 sur `#111111`, au-dessus du seuil AAA**, vérifié lisible à 360 px (taille d'une suggestion YouTube) |
| Accent clair | `#A8650E` | **uniquement sur fond clair** (site, liens, boutons sur blanc) — 4,63:1, passe AA |
| Blanc | `#FFFFFF` | highlights, ligne 1 des titres |
| Texte secondaire | `#B9BEC6` | sous-titres, légendes |
| Gris de données | `#8B919B` | séries non mises en avant dans un graphique |
| Surface surélevée | `#1C1C1C` | cartes, panneaux |
| Grille | `#1F1F1F` | axes, séparateurs |
| Alarme | `#FF3B30` | **seule** couleur secondaire admise, ≤ 15 % de la surface, uniquement sur un angle perte / blocage / chute |

**Le piège des deux valeurs d'accent.** `#E8A33D` sur blanc ne donne que **2,16:1** — sous tous
les seuils, illisible. Tout ce que produit cette pipeline est sur fond sombre, donc c'est
`#E8A33D` partout ici. Mais si une sortie part un jour sur une surface claire (article du site,
export en fond blanc), c'est `#A8650E` et jamais l'inverse. Une seule valeur dans un champ qui
n'en accepte qu'une : `#E8A33D`.

**Bannis pour AnswerDelta, sans exception : bleu, cyan, violet, teal, vert, magenta.** Les quatre
premiers sont la palette générique de la catégorie « visibilité IA » — celle qui ne distingue de
personne ; le cyan appartient en plus à la chaîne OFM.

**Réserve assumée, verrouillée en connaissance de cause.** Semrush et Ahrefs sont orange, donc un
ambre peut évoquer leur univers. C'est accepté : la différenciation visée est celle du
violet-bleu des outils de visibilité IA, pas celle des outils SEO historiques — et un ambre sur
noir pur, en registre laboratoire, ne se confond avec ni l'un ni l'autre.

**Police de marque : Impact, seule.** `FONT_CANDIDATES` la résout sur la machine de rendu
(Windows). Jamais « X ou Y » dans un preset d'identité.

## Miniature — hors de ce fichier

La direction artistique des miniatures est verrouillée dans `thumbnail-playbook.md`. Aucun choix
de miniature ne se prend ici ni par vidéo.

## By scene type
- **GRAPHIC** (données, chiffres, comparaison, mécanique) : rendu via **`hyperframes`** (compo
  HTML/CSS+GSAP, texte net, $0) — **jamais** en AI_IMAGE. Tokens DA : `hyperframes-tokens.css`.
  La règle « un seul accent » s'y applique littéralement : les séries non commentées sont en
  `#8B919B`, la série dont parle la voix est en `#E8A33D`.
- **AI_IMAGE** (concept, narration) : chaîne globale, règle des tiers, sujet à gauche, espace
  négatif à droite.
- **SCREEN_RECORDING** (page réelle filmée, curseur + scroll) : la source qui porte le signal
  humain, et la colonne vertébrale de cette chaîne.
- **AI_VIDEO** : hors scope.

> ⚠️ La chaîne de style dans le bloc code ci-dessus est hashée par la pipeline : la modifier
> invalide le cache d'images de TOUS les projets AnswerDelta (régénération payante).
> Toute modification = entrée CHANGELOG.
