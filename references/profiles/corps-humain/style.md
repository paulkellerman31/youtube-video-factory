# Style — chaîne Corps Humain

**Famille esthétique de la chaîne** (pas un look rigide) : cartoon éducatif 2D plat, façon
TED-Ed — illustration vectorielle aux contours nets, formes simples et joyeuses, personnages
stylisés (organes, cellules à petite tête sympathique), aplats et dégradés doux, lumière
chaude. Ludique, lisible, vulgarisation grand public. Pas de photoréalisme, pas de 3D, pas de
gore.

**Palette de marque :** aqua/teal `#2EC4B6` (eau, santé) + corail chaud `#FF6B6B` (alerte,
chaleur), sur fond crème doux `#FFF4E0`. Touches de bleu eau `#2EC4D6`. Couleurs vives mais
douces, jamais criardes.

**Adaptatif par vidéo :** le skill compose chaque prompt d'image à partir du SUJET de la
vidéo (cœur, neurone, goutte d'eau, reins…), puis ancre la cohérence avec la chaîne via la
chaîne de style globale ci-dessous, injectée telle quelle par la pipeline dans chaque prompt.
Cohérence interne d'une vidéo > variété — palette et trait constants du début à la fin.

**Sujets factuels (chiffres, anatomie, comparaisons) :** GRAPHIC ludique — pictos, icônes,
barres simples — plutôt que des métaphores obscures. La métaphore mignonne reste permise pour
hook/transition/émotion.

## Global style string (append verbatim to every image prompt)
```
<BRAND COLORS: teal + coral on soft cream>, flat 2D vector illustration, TED-Ed style
educational cartoon, clean bold outlines, simple cheerful shapes, smooth flat colors, soft
gradients, playful and friendly, warm even lighting, 16:9
```

## Casting récurrent — la cohérence "storyboard"
gpt-image-1 n'a AUCUNE mémoire entre images : sans contrainte, chaque plan invente un
personnage différent (l'effet "banque d'images"). Pour qu'une vidéo ressemble à un épisode et
non à 14 dessins sans lien, on définit un CASTING au début de la vidéo et on le décrit
**mot pour mot à l'identique** dans chaque prompt où il apparaît.
- Chaque vidéo déclare ses 1-3 personnages récurrents (ex. ici : la mascotte goutte d'eau, le
  perso humain) avec une description physique figée (couleur, yeux, bouche, accessoire).
- Cette description est recopiée **verbatim** scène après scène — on ne paraphrase jamais.
- Les organes-personnages (cœur, cerveau, reins, cellules) gardent aussi un look fixe sur toute
  la vidéo.
- Limite connue : cohérence ~80 %, pas parfaite (pas de seed ni d'image de référence dans le
  pipeline v1 — vrai fix = image-to-image, en ROADMAP). La description figée fait l'essentiel.

## Rules
- **16:9 always**. Never crop in post.
- **Palette :** teal `#2EC4B6` + corail `#FF6B6B` sur crème `#FFF4E0`. Pas de noir profond, pas
  de rendu clinique sombre — la chaîne est lumineuse et accueillante.
- **Style cartoon 2D plat uniquement** — contours nets, aplats, formes simples. Pas de
  photoréalisme, pas de 3D, pas de rendu sombre/dramatique.
- **Personnages stylisés OK** (organes, cellules, petit personnage humain mignon). Pas de
  visage réaliste reconnaissable — visages cartoon simples seulement.
- **Casting figé** (voir section ci-dessus) : personnages récurrents décrits verbatim à chaque
  scène.
- **Pas de gore** — même une scène « danger » reste douce, lisible, non choquante.
- **ZÉRO texte dans les images IA — règle dure.** gpt-image-1 ne sait pas écrire. Chaque prompt
  **AI_IMAGE** se termine par le négatif canonique, mot pour mot :
  `no text, no words, no letters, no numbers, no labels, no logos, no readable seals or stamps`
  Objets pièges : horloge→sablier sans chiffres, calendrier→pages vierges, étiquette→forme
  vierge, écran→lueur unie.
  ⚠️ Le négatif vit dans CHAQUE prompt AI_IMAGE écrit par le skill — PAS dans la chaîne de
  style globale (elle est hashée et s'applique aussi aux GRAPHIC, qui ont droit à 2-4 labels).
- **Une scène qui DOIT montrer des mots/chiffres/un écran/un document ne passe JAMAIS en
  AI_IMAGE.** Routage décidé au PLAN : `screen_capture`, `manual_asset`, GRAPHIC (2-4 labels),
  ou image + **text overlay** à l'assemblage.
- **STRIP ≠ ROUTE.** Texte décoratif → on l'enlève. Texte porteur de sens (un %, une durée,
  une échelle) → on le ROUTE (overlay / GRAPHIC / capture), on ne vide pas la scène.

## By scene type
- **GRAPHIC** (data / chiffres / comparaison) : infographie cartoon plate, fond crème, pictos
  et icônes simples, chiffres surdimensionnés, palette de marque, 2-4 labels courts lisibles.
- **AI_IMAGE** (concept / narration) : global string, composition centrée ou règle des tiers,
  espace pour overlay si prévu.
- **AI_VIDEO** : hors scope v1.

## Qualité de rendu
- gpt-image-1 en `quality: high` pour cette chaîne (cartoon net, aplats propres). Réglé via la
  variable `IMAGE_QUALITY=high` (dans le launcher du projet, sinon défaut `medium`). Coût ~3-4×
  le medium — acceptable au vu du gain de netteté.

> ⚠️ La chaîne de style dans le bloc code ci-dessus est hashée par la pipeline : la modifier
> invalide le cache d'images de TOUS les projets de la chaîne (régénération payante).
> Toute modification = entrée CHANGELOG.
