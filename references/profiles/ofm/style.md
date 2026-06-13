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
- **ZERO texte dans les images IA — règle dure.** gpt-image-1 ne sait pas écrire (limite du
  modèle : 'ANOURT', 'RANDM SUPERHERO'). Chaque prompt **AI_IMAGE** se termine par le négatif
  canonique, mot pour mot :
  `no text, no words, no letters, no numbers, no labels, no logos, no readable seals or stamps`
  Objets pièges à neutraliser dans le prompt lui-même : facture→papiers vierges, document à
  sceau→dossier uni, carte bancaire→carte vierge, calendrier→panneaux vides, écran→lueurs
  abstraites, étiquette de prix→étiquette vierge.
  ⚠️ Le négatif vit dans CHAQUE prompt AI_IMAGE écrit par le skill — PAS dans la chaîne de
  style globale : la globale est hashée (la modifier régénère tout) et elle s'applique aussi
  aux GRAPHIC, qui ont le droit à leurs 2-4 labels courts.
- **Une scène qui DOIT montrer des mots/chiffres/un document/un écran ne passe JAMAIS en
  AI_IMAGE.** Routage obligatoire, décidé au PLAN (jamais après rendu) : `screen_capture`
  (page réelle), `manual_asset` (fourni par l'humain), GRAPHIC (infographie, 2-4 labels), ou
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

## By scene type
- **GRAPHIC** (data / numbers / comparison / mécanique technique): rendu via **`hyperframes`**
  (compo HTML/CSS+GSAP animée, texte NET, $0) — PAS en AI_IMAGE (gpt-image-1 ne sait pas écrire,
  un GRAPHIC IA sort avec du texte cassé). Préféré dès qu'on explique un système. Voir le preset
  `references/hyperframes/` (contrat + template). Routage décidé au PLAN comme les autres sources.
- **AI_IMAGE** (concept / narration): global string, rule-of-thirds, subject left, negative space right.
- **AI_VIDEO**: hors scope v1 (Kling/FAL désactivé).

> ⚠️ La chaîne de style dans le bloc code ci-dessus est hashée par la pipeline : la modifier
> invalide le cache d'images de TOUS les projets de la chaîne (régénération payante).
> Toute modification = entrée CHANGELOG.
