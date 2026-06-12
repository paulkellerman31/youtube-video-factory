---
name: youtube-video-factory
description: >
  Produce faceless YouTube videos end to end, single or in bulk: script, ElevenLabs
  voiceover, gpt-image-1 visuals, FFmpeg assembly. Use whenever asked to make a new
  video, spin up a batch or a week's videos, resume an in-progress video, or make a variant
  of a winning video — even if the words "skill" or "factory" aren't used. Triggers:
  "make N videos on…", "bulk a batch", "this week's videos", "resume video X",
  "another one like the [topic] video".
---

# YouTube Video Factory

Brain layer. It decides what to produce and writes the execution plan; the **pipeline**
(built per the build spec, run via `factory run <project>`) does the rendering. This skill
operates in **Cowork**. It never renders anything itself.

---

## The 20/80 doctrine — read first, it governs every choice

Goal: bulk, quality videos at ~20% human effort. That only works if effort lands on the
single highest-leverage point and nowhere else.

**Your 20% — the ONLY human touchpoints:**
1. Drop a topic / source — one line, or a list for bulk.
2. Approve the **PLAN**. In bulk, approve a *batch* of plans in one pass (~2 min for ten).
   This gate alone decides ~80% of final quality: get the angle, antagonist and block
   structure right and everything downstream is mechanical. Catching a bad angle at the
   plan costs 30 seconds; catching it after render costs a whole video.
3. Optional: a final glance at the rendered file(s).

**The automated 80% — never asked of the human:** script, voiceover text, image/graphic
prompts, asset generation, zoom/pan + assembly, subtitles, metadata, thumbnail prompt.

**Design consequence — preset once, decide nothing per video.** Every recurring decision is
locked in the references below. The per-video variable surface is *topic + source only*.
To raise quality, change a preset — never re-decide per video.

---

## Universal entry (before any workflow)

1. **Determine the CHANNEL** (ask if ambiguous; default `ofm`). One channel = one profile in
   `references/profiles/<channel>/`. Projects live in `projects/<channel>/<date>_<slug>/` and
   `project-config.json` carries `"channel": "<channel>"` — the pipeline reads voice + style
   from the profile.

2. Load the locked presets — these ARE the engine of 20/80:

```
□ references/script-director.md                       — V3.1 contracts (GLOBAL, all channels)
□ references/profiles/<channel>/style.md              — aesthetic family + global style string
□ references/profiles/<channel>/voice-config.json     — ElevenLabs voice id + settings
□ references/profiles/<channel>/thumbnail-playbook.md — thumbnail formula + niche slots
```

3. **Style is ADAPTIVE, anchored per channel.** The profile fixes the aesthetic *family*
   (light, palette, grain, subject types) — each image prompt serves THIS video's subject
   inside that family; coherence within one video beats variety. Technical subjects (tools,
   infra, numbers) get **literal/informative visuals** — dashboards, schemas, comparisons —
   over abstract metaphor.

