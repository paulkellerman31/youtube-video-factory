# Scorecard A/B — gpt-image-1 vs gpt-image-1.5

Note 1 à 5 pour chaque scène (regarde les PNG dans `tmp/ab-tests/<prefix>/`).

| Scène | Modèle | Fidélité prompt | Netteté | Texte lisible | Cohérence perso | Esthétique | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| concept_hero | gpt-image-1 |  |  | n/a | n/a |  |  |
| concept_hero | gpt-image-1.5 |  |  | n/a | n/a |  |  |
| character_consistency | gpt-image-1 |  |  | n/a |  |  |  |
| character_consistency | gpt-image-1.5 |  |  | n/a |  |  |  |
| short_text | gpt-image-1 |  |  |  | n/a |  |  |
| short_text | gpt-image-1.5 |  |  |  | n/a |  |  |

(cohérence perso = comparer les 2 images générées de la mascotte ; texte lisible = le mot « RED FLAG » est-il correct ?)

## Coût / latence observés
| Modèle | quality | coût/image réel | latence moy. |
|---|---|---|---|
| gpt-image-1 | medium |  |  |
| gpt-image-1.5 | medium |  |  |
| gpt-image-1.5 | high |  |  |

## Décision
- Gagnant global :
- Défaut prod à changer (`IMAGE_MODEL=gpt-image-1.5`) ?  oui / non
- `quality` valides confirmées pour 1.5 :
- Tarif réel confirmé → MAJ `rates.ts` :
