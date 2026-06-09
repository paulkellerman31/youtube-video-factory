# Style — chaîne Corps Humain

**Famille esthétique de la chaîne** (pas un look rigide) : médical 3D épuré — rendus
anatomiques photoréalistes sur fond sombre, lumière clinique douce en rim light, palette
cyan `#19D3DA` + rouge sang `#E03131` sur noir profond. Profondeur de champ, particules
fines en suspension, micro-détails de tissu (veines, fibres, membranes). Propre, contrasté,
science premium — pas de gore, pas de planche scolaire plate.

**Adaptatif par vidéo :** le skill compose chaque prompt d'image à partir du SUJET de la
vidéo (cœur, neurone, bactérie, os…), puis ancre la cohérence avec la chaîne via la chaîne de
style globale ci-dessous, injectée telle quelle par la pipeline dans chaque prompt. Cohérence
interne d'une vidéo > variété — pas de rupture de palette en cours de vidéo.

**Sujets factuels (chiffres, anatomie nommée, données) : visuels LITTÉRAUX d'abord.**
Coupes 3D, schémas anatomiques, comparatifs d'échelle, GRAPHIC — plutôt que des métaphores
abstraites. La métaphore reste permise pour hook/transition/émotion, jamais pour expliquer un
mécanisme biologique.

## Global style string (append verbatim to every image prompt)
```
<BRAND COLORS: cyan + blood red on deep black>, clean medical 3D render, anatomical,
soft clinical rim lighting, shallow depth of field, fine floating particles, high detail,
photorealistic, 8k, 16:9
```

## Rules
- **16:9 always**. Never crop in post.
- **Palette :** cyan `#19D3DA` + rouge sang `#E03131` sur noir. Pas de vert clinique fade,
  pas de fond blanc d'hôpital plat.
- **Pas de gore gratuit** — réalisme anatomique clean, jamais choquant/sanglant à outrance.
  L'objet (organe, cellule) est le héros, surdimensionné pour la lisibilité mobile.
- **Pas de visages reconnaissables** en gros plan — corps anonyme, silhouettes, mains, coupes,
  organes, structures microscopiques.
- **ZÉRO texte dans les images IA — règle dure.** gpt-image-1 ne sait pas écrire. Chaque prompt
  **AI_IMAGE** se termine par le négatif canonique, mot pour mot :
  `no text, no words, no letters, no numbers, no labels, no logos, no readable seals or stamps`
  Objets pièges à neutraliser dans le prompt : étiquette d'échantillon→fiole vierge,
  écran de monitoring→lueurs abstraites, schéma légendé→formes sans labels, règle graduée→
  barre lisse.
  ⚠️ Le négatif vit dans CHAQUE prompt AI_IMAGE écrit par le skill — PAS dans la chaîne de
  style globale (elle est hashée et s'applique aussi aux GRAPHIC, qui ont droit à 2-4 labels).
- **Une scène qui DOIT montrer des mots/chiffres/un écran/un document ne passe JAMAIS en
  AI_IMAGE.** Routage obligatoire, décidé au PLAN (jamais après rendu) : `screen_capture`
  (page réelle), `manual_asset` (fourni par l'humain), GRAPHIC (infographie, 2-4 labels), ou
  image abstraite + **text overlay** à l'assemblage.
- **STRIP ≠ ROUTE — la nuance qui décide.** Avant d'enlever le texte d'un prompt, demande :
  décoratif ou porteur de sens ?
  - **Décoratif** (étiquette de fond floue, sceau bidon) → on l'enlève, l'image garde son sens. ✅
  - **Porteur de sens** (un dosage, une fréquence cardiaque, un % de population, une échelle
    de taille) → **NE PAS vider.** ROUTE-la : overlay avec les vrais chiffres, GRAPHIC, ou
    capture. Vider une scène à texte porteur = la tuer.

## By scene type
- **GRAPHIC** (data / chiffres / comparaison / mécanisme) : infographie clean, fond noir/navy,
  texte large lisible, chiffres surdimensionnés, palette de marque. Préféré dès qu'on explique
  un système (circulation, digestion, immunité…).
- **AI_IMAGE** (concept / narration) : global string, règle des tiers, sujet à gauche, espace
  négatif à droite.
- **AI_VIDEO** : hors scope v1.

> ⚠️ La chaîne de style dans le bloc code ci-dessus est hashée par la pipeline : la modifier
> invalide le cache d'images de TOUS les projets de la chaîne (régénération payante).
> Toute modification = entrée CHANGELOG.
