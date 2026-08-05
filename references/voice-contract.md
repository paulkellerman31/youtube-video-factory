# Contrat voix — ElevenLabs, réglages et écriture (2026-08-01)

Ce fichier est la source de vérité pour tout ce qui touche à la voix : réglages du modèle,
manière d'écrire le script pour qu'il sonne humain, et pièges propres à une pipeline automatisée.
Les valeurs opérationnelles vivent dans `profiles/<channel>/voice-config.json` ; ce document dit
**pourquoi** elles sont là.

---

## 1. Réglages — profil OFM

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| Voix | clone Pro « Theo 2 » | voix propre, enregistrée par Théo |
| `modelId` | `eleven_v3` | expressivité et gestion des pauses supérieures à `eleven_multilingual_v2` |
| `stability` | **0,40** | bas = variation, donc humain. Au-dessus de 0,5 le ton devient constant, et un ton constant est le premier signal « machine » |
| `similarityBoost` | **0,65** | moyen. Au-dessus de 0,85 la voix se rigidifie et amplifie les artefacts de l'enregistrement source |
| `style` | **0,05** | très bas = conversationnel. Au-dessus de 0,20 la lecture devient théâtrale, ce qui sur une review lit comme de la publicité |
| `useSpeakerBoost` | `true` | clarté, sans coût sur le naturel |
| `maxCharsPerRequest` | **800** | voir §2 |

**Les trois erreurs à ne pas refaire :** `stability` > 0,70 · `similarityBoost` > 0,85 ·
`style` > 0,20. Chacune éloigne du naturel dans la direction opposée à ce qu'on croit corriger.

---

## 2. Découpage — le levier que les réglages ne remplacent pas

Sur une longue génération, le ton **dérive** : les premières phrases sont posées, les dernières
s'aplatissent. Aucun réglage ne corrige ça — c'est une propriété de la génération, pas de la voix.
La parade est de découper en segments de 600 à 800 caractères.

**C'est automatique depuis le 2026-08-01** (`scripts/generate-audio.ts`). Deux règles y sont
codées, et elles ne sont pas cosmétiques :

- **On ne coupe que sur une frontière de paragraphe.** Dans cette pipeline un paragraphe = une
  scène, donc la coupure tombe sur un silence naturel : aucune couture audible. Un paragraphe
  seul plus long que la limite est recoupé sur une fin de phrase, jamais au milieu.
- **L'alignement de chaque segment est décalé de la durée MESURÉE des segments précédents**, pas
  de la fin du dernier caractère. Un segment se termine par du silence ; prendre la fin du texte
  décalerait tous les sous-titres un peu plus tôt à chaque segment, et l'erreur s'accumulerait.

Effet de bord bienvenu : le dernier paragraphe (le CTA) est presque toujours généré seul, donc
avec un ton neuf, non dérivé. C'est exactement la phrase qui doit sonner juste.

### ⚠️ Le découpage crée une SECONDE dérive — d'identité, pas de ton (corrigé le 2026-08-05)

Défaut signalé au visionnage : *« à 1:42 la voix change et prend un accent différent »*, à une
frontière de segment. Cause exacte : chaque requête partait **sans dire au modèle ce qui la
précédait**. À chaque nouveau segment, le modèle ré-infère l'identité du locuteur à partir du seul
texte reçu — et comme la stabilité est volontairement basse (0,40, pour obtenir de la variation
humaine), il peut atterrir sur un accent différent. **Le découpage a résolu la dérive de TON et
introduit une dérive d'IDENTITÉ.**

Remède documenté par ElevenLabs, désormais appliqué à chaque segment :

- **`previous_text` / `next_text`** — le texte voisin, *« can be used to improve the speech's
  continuity when concatenating together multiple generations »*.
- **`previous_request_ids`** — les identifiants des générations précédentes, décrits comme
  *« especially useful … when splitting up a large task into multiple requests »*. Récupérés dans
  l'en-tête `request-id` de la réponse, les trois derniers sont renvoyés à chaque appel.

**Leçon générale, valable au-delà de la voix : découper une tâche continue crée toujours un
problème de raccord.** On a d'abord corrigé le raccord temporel (décalage des alignements), et il
restait le raccord d'identité. Quand on scinde une génération, la question à se poser n'est pas
seulement « les morceaux se recollent-ils » mais « chaque morceau sait-il de quoi les autres
parlent ».

---

## 3. Écrire pour être lu — pas pour être lu à voix haute par un robot

- **Phrases courtes, moins de quinze mots.** Déjà dans `script-director.md` ; la vraie raison est
  ici : une phrase longue force le modèle à gérer une intonation sur une distance où il dérive.
- **Contractions systématiques** : « it's », « you'll », « that's ». Une voix qui n'en fait jamais
  lit un document ; une voix qui en fait parle.
- **La ponctuation est le seul contrôle de rythme dont on dispose.** Virgule = respiration.
  Point = fin de pensée. Points de suspension = hésitation, à utiliser avec parcimonie. Tiret =
  changement de direction.
- **Chiffres toujours en toutes lettres** (« ninety-nine », pas « 99 ») — règle existante, et
  elle sert ici doublement : le modèle prononce mal les nombres écrits en chiffres.

### ⚠️ Balises audio — piège de version

