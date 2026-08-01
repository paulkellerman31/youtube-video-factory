# Style — chaîne OFM

**Famille esthétique de la chaîne** (pas un look rigide) : dark luxury tech, lumière
cinématique en rim light, palette bleu `#00C8FF` + blanc, silhouettes sans visage,
objets héros surdimensionnés, photoréalisme 8k. Le grain : propre, contrasté, premium.

**Adaptatif par vidéo :** le skill compose chaque prompt d'image à partir du SUJET de la
vidéo (les scènes racontent CETTE vidéo), puis ancre la cohérence avec la chaîne via la
chaîne de style globale ci-dessous, injectée telle quelle par la pipeline dans chaque prompt.
Cohérence interne d'une vidéo > variété — pas de rupture de palette en cours de vidéo.

**Sujets techniques (outils, infra, chiffres) : visuels LITTÉRAUX d'abord.** Dashboards,
schémas réseau, comparatifs, interfaces stylisées — plutôt que des métaphores abstraites.
La métaphore reste permise pour hook/transition/émotion, jamais pour expliquer une mécanique.

## Global style string (append verbatim to every image prompt)
```
<BRAND COLORS: blue + white>, cinematic rim lighting, dark luxury tech setting,
silhouette only, no visible face, high contrast, photorealistic, 8k, 16:9
```

## Rules
- **16:9 always**. Never crop in post.
- **No visible faces** — silhouettes, hands, or objects only.
- **Palette:** blue `#00C8FF` + white. No green / "Matrix" look.
- **Human touch:** when a hand appears, specify "visible skin texture" (avoid the CGI look).
- **ZÉRO texte parasite — méthode INVERSÉE (data 2026).** gpt-image-1 ne sait pas écrire ET
  **ignore les négations** : écrire « no text / no logo » ATTIRE le mot et fait APPARAÎTRE
  l'artefact. Donc on n'écrit **JAMAIS** les mots `text, word, letter, label, logo, sign,
  billboard, screen text` dans un prompt. À la place :
  - décrire les surfaces en **positif** : « plain blank surfaces, unmarked walls, empty clean
    screens, smooth featureless background, abstract glowing panels ».
  - pictogramme sans lettrage → « icon / emblem / symbol », jamais « logo ».
  - objets pièges décrits vides : facture→papiers vierges, écran→lueurs abstraites,
    étiquette→forme unie, calendrier→panneaux nus.
  ⚠️ Consigne écrite par le skill dans CHAQUE prompt AI_IMAGE — pas dans la chaîne globale
  (hashée). Texte porteur de sens → routé (overlay / GRAPHIC-hyperframes / capture), jamais en image IA.
- **Une scène qui DOIT montrer des mots/chiffres/un document/un écran ne passe JAMAIS en
  AI_IMAGE.** Routage obligatoire, décidé au PLAN (jamais après rendu) : `screen_capture`
  (page réelle figée), `screen_recording` (page réelle filmée), `manual_asset` (fourni par
  l'humain, `.png` ou `.mp4`), GRAPHIC-hyperframes (infographie, 2-4 labels), ou
  image abstraite + **text overlay** à l'assemblage (le système "ONE FLAG / TEN ACCOUNTS" —
  propre par design).
