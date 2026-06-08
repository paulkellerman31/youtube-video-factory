# YouTube Video Factory — Build Spec (v1 spine)

> Hand this file to Claude Code. It is the blueprint for the **execution layer** (the "hands").
> The creative contracts (script direction, visual rules, metadata, thumbnail) come from your
> existing V3.1 MASTER prompt and thumbnail playbook — those populate `references/`, not this build.

---

## 0. Principle

The **skill is not the render engine; it produces an execution plan.** The **pipeline is the render engine.**
- Brain (skill): decides what to produce, writes prompts + `project-config.json`.
- Hands (these scripts): execute deterministically — API calls, file I/O, FFmpeg, final deliverable.

An agent must never be in the loop for the per-asset grind. Code does that.

---

## 1. Locked decisions

| Concern              | Choice                                              |
|----------------------|-----------------------------------------------------|
| Images & graphics    | OpenAI `gpt-image-1` (API)                          |
| Motion on stills     | FFmpeg zoom/pan (Ken Burns)                         |
| True-motion clips    | Kling via fal.ai — **DEFERRED to v2**               |
| Voice-over           | ElevenLabs (API)                                    |
| Assembly             | FFmpeg (programmatic, replaces manual CapCut)       |
| Subtitles            | FFmpeg burn-in (whisper-based timing) — v1 minimal  |

**Maturity-1 = replayable & predictable, NOT "smart".**
Required: idempotent (skip-if-done), file logs, retries + timeouts, `--dry-run`, per-project working dir.
Everything else (observability stack, queues, incident recovery beyond replay) waits until volume forces it.

---

## 2. v1 scope — build THIS first, nothing more

**IN (the spine):**
`brief → [skill writes script + scenes + prompts + voiceover.txt + project-config.json] → generate-audio → generate-images → assemble → final.mp4`
One project, one CLI, end-to-end, replayable.

**OUT (deferred, do not build yet):**
- `generate-video.ts` (Kling/fal.ai)
- Auto `STATE.md` / `CHANGELOG.md` plumbing
- Thumbnail-playbook automation (generate prompts manually for now)
- Batching / queue / parallelism
- Any web UI

**Definition of done for v1:** one real video comes out, and re-running the project skips already-done steps.

---

## 3. Repo structure

```
youtube-video-factory/
├── SKILL.md                  # brain — orchestration only (see §7)
├── references/               # populated from your V3.1 + thumbnail playbook
│   ├── script-director.md    # = your Doc1 V3.1 contracts
│   ├── image-prompt-style.md  # global visual style injected into every prompt
│   ├── thumbnail-playbook.md # = your Doc3 data
│   └── voice-config.json     # <À REMPLIR> ElevenLabs voice_id + settings
├── scripts/                  # hands
│   ├── generate-audio.ts
│   ├── generate-images.ts
│   ├── assemble.ts
│   ├── lib/
│   │   ├── manifest.ts       # read/write manifest fragments, hashing
│   │   ├── rates.ts          # configurable cost table (do NOT hardcode prices)
│   │   └── ffmpeg.ts         # zoom/pan, concat, subtitles, music helpers
│   └── cli.ts                # `factory run <project-dir>` , `--dry-run`, `--only <step>`
├── _archive/                 # Doc2 (superseded) lives here, never loaded
└── projects/
    └── 2026-06-07_topic-slug/
        ├── project-config.json   # the execution plan (skill writes this)
        ├── voiceover.txt
        ├── image-prompts.json
        ├── assets/{audio,images,clips}/
        ├── manifest.json         # the per-project truth
        └── final.mp4
```

Secrets live in `.env` (gitignored). **Never** in SKILL.md, references, or any versioned file.

---

## 4. I/O contracts (strict — one manifest fragment per script)

Every script: reads a typed input, writes typed outputs + its own manifest fragment, is **idempotent**,
logs **cost per asset**, supports `--dry-run`.

**Idempotence rule (shared):** before generating asset X, compute `hash(prompt + params)`.
If the output file exists AND `manifest[X].hash === currentHash` → skip. Otherwise (re)generate.
This makes "replay one step" and "resume after crash" free, with zero extra plumbing.