`eleven_v3` accepte des balises inline (`[pause]`, `[sighs]`, `[laughs]`, `[whispers]`).
**Elles sont spécifiques à v3.** Sur `eleven_multilingual_v2`, elles ne sont pas interprétées :
elles sont **lues à voix haute**. Comme le code bascule automatiquement sur v2 si v3 est refusé
par `/with-timestamps` (§4), une balise oubliée dans un script se retrouverait prononcée dans la
vidéo finale.

**Règle : aucune balise audio dans `voiceover.txt` tant que le repli v2 existe.** Le rythme se
fait à la ponctuation, qui fonctionne sur les deux modèles.

---

## 4. Risque technique — `/with-timestamps` et le modèle

La pipeline appelle `text-to-speech/{voice}/with-timestamps`, pas l'endpoint simple, parce que
l'alignement caractère par caractère qu'il renvoie **est** ce qui fabrique `subs.srt` (les
sous-titres YouTube) — sans lui, il faudrait un Whisper et un coût de plus.

La documentation ElevenLabs ne garantit pas que tous les modèles exposent cet alignement. Si
`eleven_v3` est refusé, `generate-audio.ts` bascule **une fois** sur `eleven_multilingual_v2` et
le signale en `WARN`. La vidéo se rend, mais **la voix n'est pas celle qui a été choisie** — ce
n'est pas une dégradation à ignorer, c'est un `WARN` à traiter.

---

## 5. Ce qui ne transfère PAS depuis le mode d'emploi de l'interface web

Le conseil « génère deux ou trois fois le même texte, compare, garde la meilleure » est juste —
et il suppose une oreille humaine dans la boucle. **La pipeline génère une fois.** Elle ne peut
pas juger laquelle des trois versions sonne le mieux, et générer trois fois pour en jeter deux
triplerait le coût sans critère de choix.

Deux façons de récupérer ce levier, au choix :

- **Écouter `assets/audio/voice.mp3` avant le rendu final.** S'il ne va pas, supprimer le fichier
  et relancer : l'empreinte est inchangée mais le fichier manque, donc la voix est resynthétisée,
  et ElevenLabs varie légèrement à chaque appel. Coût : une génération.
- **Accepter la première prise.** C'est le défaut, et c'est défendable : le découpage en segments
  a déjà supprimé la principale cause d'une mauvaise prise.

---

## 6. Le débit est une constante d'instrument

`script-director.md` dimensionne les scènes à partir du débit en mots par minute. Ce nombre
**dépend de la voix et de ses réglages** : la voix précédente tournait à 206 mots/minute quand le
preset en supposait 150, et toutes les fenêtres de scène s'en trouvaient rééchelonnées d'un
facteur 0,73 en silence.

`generate-audio.ts` **imprime désormais le débit mesuré** à chaque génération :

```
audio: done — 117.9s · 406 mots · DÉBIT MESURÉ 207 mots/minute
```

**À chaque changement de voix ou de réglage : relever cette ligne et reporter la valeur dans
`script-director.md` §SCRIPT STRUCTURE.** Elle se relève, elle ne se suppose pas.

---

## 7. Coût — pourquoi le débat « Turbo pour économiser » ne s'applique pas ici

Chiffre de référence : **un script format S ≈ 2 290 caractères** (BotPenguin, 406 mots, 1 min 58).
Les modèles qualité (`eleven_v3`, `eleven_multilingual_v2`) coûtent 1 crédit par caractère ; les
modèles latence (`turbo_v2_5`, `flash_v2_5`) 0,5.

| Plan | Prix/mois | Crédits | Vidéos/mois en v3 | en Turbo |
|---|---|---|---|---|
| Free | 0 $ | 10 000 | 4 | 9 |
| Starter | 6 $ | 30 000 | 13 | 26 |
| **Creator** | **22 $** | **121 000** | **53** | 106 |
| Pro | 99 $ | 600 000 | 262 | 524 |
| Scale | 299 $ | 1 800 000 | 786 | 1 572 |

**Le plan Creator à 22 $ couvre 53 vidéos par mois en pleine qualité v3.** À une cadence réaliste
de huit vidéos par mois, passer en Turbo économise 9 160 crédits sur 121 000 — soit **environ
1,70 $ par mois**. C'est le prix qu'on paierait pour dégrader la voix qu'on vient de cloner.

**Règle : le modèle se choisit sur la qualité, jamais sur le coût, tant qu'on est sous ~250
vidéos par mois.** En dessous de ce seuil le coût de la voix n'est pas une variable de décision —
il est déjà négligeable devant le temps de production. Ce n'est qu'au-delà que la question se
repose.

**L'option « hybride v3 pour le hook, Turbo pour le corps » est à écarter.** Deux modèles sur une
même voix produisent deux timbres, et la couture tombe au milieu de la vidéo. Le pipeline
n'utilise qu'un modèle par projet, et c'est volontaire : la continuité de timbre est exactement ce
qui fait qu'une voix passe pour une personne.

*Note : les modèles latence normalisent moins bien les nombres écrits en chiffres — sans effet
ici, puisque le preset impose déjà les nombres en toutes lettres. Ce n'est donc PAS l'argument
contre Turbo ; l'argument est l'expressivité.*
