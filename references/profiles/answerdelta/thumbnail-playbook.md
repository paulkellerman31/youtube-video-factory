# Thumbnail Playbook — chaîne AnswerDelta · **DA VERROUILLÉE**

> **Identité : `answerdelta/identite.md` §9 fait foi.** Les valeurs ci-dessous en sont la
> transcription pour la pipeline. En cas de divergence, c'est ce fichier qui a tort.
>
> **Une seule règle tient tout le reste : la cohérence prime sur l'optimisation de chaque
> miniature prise isolément.** Une miniature un peu moins bonne mais visiblement de la même série
> bat une miniature un peu meilleure mais orpheline — la reconnaissance se construit sur la
> répétition, pas sur le pic. En cas d'hésitation entre « respecter la DA » et « cette vidéo
> mériterait autre chose » : respecter la DA.
>
> **Corollaire : la DA ne se change pas par vidéo.** Au plus une fois par trimestre, sur données
> CTR, et le changement s'applique alors à **toutes** les vidéos suivantes. Une DA qu'on ajuste
> souvent n'est pas une DA.

---

## 1. La miniature est un livrable de pipeline, jamais une étape Canva

Le plan écrit une entrée `sceneId: "thumbnail"` dans `image-prompts.json`, la pipeline sort
`assets/thumbnail.jpg` (DA incrustée, 1280×720, prête à uploader) et `assets/thumbnail-raw.png`
(sans texte, pour retouche). Aucun montage manuel — c'est la seule façon d'être cohérent sur
cent vidéos.

```json
{
  "sceneId": "thumbnail",
  "quality": "high",
  "prompt": "<§3 — objet héros + le bloc DA figé, recopié à l'identique>",
  "overlay": {
    "lines": ["LIGNE1", "LIGNE2"],
    "accent": "#E8A33D",
    "logo": "assets/logos/<outil>.png"
  }
}
```

- `quality: "high"` **uniquement ici** — c'est l'asset CTR, le seul endroit où le tier haut se
  rentabilise.
- `accent` **doit valoir `#E8A33D`** sur cette chaîne. C'est la seule ligne qui porte l'identité
  couleur : le code a `#00C8FF` en défaut, hérité d'OFM. L'oublier sort une miniature aux
  couleurs de l'autre chaîne, sans erreur ni avertissement.
- `logo` pointe un **vrai PNG** téléchargé depuis le press kit de l'éditeur, chemin relatif au
  dossier du projet. Un logo n'est **jamais** généré par IA (le modèle ne sait pas écrire).
  Fichier absent = pas de logo, le reste est rendu normalement.
- La **marque de chaîne** n'est pas un champ : elle est lue une fois pour toute la chaîne dans
  `references/profiles/answerdelta/channel-mark.png`. Un élément d'identité ne se redécide pas
  par vidéo.

**À déposer une fois :** `channel-mark.png` dans ce dossier — la version carrée du logo, fond
transparent, hauteur utile ≥ 72 px. Tant qu'il manque, la DA tourne sans son élément de
reconnaissance le plus fort, avec un `WARN` au log.

---

## 2. Le squelette — commun à toutes les chaînes, en dur dans le code

Le squelette (canvas 1280×720, seam à x=576, scrim, titre aligné à gauche sur x=632, auto-fit,
slots marque et logo, zone morte sous y=576) vit dans `THUMBNAIL_DA` de `scripts/lib/ffmpeg.ts`,
**volontairement non configurable**. Le rendre paramétrable par vidéo rouvrirait exactement la
porte que ce playbook ferme.

Le détail des coordonnées, la démonstration de chaque choix et la composition ffmpeg sont
documentés une seule fois, dans `references/profiles/ofm/thumbnail-playbook.md` §1–§2. Ce n'est
pas un renvoi à « la doc d'une autre chaîne » : c'est le même squelette, décrit à l'endroit où il
a été établi. Ne pas le recopier ici — deux copies divergent toujours.

**Ce qui est propre à AnswerDelta, et rien d'autre :**

| Variable | Valeur AnswerDelta |
|---|---|
| Accent (seam + ligne 2 du titre) | `#E8A33D` |
| Marque de chaîne | `references/profiles/answerdelta/channel-mark.png` |
| Famille d'objet héros | §3 ci-dessous |
| Écriture des deux lignes | §4 ci-dessous |

