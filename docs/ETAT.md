# ÉTAT — YouTube Video Factory

_Dernière mise à jour : 2026-08-07_

Se lit en 30 secondes. Pour l'historique des décisions : `../CHANGELOG.md`.
Pour les pièges déjà payés : `LECONS.md`.

## En un coup d'œil

Outil opérationnel. Pipeline Node + FFmpeg, rendu 100 % local, idempotent
(re-rendre un projet déjà fait coûte 0 $). Sous git, auto-push GitHub actif.

**4 chaînes configurées** dans `references/profiles/` :

| Chaîne | État | Projets |
|---|---|---|
| `ofm` | production | 12 |
| `answerdelta` | profil complet créé le 2026-08-06 | 0 |
| `corps-humain` | démo de répétabilité | 1 |
| `rome-antique` | stub jamais rempli | 0 |

**Chiffres chaîne OFM** (API YouTube, relevé 2026-08-01, 90 jours) : 22 vidéos
publiées, 1 236 vues, **56 vues par vidéo**, durée vue moyenne **85 s**,
31,7 % regardé, 22 abonnés.

## Le format en vigueur

**S — SHORT TOOL BRIEF** : 2 min 30, 350-400 mots, 13-15 scènes, six blocs
(hook · l'outil en une phrase · les 3 choses qui comptent · le prix · la
limite · CTA). Prix et limite avant la 85ᵉ seconde, parce que c'est là que le
spectateur moyen part.

Mix éditorial cible : **2 LARGE pour 1 REVIEW** (l'inverse de l'historique).
Une review se juge sur ses clics `/go/` ÷ vues, jamais sur ses vues.

Verrous visuels : **zéro `ai_image` dans le corps**, toute scène capture en
`motion: "static"`, `crf 16` / preset `medium`. Voix « Theo 2 » (`eleven_v3`),
débit imprimé à chaque génération.

## Backlog

Projets écrits sans `final.mp4` :

- `ofm/2026-08-07_searchatlas-llm-visibility` — écrit au format S, prêt à rendre.
- `ofm/` : `anti-detect-browsers`, `beacons-shadowban`, `inro-comment-to-dm`,
  `onlyspoofer-phash`, `onlytraffic-roi` — **écrits en juin au format long
  périmé** (79 à 97 % d'`ai_image`). À réécrire au format S ou à abandonner,
  pas à rendre tels quels.

## Points ouverts

1. **`searchatlas-llm-visibility` porte `channel: "ofm"`** alors que SearchAtlas
   est un outil GEO/AEO et que la chaîne `answerdelta`, créée pour ça la veille,
   n'a aucun projet. À trancher avant de rendre.
2. **Aucune mesure de clic par outil** (`/go/<tool>`). Sans elle on ne sait pas
   quelle vidéo rapporte — et la condition n°1 de réactivation des captures
   authentifiées est invérifiable. C'est le point bloquant le plus coûteux.
3. **`references/profiles/ofm/channel-mark.png` absent** → `WARN` à chaque rendu
   de miniature.
4. **La règle « gpt-image ne sait pas écrire » n'a jamais été retestée sur
   `gpt-image-1.5`**, qui est le défaut actuel et que l'A/B du 2026-06-13 décrit
   comme meilleur en texte. Possible contrainte qu'on s'impose pour rien.
5. `rome-antique` : profil stub, jamais rempli.
6. `_POUBELLE-2026-08-06/` (107 Mo) à supprimer à la main.

## Rituel

**Ouvrir** : ce fichier → dernières entrées de `../CHANGELOG.md` → `LECONS.md`
avant de toucher au code.
**Fermer** : entrée datée en haut du CHANGELOG, mise à jour d'ETAT, piège
rencontré → LECONS.
