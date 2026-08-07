# ÉTAT — YouTube Video Factory

_Dernière mise à jour : 2026-08-07 (soir)_

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

⚠️ **Le débit n'est plus une constante utilisable pour le minutage.** Quatre
valeurs en trois mois (150 → 206,6 → 165 → **151** au 2026-08-07), la dernière
sans aucun changement de `voice-config.json`. Il sert à VISER un nombre de mots
à l'écriture ; les fenêtres de scène se recalculent après l'étape audio sur
`assets/audio/timestamps.json`. Voir `LECONS.md` §Voix.

## Backlog

Projets écrits sans `final.mp4` :

- `ofm/2026-08-07_searchatlas-llm-visibility` — format S, 394 mots, 156,6 s,
  14 scènes, **100 % `screen_recording`, zéro `ai_image`**. Audio et 7 scènes sur
  14 déjà enregistrés. Fenêtres recalées sur l'audio réel le 2026-08-07 ; s08 et
  s09 sorties de `/otto-seo/` (Cloudflare). **Reste à relancer pour finir.**
- `ofm/` : `anti-detect-browsers`, `beacons-shadowban`, `inro-comment-to-dm`,
  `onlyspoofer-phash`, `onlytraffic-roi` — **écrits en juin au format long
  périmé** (79 à 97 % d'`ai_image`). À réécrire au format S ou à abandonner,
  pas à rendre tels quels.

## Points ouverts

1. **`searchatlas-llm-visibility` porte `channel: "ofm"`** alors que SearchAtlas
   est un outil GEO/AEO et que la chaîne `answerdelta`, créée pour ça la veille,
   n'a aucun projet. **Toujours ouvert, et devenu plus coûteux** : l'audio et la
   moitié des enregistrements sont faits sous le profil `ofm`. Basculer sur
   `answerdelta` maintenant, c'est refaire la voix (~0,20 $) et changer l'accent
   de miniature de `#00C8FF` à `#E8A33D`. Théo a dit vouloir démarrer sur Delta —
   à confirmer AVANT de relancer le rendu.
2. **Le `voice-config.example.json` d'`answerdelta` annonce 165 mots/minute**,
   hérité d'OFM par copie. La mesure du 2026-08-07 donne 151 sur la même voix.
   Le chiffre est faux dans le profil ; il ne se corrige pas, il se **re-mesure**
   au premier rendu AnswerDelta.
3. **Aucune mesure de clic par outil** (`/go/<tool>`). Sans elle on ne sait pas
   quelle vidéo rapporte — et la condition n°1 de réactivation des captures
   authentifiées est invérifiable. C'est le point bloquant le plus coûteux.
4. **`references/profiles/ofm/channel-mark.png` absent** → `WARN` à chaque rendu
   de miniature.
5. **La règle « gpt-image ne sait pas écrire » n'a jamais été retestée sur
   `gpt-image-1.5`**, qui est le défaut actuel et que l'A/B du 2026-06-13 décrit
   comme meilleur en texte. Possible contrainte qu'on s'impose pour rien.
5. `rome-antique` : profil stub, jamais rempli.
6. `_POUBELLE-2026-08-06/` (107 Mo) à supprimer à la main.

## Rituel

**Ouvrir** : ce fichier → dernières entrées de `../CHANGELOG.md` → `LECONS.md`
avant de toucher au code.
**Fermer** : entrée datée en haut du CHANGELOG, mise à jour d'ETAT, piège
rencontré → LECONS.