**Un écart connu, sans conséquence visible.** Le scrim du squelette est codé en `#05070C` (l'encre
d'OFM) alors que l'encre AnswerDelta est `#111111`. Il n'y a rien à corriger : le scrim est un
dégradé appliqué à 92 % d'opacité par-dessus une photographie, et l'écart entre deux quasi-noirs
y est invisible. C'est noté ici pour que personne ne « répare » un jour une constante partagée en
croyant avoir trouvé un bug — la toucher invaliderait le cache de miniature des deux chaînes.

**Contrainte d'écriture héritée du squelette** (métriques réelles d'Impact, 0,4534 em/caractère,
600 px à 112 px) : **≤ 10 caractères par mot et ≤ 12 au total** par ligne. Écrire sous cette
contrainte plutôt que compter sur l'auto-fit : une ligne rétrécie casse l'homogénéité de la
série. La pipeline applique `toUpperCase()` — autant écrire en capitales pour voir le résultat.

---

## 3. Le prompt image — bloc figé + une seule variable

Un gabarit avec **un seul trou** : l'objet héros. Le bloc DA se recopie mot pour mot ; ne jamais
le paraphraser, ne jamais « adapter le décor au sujet » — c'est précisément ce qui produit
l'incohérence.

```
A high-impact YouTube thumbnail. Subject: <OBJET HÉROS — une seule des trois familles §3 du
style.md, surdimensionné, ultra-détaillé>, isolated, positioned in the LEFT 45% of the frame and
cropped so it bleeds off the LEFT edge. Background: near-black studio void, no environment, no
furniture, no room detail. Lighting: one single hard amber rim light from the upper right,
extreme contrast, deep black falloff. Palette: near-black #111111 base, amber #E8A33D accent,
white highlights, nothing else. Composition: the entire RIGHT half of the frame is empty
background — no object, no detail, no light source there. Sharp focus, photorealistic, 8k, 16:9.
```

- **Un seul accent dans l'image.** Une seule zone ambre, sur l'élément mesuré. Deux points ambre
  dans une miniature détruisent la hiérarchie et sortent du registre instrument.
- La moitié droite **doit** rester vide : c'est là que le scrim et le titre se posent. Un objet
  qui déborde à droite rend le titre illisible et il n'y a pas de rattrapage au montage.
- L'entrée `thumbnail` est **exclue** de la chaîne de style globale par la pipeline. C'est voulu :
  sinon le modèle recevrait « near-black studio void, no environment » suivi de la chaîne
  globale, soit deux décors contradictoires et des négations interdites par la méthode inversée.
- Trois familles d'objet héros seulement (panneaux de réponse empilés, prisme delta, instrument
  de mesure). En inventer une quatrième par vidéo est exactement la dérive que ce fichier ferme.

---

## 4. Les deux lignes — ce qu'on écrit dessus

Le titre de miniature ne répète pas le titre de la vidéo, il porte **le chiffre ou l'écart**.
La chaîne s'appelle AnswerDelta : l'écart est le sujet.

Ce qui marche : un nombre concret et une unité courte (`0 CITATIONS` / `IN 30 DAYS`), un
avant/après (`RANK 1` / `NOT CITED`), un prix (`FREE TIER` / `THEN $49`). Ce qui ne marche pas :
un nom d'outil seul (il est déjà dans le logo en haut à droite), un adjectif (`INSANE`,
`GAME CHANGER` — ils ne disent rien et ils datent), une question.

Ligne 1 en blanc porte le fait ; ligne 2 en ambre porte la conséquence ou le prix. L'ordre n'est
pas décoratif : l'œil lit le blanc d'abord, l'accent retient le regard sur ce qui doit rester en
mémoire. Et c'est l'application de la règle « un seul accent » au texte — la ligne ambre est la
seule chose ambre du côté droit.

Vérifier la contrainte de largeur avant de rendre : `0 CITATIONS` (11) ✅ · `THEN $49` (8) ✅ ·
`AI OVERVIEWS` (12) ✅ pile à la limite · `GENERATIVE ENGINE` (17) ❌ → se réécrit `AI ANSWERS`.

---

## 5. Mesure — ce qui rendra ce preset vrai ou faux

La palette n'est pas en jeu : elle vient du logo et de la bannière, elle est verrouillée. Ce qui
reste hypothétique, c'est **la composition** : famille d'objet héros dominante, et type de
contenu des deux lignes (chiffre contre avant/après).

À partir de dix vidéos publiées avec cette DA, relever le CTR d'impression par vidéo dans
YouTube Studio et le comparer à la médiane de la chaîne. Ce qui se décide alors se décide **sur
la série entière**, jamais sur une miniature : changer une seule miniature parce qu'elle
sous-performe, c'est revenir au régime que ce fichier remplace. Une seule variable à la fois, et
la variante s'applique à toutes les vidéos d'un trimestre — sinon on ne mesure rien, on ajoute
du bruit.