### generate-audio.ts
```
in:  projects/<p>/voiceover.txt  +  references/voice-config.json
out: projects/<p>/assets/audio/voice.mp3
manifest fragment "audio": { file, durationSec, voiceId, hash, costUSD, generatedAt }
```

### generate-images.ts
```
in:  projects/<p>/image-prompts.json   # [{ sceneId, prompt, ar:"16:9" }]
     + references/image-prompt-style.md  # global style appended to each prompt
out: projects/<p>/assets/images/<sceneId>.png
manifest fragment "images": [{ sceneId, file, hash, costUSD, generatedAt }]
```

### assemble.ts
```
in:  projects/<p>/project-config.json + manifest.json + all assets
out: projects/<p>/final.mp4
steps: per scene → apply zoom/pan to still for its audio-window duration
       → concat → burn subtitles → mix music bed (15–18%, fade in 2s / out 3s)
manifest fragment "final": { file, durationSec, sceneCount, totalCostUSD, generatedAt }
```

(`generate-video.ts` slots in here in v2: motion scenes pull a clip instead of a zoomed still.)

---

## 5. `project-config.json` — the execution plan the skill writes

```json
{
  "projectId": "2026-06-07_topic-slug",
  "format": "B",
  "tone": "AUTHORITY",
  "brandColors": "<À REMPLIR>",
  "scenes": [
    {
      "sceneId": "s01",
      "audioStart": 0.0,
      "audioEnd": 4.2,
      "visualType": "GRAPHIC",          // GRAPHIC | AI_IMAGE | (AI_VIDEO=v2)
      "motion": "push-in",              // push-in | pull-back | pan | static
      "textOverlay": null
    }
  ],
  "music": { "mood": "tense", "searchTerms": "..." }
}
```

Scene `visualType` is the **routing key** (your Doc1 RISK TAGS logic): GRAPHIC/AI_IMAGE → gpt-image-1 + FFmpeg motion in v1; AI_VIDEO → Kling in v2.

---

## 6. `manifest.json` — per-project truth

Composed of the fragments above. Single-writer per step (no shared-key races).
Each fragment carries `hash`, `costUSD`, `generatedAt`; project level carries `updatedAt`, `lastError`.
The future `STATE.md` is *derived* by scanning manifests — never hand-maintained.

---

## 7. SKILL.md (the brain) — lean orchestration, populate `references/` from your docs

```markdown
---
name: youtube-video-factory
description: >
  Produce a faceless YouTube video end to end: script, ElevenLabs voiceover,
  image/graphic prompts, and FFmpeg assembly. Trigger when asked to make a new
  video or to resume an in-progress one.
---

## Order of operations
1. Brief → confirm format, tone, antagonist, CTA (see references/script-director.md).
2. Write script + 10-scene table. GATE: wait for "go".
3. Write voiceover.txt (ElevenLabs rules: numbers as words, em-dash pauses, no [PAUSE] tags).
4. Write image-prompts.json (inject references/image-prompt-style.md into every prompt).
5. Write project-config.json (scene windows, visualType routing, motion, overlays, music).
6. Call the pipeline: `factory run <project-dir>`. GATE: review final.mp4.

## Hard rules
- Call the pipeline. Do NOT reimplement ElevenLabs / image gen / FFmpeg in the skill.
- Secrets come from .env, never written into any file.
- One quote of truth: assets are tracked by manifest.json; never duplicate state.
- Before editing any references/ file, this is a system change — note it (CHANGELOG when added).
```

---

## 8. You fill (proprietary — the only blanks)

- `references/voice-config.json` → your ElevenLabs `voice_id` + stability/style values.
- `brandColors` → your locked brand palette (e.g. blue/white).
- `.env` → `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`.
- `references/script-director.md` ← paste your **Doc1 V3.1**.
- `references/thumbnail-playbook.md` ← paste your **Doc3**.

---

## 9. First ask to Claude Code

> "Build the v1 spine from this spec: `generate-audio.ts`, `generate-images.ts`, `assemble.ts`,
> plus `lib/manifest.ts`, `lib/ffmpeg.ts`, `lib/rates.ts`, and `cli.ts` exposing
> `factory run <project-dir>` with `--dry-run` and `--only <step>`. TypeScript/Node.
> Idempotent via prompt-hash, file logging, retries+timeouts. No video generation yet.
> Then run one sample project end to end and show me final.mp4."