4. **Asset source per scene** (the script director picks it, in `image-prompts.json`):
   - `ai_image` (default) — gpt-image-1, prompt + profile style string. Legacy entries untouched.
   - `screen_capture` — Playwright screenshot of a **PUBLIC** page (pricing, homepage,
     comparison). Fields: `capture.url` (required), `viewport` ("1920x1080"), `fullPage`,
     `selector`, `hideSelectors` (cookie banners…), `delayMs`. $0. **NEVER automate a login
     or credentials** — runs local with the heavy render, not in Cowork.
   - `manual_asset` — a file the human drops at `assets/captures/<sceneId>.png` BEFORE the
     run (logged-in dashboards). Pipeline uses it, never generates/overwrites it; missing =
     hard stop, no silent AI fallback.
   - `hyperframes` — animated HTML scene (charts, counters, kinetic text) for data/number
     scenes where a still is weak. The plan writes a self-contained composition at
     `hyperframes/<sceneId>/index.html` (`data-duration` = scene length, GSAP timeline in
     `window.__timelines`); the render produces `assets/hyperframes/<sceneId>.mp4` locally
     (HyperFrames CLI, $0, no API) and assemble conforms the clip to the scene window
     instead of Ken Burns. Optional fields: `hyperframes.dir` / `fps` (30) / `quality`
     (standard). `textOverlay` is ignored on these scenes — the text lives in the HTML.
     Local render only, never the CLI's cloud commands.

   Tool reviews: `screen_capture` for public pages, `manual_asset` for the connected
   dashboard, `hyperframes` for data/number scenes, `ai_image` for the rest.

   **Hard rule — text:** AI images NEVER contain readable text (model can't write). Every
   `ai_image` prompt ends with the canonical negative: `no text, no words, no letters,
   no numbers, no labels, no logos, no readable seals or stamps`. A scene that must show
   words/data/a document/a screen is TAGGED at PLAN time and routed to `screen_capture`,
   `manual_asset`, GRAPHIC, or abstract image + text overlay — never `ai_image`.
   **STRIP ≠ ROUTE:** only strip DECORATIVE text (fake invoice, bogus seal). If the text
   carries the meaning (calendar = months, dashboard = data, sign = a number), don't blank
   it — a blank box guts the scene; ROUTE it (overlay with real words / GRAPHIC / capture).

5. **Subtitles per channel** (`references/profiles/<channel>/render-config.json`, field
   `subtitles`, overridable per project in `project-config.json`):
   - `burned` (ofm default) — short one-line segments (≤4 words), raised above player
     controls, semi-transparent box, auto-suppressed on `screen_capture`/`manual_asset`/
     `hyperframes` scenes and on overlay scenes. For niches watched muted/ambient.
   - `cc` (rome-antique default) — clean image, native YouTube CC carry the text.
   - `none` — neither emphasized.
   Whatever the mode, `subs.srt` is ALWAYS generated — upload it as YouTube CC.

Never re-decide what a preset already fixes.

---

## Workflows

| # | Workflow | When | File |
|---|----------|------|------|
| 01 | One video | "make a video on X" | `workflows/01-one-video.md` |
| 02 | Bulk batch | "make N videos", "this week's batch", a topic list | `workflows/02-bulk-batch.md` |
| 03 | Resume / variant | "resume video X", "another like the winner" | `workflows/03-resume-variant.md` |

### 01 — One video (the spine)
1. Load presets. 2. Pick format from the mix; build the PLAN (format + reason, antagonist +
how defeated, tone, 5–8 blocks). **GATE: wait for "go".** 3. Write `voiceover.txt`,
`image-prompts.json`, `project-config.json`. 4. `factory run <project>`. 5. Surface `final.mp4`.

### 02 — Bulk batch (the 20/80 core)
1. Load presets once. 2. Take the topic list (or derive it from a theme/keyword cluster).
3. Generate **all** plans at once, spread across the format mix for variety. 4. **BATCHED GATE:**
present the plans compactly (one line each: topic · format · antagonist) → approve / drop /
tweak the whole set in one pass. 5. For each approved plan: write its assets + config, then
`factory run`. Fire unattended. 6. Surface the batch: table of `final.mp4` + per-video cost
pulled from manifests.

> The gate is per-**plan**, batched — never per-asset, never per-video-after-render.
> That is the entire trick to making bulk cheap in effort.

### 03 — Resume / variant
- **Resume:** read the project manifest, re-run only unfinished steps (the idempotent pipeline skips what's done).
- **Variant:** clone a winning project's `project-config.json`, swap topic/angle, keep the proven structure.

---

## Hard rules
- **Presets are the source of truth.** Systematic quality changes go in `references/`, versioned — not per video.
- **Call the pipeline; never reimplement** ElevenLabs / image gen / FFmpeg inside the skill.
- **One gate only.** Resist adding approval steps — each one taxes the 20%. The plan gate is enough.
- **Cowork operates; Claude Code built it.** Secrets live in `.env`, never in any file here.
- **Quality at scale = consistency.** Drift is the enemy of bulk; the locked presets + the single plan gate are what hold it.
