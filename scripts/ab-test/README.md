# A/B test modèle image

Compare `gpt-image-1` vs `gpt-image-1.5` sur 3 scènes représentatives (hero business, mascotte
récurrente, mot court « RED FLAG »). Standalone — ne touche pas au pipeline de prod.

## Lancer (depuis la racine du repo)

Run A (modèle actuel) puis Run B (candidat) — **TEST_PREFIX différent** à chaque fois (sinon
mêmes fichiers / faux A/B) :

```
IMAGE_MODEL=gpt-image-1   IMAGE_QUALITY=medium TEST_PREFIX=ab-a node scripts/ab-test/run-ab-test.mjs
IMAGE_MODEL=gpt-image-1.5 IMAGE_QUALITY=medium TEST_PREFIX=ab-b node scripts/ab-test/run-ab-test.mjs
```

Sortie : `tmp/ab-tests/ab-a/` et `tmp/ab-tests/ab-b/` (PNG + `results.json`). `tmp/` est gitignoré.

## Ensuite

1. Ouvre les PNG des 2 runs côte à côte, remplis `scorecard.md`.
2. Vérifie dans `results.json` que `gpt-image-1.5` accepte bien `quality=medium` (sinon l'erreur
   API y est loggée → noter le palier valide dans `MODEL_NOTES.md`).
3. Refais **seulement la meilleure scène** en `IMAGE_QUALITY=high` pour confirmer le palier et le
   surcoût réel avant de toucher `rates.ts`.
4. Si 1.5 gagne nettement sur texte + fidélité sans surprise : passe le défaut en
   `IMAGE_MODEL=gpt-image-1.5` (`.env`), MAJ `rates.ts` + CHANGELOG. Sinon, on reste en l'état.

Détails : voir `MODEL_NOTES.md` à la racine.
