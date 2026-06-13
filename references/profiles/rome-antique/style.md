# Style — chaîne Rome Antique (STUB — à remplir avant la première vidéo)

**Famille esthétique** (exemple de départ, à affiner) : cinématographique d'époque — marbre,
bronze, fresques ; tons chauds (or, ocre, terre cuite) contre des ombres profondes ; lumière
de torches et de soleil rasant ; poussière et grain léger type péplum ; échelle monumentale
(forums, colonnades, légions au loin). Pas de visages reconnaissables en gros plan.

**Adaptatif par vidéo :** même principe que tout profil — le sujet de chaque image vient de la
vidéo (bataille, complot, économie, vie quotidienne), l'ancrage de cohérence vient de la chaîne
de style ci-dessous. Sujets factuels/historiques : privilégier cartes, frises chronologiques et
schémas (GRAPHIC) plutôt que des métaphores.

## Global style string (append verbatim to every image prompt)
```
<BRAND COLORS: warm gold + deep shadow>, epic period cinematography, ancient Rome setting,
marble and bronze textures, torch-lit warm tones, volumetric dust, photorealistic, 8k, 16:9
```

## Rules
- 16:9 always.
- Pas de visages identifiables — silhouettes, foules, mains, objets, architecture.
- Palette : or chaud / ocre / ombres profondes. Pas de néon, pas de moderne dans le cadre.
- GRAPHIC : cartes parchemin, frises, schémas de bataille — texte large et lisible.

## À VERROUILLER avant production
- HEX exacts de la marque.
- Voix ElevenLabs (voir voice-config.json — placeholder).
- Slots miniature (thumbnail-playbook.md §8).

## Règle texte (héritée — vaut pour toutes les chaînes) — méthode INVERSÉE (data 2026)
gpt-image-1 ne sait pas écrire ET **ignore les négations** : « no text / no logo » attire le mot.
On n'écrit **JAMAIS** `text, word, letter, label, logo, sign` dans un prompt. On décrit les surfaces
en **positif** : « plain blank surfaces, unmarked parchment, smooth featureless stone ». Picto sans
lettrage → « emblem / symbol », jamais « logo ».
Mots/chiffres/documents porteurs de sens → screen_capture, manual_asset, GRAPHIC (cartes, frises) ou overlay.
