# Image Prompt Style — global preset

Locked visual identity for the current niche (OFM by default). The pipeline appends this to **every**
gpt-image-1 prompt so assets stay consistent across scenes and across videos.
**This file is the main lever against drift** — changing quality systematically means
editing here (and logging it), never tweaking per video.

> ⚠️ **Modèle réel : `gpt-image-1.5`** (défaut de `generate-images.ts`, surchargeable par
> `IMAGE_MODEL`). Les règles « le modèle ne sait pas écrire » et la méthode inversée ont été
> établies sur **gpt-image-1** ; l'A/B du 2026-06-13 décrit 1.5 comme *meilleur en texte*. Ces
> deux règles restent en vigueur par prudence, mais elles sont **à re-tester sur 1.5** avant
> d'être re-verrouillées — c'est peut-être une contrainte qu'on s'impose pour rien.

## Global style string (append verbatim to every image prompt)
```
<BRAND COLORS: blue + white>, cinematic rim lighting, dark luxury tech setting,
silhouette only, no visible face, high contrast, photorealistic, 8k, 16:9
```

## Rules
- **Génération en 3:2 — `1536x1024`** (valeur réellement passée par `generate-images.ts` ;
  1792x1024 est une taille DALL·E 3, pas gpt-image). Le 16:9 est obtenu au montage :
  `kenBurnsClip` recadre en 1920x1080, la miniature en 1280x720. Ne jamais recadrer à la main.
- **No visible faces** — silhouettes, hands, or objects only.
- **Palette:** blue + white (OFM codes). No green / "Matrix" look.
- **Human touch:** when a hand appears, specify "visible skin texture" (avoid the CGI look).
- **Hero object oversized** for mobile readability.
- **Texte parasite — méthode INVERSÉE (data 2026).** gpt-image-1 IGNORE les négations et le mot
  « text/logo » ATTIRE l'artefact. Ne jamais écrire `text, word, letter, label, logo, sign` dans
  un prompt. Décrire les surfaces en positif (« plain blank surfaces, unmarked screens, smooth
  featureless background ») ; pictogramme sans lettrage = « icon/emblem/symbol », jamais « logo ».
  Texte porteur de sens → routé (overlay / GRAPHIC-hyperframes / capture).

## By scene type (routing matches the build spec)
- **GRAPHIC** (data / numbers / comparison / mécanique technique) : rendu via **`hyperframes`**
  (compo HTML/CSS+GSAP animée, texte NET, $0) — **PAS en AI_IMAGE**. Un GRAPHIC généré sort avec
  du texte cassé : c'est la raison d'être du routage hyperframes, pas une préférence de style.
  (Trace de l'ancienne règle dans le dépôt : `nodemaven-quality-filter` s16 et s27 demandent
  « large legible bold white text » sans `source` → routés en `ai_image`. À corriger.)
- **AI_IMAGE** (concept / metaphor): global string, composition rule-of-thirds, subject left, negative space right.
- **AI_VIDEO** (true motion) : hors scope v1. Banc d'essai retenu = **fal.ai** (Veo 3.1 vs
  Seedance Fast) — **pas Kling**, écarté comme premium (cf. ROADMAP §3 et CHANGELOG).
- **SCREEN_RECORDING** (page réelle filmée) : cf. `references/screen-recording-contract.md`.

## Palette et police — elles vivent dans le PROFIL DE CHAÎNE, pas ici

⚠️ **Ce fichier est le fallback GLOBAL, chargé pour toute chaîne dépourvue de
`profiles/<channel>/style.md`** (`profileFile(projectDir, "style.md", "image-prompt-style.md")`).
Y graver une palette fermée casserait les autres chaînes : `rome-antique` est bâtie sur l'**or et
le bronze**, `corps-humain` sur du teal `#2EC4B6` + corail `#FF6B6B` sur crème. Une couleur
« bannie sans exception » pour OFM est la couleur principale d'une autre chaîne.

**Donc :** la palette fermée, la couleur d'alarme, la liste des bannis et la police de marque
sont définies **par chaîne** dans `references/profiles/<channel>/style.md`, et la DA complète des
miniatures (squelette, coordonnées, slots) dans
`references/profiles/<channel>/thumbnail-playbook.md`.

**Règle universelle qui, elle, s'applique à toutes les chaînes : UNE seule police par chaîne.**
Jamais « X **ou** Y » dans un preset d'identité — une alternative laissée ouverte est une
divergence garantie à l'échelle. Note d'implémentation : `FONT_CANDIDATES` (`lib/ffmpeg.ts`) ne
liste que Impact / Arial Bold / DejaVu Sans Bold ; sur la machine de rendu (Windows) il résout
**Impact**, sur Linux il retomberait sur DejaVu. Une police non listée n'est pas rendue, quoi
qu'en dise un preset.
