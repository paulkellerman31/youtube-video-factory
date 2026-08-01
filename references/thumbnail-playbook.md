# Thumbnail Playbook — universal preset (BOÎTE À OUTILS, pas un preset de production)

> ## ⚠️ Lire ceci avant d'utiliser ce fichier (2026-08-01)
>
> **Ce fichier ne pilote plus aucune production.** Le preset qui s'applique à une chaîne est
> `references/profiles/<channel>/thumbnail-playbook.md`, et pour OFM il est passé en **DA
> verrouillée v2** : un squelette unique, zéro archétype à choisir.
>
> **Pourquoi :** le modèle « choisis l'archétype qui colle à l'angle » (§4 ci-dessous) est une
> consigne de *variété*. Appliqué sur 22 vidéos, il a produit exactement ce qu'il promettait —
> 22 miniatures qui n'ont rien en commun, donc une chaîne qu'on ne reconnaît pas dans une
> sidebar. Le catalogue d'archétypes reste utile comme **matière de conception**, jamais comme
> décision par vidéo.
>
> **Comment ouvrir une nouvelle niche à partir d'ici :** piocher dans les §2-§5 pour concevoir
> **UN** squelette, puis le figer en coordonnées absolues dans le profil de la chaîne
> (grille, traitement de fond, palette fermée, UNE police, slots logo/marque, zone morte) et
> n'exposer qu'un seul emplacement variable. Voir `profiles/ofm/thumbnail-playbook.md` §2-§3
> comme modèle de rédaction. Le choix d'archétype se fait **une fois pour la chaîne**, pas une
> fois par vidéo.

**How the skill uses this:** source material for designing a channel's locked art direction —
read it once when opening a niche, not once per video.

> Brand palette / HEX must stay in sync with `references/image-prompt-style.md`. If they ever
> diverge, the palette has one home — fix it there, not in two places.

---

## 1. Non-negotiables — the postage-stamp test
- Must read at the size of a postage stamp on a phone. Unclear when shrunk = it fails.
- **ONE** focal subject. No clutter.
- Emotion **or** an oversized hero object. Flat = no click.
- High contrast, vibrant colors.
- Reserve empty space for the text overlay (usually the right third).
- Text ≤ 3 words. Never in the bottom 20% (player controls cover it). Un profil de chaîne peut
  resserrer davantage — OFM impose 2 lignes de ≤ 12 caractères.

---

## 2. CTR formula — structure every prompt this way
```
[EMOTION/ACTION] + [SUBJECT] + [SETTING/BACKGROUND] + [COLOR/LIGHTING] + [STYLE] + [VISUAL EFFECTS] + [COMPOSITION]
```

---

## 3. Master prompt template — the generator (fill the [SLOTS])
```
A high-impact YouTube thumbnail, [NICHE] style. Subject: an oversized, ultra-detailed
[HERO OBJECT] showing [CONCEPT/TOOL] with NO text, NO words, NO labels on any surface,
held by a human hand with visible skin texture. Background: [SETTING] in a [BRAND COLORS]
palette with subtle bokeh blur. Lighting: extreme cinematic rim lighting, high contrast,
vibrant saturation. Composition: rule of thirds, subject on the LEFT, large empty negative
space on the RIGHT for text overlay. Sharp focus, 8k, photorealistic. --ar 16:9 --style raw
```
Baked-in rules: photorealism only (no cartoon/illustration); subject LEFT / empty space RIGHT;
human hand for authenticity (avoids the CGI look); hero object oversized for mobile.

---

## 4. Archetype templates — pick by the video's angle
| Archetype | Use when the angle is… | Visual move |
|-----------|------------------------|-------------|
| Emotional Hook | reaction-driven | extreme facial/silhouette expression on a vibrant bg |
| Action Zoom | tutorial / DIY / how-to | ultra close-up on the object or hands in action |
| Contrast Grab | a bold claim | neon / complementary colors on a dark bg, max contrast |
| Urgency / FOMO | time-sensitive, a "secret" | red arrow or circle pointing at the "treasure" |
| Transformation | before / after, results | split-screen showing a radical change |
| Trending / Cultural | riding a current trend | current aesthetic codes (retro, neon, gaming) |
| Drama / Exaggeration | shock | oversized reaction or staged accident |

**Règle dure — vidéos "review" d'outil (data 2026-06 : CTR 0,65 % sur packaging logo/outil) :**
jamais l'outil/logo seul en héros. Archétype imposé : **Contrast Grab** ou **Urgency/FOMO**,
centré sur le problème que l'outil résout (danger, blocage, perte). L'outil peut apparaître
en objet secondaire, jamais en sujet principal.

---

## 5. Power-keyword glossary — include to lift render quality + CTR
`ultra close-up` · `vibrant colors / neon` · `cinematic lighting` · `glowing effect` ·
`extreme [emotion]` · `high contrast` · `motion blur` · `space for text on the [side]` (always).

---

## 6. Text-overlay spec
- ≤ 3 words, ALL CAPS (seuil universel ; un profil de chaîne peut être plus strict).
- Font: pick **ONE** bold condensed face and lock it in the channel profile. Ne jamais laisser
  « X **ou** Y » dans un preset d'identité : une alternative ouverte est une divergence garantie
  à l'échelle. `FONT_CANDIDATES` ne liste que Impact / Arial Bold / DejaVu : sur la machine de
  rendu (Windows) il résout **Impact**. Écrire « Bebas Neue » n'entretient qu'une illusion de choix.
- Two-tone: line 1 white / line 2 the brand accent color.
- Never in the bottom 20%. Maximum contrast against the background.
- Burned by the **pipeline** (ffmpeg, `overlay.lines` in the thumbnail entry of
  `image-prompts.json`) — keep text out of the AI prompt. Output: `assets/thumbnail.png`
  (ready) + `assets/thumbnail-raw.png` (no text, for optional Canva rework).

---

## 7. Fatal errors — auto-reject if any appear
- Vague prompt ("a cool thumbnail") → generic output.
- No reserved text space → unreadable once the title is added.
- No emotion / flat composition → no click.
- Too much detail → fails the postage-stamp test on mobile.

---

## 8. NICHE SLOTS — the only per-operation fill
This is what makes the playbook universal. Fill these per niche; everything above stays fixed.

**Template (copy this block per new niche):**
```
- Brand palette + HEX:
- Hero object library (3–5 iconic objects):
- Aesthetic notes / setting:
- Banned elements:
- Default archetype mix:
```

**~~Filled example — OFM~~ — PÉRIMÉ, ne pas recopier.** L'ancien bloc rempli OFM (« dark luxury
tech office », 4 objets héros, « no green » pour seule interdiction, mix d'archétypes) contredit
terme à terme la DA v2. La version qui fait foi est
**`references/profiles/ofm/thumbnail-playbook.md` §2-§3** : fond charcoal void sans décor, six
objets héros tabulés, palette fermée (or/vert/violet/orange/magenta bannis), un seul archétype
figé pour la chaîne. S'y référer comme modèle de rédaction pour toute nouvelle niche.

---

## 9. The edge compounds here
The universal framework above is a strong **baseline** — but the real CTR lift comes from the
niche slots, and they get sharper when fed real data. Log each published thumbnail's CTR; every
quarter, promote what wins into §8 for that niche. That is where this stops being "generic best
practice" and becomes your moat.
