# Image Prompt Style — global preset

Locked visual identity for the current niche (OFM by default). The pipeline appends this to **every**
gpt-image-1 prompt so assets stay consistent across scenes and across videos.
**This file is the main lever against drift** — changing quality systematically means
editing here (and logging it), never tweaking per video.

## Global style string (append verbatim to every image prompt)
```
<BRAND COLORS: blue + white>, cinematic rim lighting, dark luxury tech setting,
silhouette only, no visible face, high contrast, photorealistic, 8k, 16:9
```

## Rules
- **16:9 always** (1792x1024). Never crop in post.
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
- **GRAPHIC** (data / numbers / comparison): clean infographic, large legible text, + global string.
  gpt-image-1's text rendering is precisely why graphics are done in-house and not stock.
- **AI_IMAGE** (concept / metaphor): global string, composition rule-of-thirds, subject left, negative space right.
- **AI_VIDEO** (true motion): out of scope here — v2 / Kling.

## <À VERROUILLER>
- Exact brand HEX (e.g. neon blue `#00C8FF` from the thumbnail playbook).
- Any recurring motif you want present in every single video.