- **STRIP ≠ ROUTE — la nuance qui décide.** Avant d'enlever le texte d'un prompt, demande :
  le texte est-il décoratif ou porteur de sens ?
  - **Décoratif / incident** (fausse facture qui brûle, sceau bidon, logo de fond) → on
    l'enlève (blank), l'image garde tout son sens. ✅
  - **Porteur de sens** (calendrier = les mois ; dashboard = des données ; panneau = un
    chiffre ; horloge = l'heure) → **NE PAS vider.** Une boîte vide à la place d'un calendrier
    ne corrige rien, elle vide la scène. ROUTE-la : overlay avec les vrais mots, GRAPHIC, ou
    capture. Vider une scène à texte porteur = la tuer.
- **Hero object oversized** for mobile readability.

## Part du réel vs part de l'IA (2026-08-01)

Retour terrain : une vidéo entièrement générée est lue comme « déléguée à quelqu'un qui n'y
connaît rien ». Mesure sur les 6 plans OFM (relevé 2026-08-01) : **79 % à 97 % des scènes en
`ai_image`** — de 23/29 (beacons) à 29/30 (inro, onlytraffic). Le correctif n'est pas esthétique,
il est structurel — **du footage réel, avec un curseur qui bouge**.

- Sur une vidéo tool-centric : `ai_image` **≤ 65 % des scènes**, **≥ 10 scènes de footage réel**
  (≥ 90 s cumulées), dont **≥ 3 en `screen_recording`**. Quota, beats obligatoires et contrôle
  arithmétique : `script-director.md` §TOOL FOOTAGE. Contrat de la source filmée :
  `references/screen-recording-contract.md`.
- `ai_image` reste le bon outil pour le hook, le concept, la métaphore, la transition, l'émotion.
  Il n'est plus le bon outil pour montrer un produit.
- Ne pas enchaîner plus de deux scènes filmées d'affilée : trois captures à la suite redeviennent
  un tunnel, juste d'une autre nature. Le mix (réel + IA + hyperframes + motion) reste la règle ;
  le cap ~7 s/plan vaut pour les plans IA, **pas pour les scènes filmées** (6-12 s), qui portent
  leur propre mouvement interne.

## Palette et police — VERROUILLÉES pour la chaîne OFM (2026-08-01)

Source unique pour OFM. Elles ne vivent PAS dans `references/image-prompt-style.md` : ce fichier
est le fallback global et sert aussi `rome-antique` (or/bronze) et `corps-humain` (teal/corail) —
une couleur bannie ici est la couleur principale d'une autre chaîne.

| Rôle | HEX | Usage |
|---|---|---|
| Base | `#05070C` | fonds, noirs profonds |
| Accent | `#00C8FF` | cyan de marque — rim light, seam de miniature, ligne 2 des titres |
| Blanc | `#FFFFFF` | highlights, ligne 1 des titres |
| Alarme | `#FF3B30` | **seule** couleur secondaire admise, ≤ 15 % de la surface, uniquement sur un angle ban / blocage / perte |

**Bannis pour OFM, sans exception : or, vert, violet, orange, magenta.** Chacun apparaît dans les
prompts de miniature des projets existants et chacun casse la série.

**Police de marque : Impact, seule.** Jamais « X ou Y » dans un preset d'identité. Note :
`FONT_CANDIDATES` ne liste que Impact / Arial Bold / DejaVu Sans Bold — sur la machine de rendu
(Windows) il résout Impact.

## Miniature — hors de ce fichier

La direction artistique des miniatures est **verrouillée** dans `thumbnail-playbook.md` (v2) :
squelette unique, décor figé, palette figée, police Impact, sortie par la pipeline. Aucun choix
de miniature ne se prend ici ni par vidéo. Le style de scène ci-dessous ne s'y applique pas.

## By scene type
- **GRAPHIC** (data / numbers / comparison / mécanique technique): rendu via **`hyperframes`**
  (compo HTML/CSS+GSAP animée, texte NET, $0) — PAS en AI_IMAGE (gpt-image-1 ne sait pas écrire,
  un GRAPHIC IA sort avec du texte cassé). Préféré dès qu'on explique un système. Voir le preset
  `references/hyperframes/` (contrat + template). Routage décidé au PLAN comme les autres sources.
- **AI_IMAGE** (concept / narration): global string, rule-of-thirds, subject left, negative space right.
- **SCREEN_RECORDING** (page réelle filmée, curseur + scroll) : la source qui porte le signal
  humain. Contrat : `references/screen-recording-contract.md`.
- **AI_VIDEO**: hors scope v1 (clé FAL requise, désactivée ; banc d'essai = fal.ai / Veo 3.1 vs
  Seedance Fast, **pas Kling** — cf. ROADMAP §3).

> ⚠️ La chaîne de style dans le bloc code ci-dessus est hashée par la pipeline : la modifier
> invalide le cache d'images de TOUS les projets de la chaîne (régénération payante).
> Toute modification = entrée CHANGELOG.
