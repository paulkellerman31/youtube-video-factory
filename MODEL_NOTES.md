# Modèle image — config & A/B

Le modèle de génération d'image est paramétrable par variable d'env, **sans toucher au code** :

```
IMAGE_MODEL=gpt-image-1     # défaut prod (ne rien mettre = ce défaut)
IMAGE_MODEL=gpt-image-1.5   # candidat upgrade (texte/prompt best-in-class, ~même coût)
IMAGE_QUALITY=medium        # low | medium | high
```

Le code (`scripts/generate-images.ts`) lit `process.env.IMAGE_MODEL ?? "gpt-image-1"` et l'envoie
à l'API OpenAI `/v1/images/generations`. Rollback = enlever la variable (ou la remettre à `gpt-image-1`).

## Protocole de test gpt-image-1.5 (avant de changer le défaut)

1. Dans `.env` : `IMAGE_MODEL=gpt-image-1.5`.
2. Lancer **une vidéo de test** (de préférence avec : 1 visuel concept, 1 mascotte/personnage,
   et 1 scène où un mot court devrait apparaître proprement). Prompts en **méthode positive**
   (pas de « no text/no logo » — cf. style.md).
3. Regarder le `pipeline.log` : la ligne `images: generating sXX (gpt-image-1.5, medium)...`
   confirme que le bon modèle tourne.
4. Comparer le `final.mp4` au rendu gpt-image-1 : netteté, fidélité au prompt, lisibilité du texte,
   cohérence personnage.

## ⚠️ Piège idempotence (à connaître pour tester)

Le hash d'image (`scripts/generate-images.ts`) = `[prompt, size, quality]` — **il n'inclut PAS le
modèle**. Donc changer `IMAGE_MODEL` puis relancer une vidéo **déjà rendue** ne régénère rien
(scènes « up to date », sautées). C'est VOULU : on évite de re-payer le backlog le jour du switch.
Pour tester gpt-image-1.5, il faut des **prompts neufs** : une nouvelle vidéo, OU un mini-projet de
test dédié (voir ci-dessous), OU supprimer les `.png` des scènes à retester.

## À vérifier / verrouiller pendant le test

- **Paliers qualité** : confirmer que `low | medium | high` sont acceptés par gpt-image-1.5.
  Si une valeur est rejetée (erreur API), noter ici la valeur valide (ex : `standard`, `auto`).
- **Tarif réel** : relever le coût/image (OpenAI usage) pour `1536x1024` à la qualité utilisée,
  puis **mettre à jour `scripts/lib/rates.ts`** (`gptImage1PerImageUSD`) — sinon l'estimation de
  coût du log sera fausse (le rendu, lui, marche quand même).

## Décision

- Rendu **meilleur** → mettre `IMAGE_MODEL=gpt-image-1.5` comme défaut (`.env`) + MAJ `rates.ts`
  + entrée CHANGELOG (date + version).
- Rendu **égal/pire** → revenir à `gpt-image-1`, rien à logger.

> Note : le tarif/estimation par défaut reste calé sur gpt-image-1 tant que `rates.ts` n'est pas
> mis à jour — ça n'empêche pas le rendu, ça fausse juste le coût affiché.
