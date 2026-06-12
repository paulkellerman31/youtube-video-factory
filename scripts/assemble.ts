import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { concatClips, conformClip, ffmpegAvailable, ffprobeDuration, finalMux, kenBurnsClip, type Motion } from "./lib/ffmpeg.js";
import { readManifest, writeFragment } from "./lib/manifest.js";
import { getSubtitlesMode } from "./lib/profile.js";
import { log, round2, sha256 } from "./lib/util.js";
import type { StepCtx } from "./generate-audio.js";

interface SceneCfg {
  sceneId: string;
  audioStart: number;
  audioEnd: number;
  visualType: "GRAPHIC" | "AI_IMAGE" | "AI_VIDEO";
  motion: Motion;
  textOverlay: string | null;
}

interface ProjectConfig {
  projectId: string;
  scenes: SceneCfg[];
  music?: { mood?: string; searchTerms?: string };
}

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface Caption { start: number; end: number; text: string }

/** ElevenLabs character alignment -> caption chunks. */
function buildCaptions(a: Alignment, opts: { maxChars: number; maxWords: number }): Caption[] {
  interface Word { text: string; start: number; end: number }
  const words: Word[] = [];
  let cur: Word | null = null;
  for (let i = 0; i < a.characters.length; i++) {
    const ch = a.characters[i];
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      continue;
    }
    if (!cur) cur = { text: ch, start: a.character_start_times_seconds[i], end: a.character_end_times_seconds[i] };
    else {
      cur.text += ch;
      cur.end = a.character_end_times_seconds[i];
    }
  }
  if (cur) words.push(cur);

  const captions: Caption[] = [];
  let cap: Word[] = [];
  const flush = (): void => {
    if (!cap.length) return;
    captions.push({ start: cap[0].start, end: cap[cap.length - 1].end + 0.15, text: cap.map((w) => w.text).join(" ") });
    cap = [];
  };
  for (const w of words) {
    const prev = cap[cap.length - 1];
    const len = cap.reduce((n, x) => n + x.text.length + 1, 0);
    const gap = prev ? w.start - prev.end : 0;
    if (cap.length > 0 && (len + w.text.length > opts.maxChars || cap.length >= opts.maxWords || gap > 0.8)) flush();
    cap.push(w);
    if (/[.!?…]$|—$/.test(w.text)) flush();
  }
  flush();
  return captions;
}

function toSrt(captions: Caption[]): string {
  const ts = (s: number): string => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.round((s - Math.floor(s)) * 1000);
    const pad = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms, 3)}`;
  };
  return captions.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join("\n");
}

/** sceneId -> asset source (default ai_image), from image-prompts.json. */
function sceneSources(projectDir: string): Map<string, string> {
  try {
    const prompts = JSON.parse(readFileSync(join(projectDir, "image-prompts.json"), "utf8")) as Array<{ sceneId: string; source?: string }>;
    return new Map(prompts.map((p) => [p.sceneId, p.source ?? "ai_image"]));
  } catch {
    return new Map(); // no prompts file -> everything treated as ai_image
  }
}

/** Scene ids whose visuals must never be covered by burned subtitles (real UI, animated HTML, overlays). */
function protectedSceneIds(projectDir: string, scenes: SceneCfg[]): Set<string> {
  const ids = new Set<string>();
  for (const s of scenes) if (s.textOverlay) ids.add(s.sceneId);
  for (const [sceneId, source] of sceneSources(projectDir)) {
    if (source === "screen_capture" || source === "manual_asset" || source === "hyperframes") ids.add(sceneId);
  }
  return ids;
}

/**
 * project-config.json + manifest + assets -> final.mp4
 * Per scene: Ken Burns clip sized to its (rescaled) audio window -> concat -> voice (+ music bed).
 * hyperframes scenes use their pre-rendered clip (assets/hyperframes/<sceneId>.mp4) conformed to
 * the scene window instead of a Ken Burns still.
 * Subtitles: subs.srt (CC chunking) is ALWAYS written. Burned subtitles (mode "burned") use
 * their own short-segment cut (subs-burned.srt: <=4 words, one line) and are dropped on
 * screen_capture / manual_asset / hyperframes scenes and on scenes with a text overlay.
 */
export async function assemble(ctx: StepCtx): Promise<void> {
  const { projectDir, dryRun } = ctx;
  const cfg: ProjectConfig = JSON.parse(readFileSync(join(projectDir, "project-config.json"), "utf8"));
  const scenes = cfg.scenes;
  if (!scenes?.length) throw new Error("project-config.json: no scenes");
  const v2 = scenes.filter((s) => s.visualType === "AI_VIDEO");
  if (v2.length) log("WARN", `assemble: ${v2.length} AI_VIDEO scene(s) — v2 feature, rendering as Ken Burns still for now`);

  const subsMode = getSubtitlesMode(projectDir);
  const manifest = readManifest(projectDir);
  const voice = join(projectDir, "assets", "audio", "voice.mp3");
  const sources = sceneSources(projectDir);
  const isHyper = (sceneId: string): boolean => sources.get(sceneId) === "hyperframes";
  const sceneAssetPath = (sceneId: string): string =>
    isHyper(sceneId)
      ? join(projectDir, "assets", "hyperframes", `${sceneId}.mp4`)
      : join(projectDir, "assets", "images", `${sceneId}.png`);
  const missingImages = scenes.filter((s) => !existsSync(sceneAssetPath(s.sceneId)));

  // Optional music bed: first audio file in assets/music/
  const musicDir = join(projectDir, "assets", "music");
  const musicFile = existsSync(musicDir)
    ? readdirSync(musicDir).find((f) => /\.(mp3|m4a|wav)$/i.test(f))
    : undefined;

  if (dryRun) {
    const planEnd = scenes[scenes.length - 1].audioEnd;
    log("DRY", `assemble: plan = ${scenes.length} scenes, ~${planEnd}s @1920x1080/30fps, motions: ${scenes.map((s) => s.motion).join(", ")}`);
    log("DRY", `assemble: music bed: ${musicFile ?? "none (will skip mix)"}`);
    log("DRY", `assemble: subtitles mode = ${subsMode} (subs.srt CC toujours produit${subsMode === "burned" ? "; incrustation courte 1 ligne, masquée sur captures/overlays" : "; image propre, pas d'incrustation"})`);
    if (!ffmpegAvailable()) log("WARN", "assemble: ffmpeg NOT found on PATH");
    if (!existsSync(voice)) log("WARN", "assemble: voice.mp3 missing (run audio step first)");
    if (missingImages.length) log("WARN", `assemble: missing images: ${missingImages.map((s) => s.sceneId).join(", ")} (run images step first)`);
    return;
  }

  if (!ffmpegAvailable()) throw new Error("ffmpeg not found on PATH");
  if (!existsSync(voice)) throw new Error("assets/audio/voice.mp3 missing — run the audio step first");
  if (missingImages.length) throw new Error(`missing images for: ${missingImages.map((s) => s.sceneId).join(", ")} — run the images step first`);

  const audioDur = manifest.audio?.durationSec ?? ffprobeDuration(voice);
  const imageHashes = (manifest.images ?? []).map((f) => `${f.sceneId}:${f.hash}`).join(",");
  // NOTE: "burned" (the historical behaviour) intentionally adds NOTHING to the hash, so every
  // project rendered before this feature keeps its hash and is never re-rendered (non-regression).
  const hash = sha256(JSON.stringify(scenes) + "|" + (manifest.audio?.hash ?? "") + "|" + imageHashes + "|" + (musicFile ?? "") + "|v1" + (subsMode === "burned" ? "" : `|subs:${subsMode}`));
  const finalPath = join(projectDir, "final.mp4");

  if (existsSync(finalPath) && manifest.final?.hash === hash) {
    log("SKIP", `assemble: final.mp4 up to date (hash ${hash})`);
    return;
  }

  // Rescale planned scene windows to the REAL audio duration.
  const planEnd = scenes[scenes.length - 1].audioEnd;
  const factor = audioDur / planEnd;
  const durations = scenes.map((s) => (s.audioEnd - s.audioStart) * factor);
  const drift = audioDur - durations.reduce((a, b) => a + b, 0);
  durations[durations.length - 1] += drift; // absorb rounding in last scene
  log("INFO", `assemble: audio ${audioDur}s (plan ${planEnd}s, scale x${factor.toFixed(3)}), subtitles=${subsMode}`);

  // 1) Scene clips
  const clipsDir = join(projectDir, "assets", "clips");
  mkdirSync(clipsDir, { recursive: true });
  scenes.forEach((s, i) => {
    if (isHyper(s.sceneId)) {
      log("INFO", `assemble: scene ${s.sceneId} — hyperframes clip, ${durations[i].toFixed(2)}s`);
      if (s.textOverlay) log("WARN", `assemble: ${s.sceneId} textOverlay ignoré (hyperframes — le texte vit dans la composition HTML)`);
      conformClip({
        clip: join(projectDir, "assets", "hyperframes", `${s.sceneId}.mp4`),
        out: join(clipsDir, `${s.sceneId}.mp4`),
        durationSec: durations[i],
      });
      return;
    }
    log("INFO", `assemble: scene ${s.sceneId} — ${s.motion}, ${durations[i].toFixed(2)}s`);
    kenBurnsClip({
      image: join(projectDir, "assets", "images", `${s.sceneId}.png`),
      out: join(clipsDir, `${s.sceneId}.mp4`),
      durationSec: durations[i],
      motion: s.motion,
      textOverlay: s.textOverlay,
    });
  });

  // 2) Concat
  const listFile = join(clipsDir, "concat.txt");
  writeFileSync(listFile, scenes.map((s) => `file '${s.sceneId}.mp4'`).join("\n") + "\n");
  concatClips("assets/clips/concat.txt", "assets/clips/_video.mp4", projectDir);

  // 3) Subtitles from ElevenLabs alignment. subs.srt (CC) is ALWAYS written.
  let srt: string | null = null;
  const tsPath = join(projectDir, "assets", "audio", "timestamps.json");
  if (existsSync(tsPath)) {
    try {
      const a = JSON.parse(readFileSync(tsPath, "utf8")) as Alignment | null;
      if (a?.characters?.length) {
        writeFileSync(join(projectDir, "subs.srt"), toSrt(buildCaptions(a, { maxChars: 38, maxWords: 7 })));
        if (subsMode === "burned") {
          // Short one-line segments, suppressed on protected scenes (captures, manual assets, overlays).
          const prot = protectedSceneIds(projectDir, scenes);
          const windows: Array<[number, number]> = [];
          let t = 0;
          scenes.forEach((s, i) => {
            if (prot.has(s.sceneId)) windows.push([t, t + durations[i]]);
            t += durations[i];
          });
          const short = buildCaptions(a, { maxChars: 22, maxWords: 4 }).filter((c) => {
            const mid = (c.start + c.end) / 2;
            return !windows.some(([w0, w1]) => mid >= w0 && mid <= w1);
          });
          writeFileSync(join(projectDir, "subs-burned.srt"), toSrt(short));
          srt = "subs-burned.srt";
        }
      }
    } catch (e) {
      log("WARN", `assemble: could not build subtitles (${(e as Error).message}) — continuing without`);
    }
  } else {
    log("WARN", "assemble: no timestamps.json — skipping subtitles");
  }
  if (subsMode !== "burned") srt = null;

  // 4) Final mux
  if (!musicFile) log("INFO", "assemble: no music bed in assets/music/ — skipping music mix");
  finalMux({
    videoIn: "assets/clips/_video.mp4",
    voiceIn: "assets/audio/voice.mp3",
    out: "final.mp4",
    srt,
    music: musicFile ? `assets/music/${musicFile}` : null,
    durationSec: audioDur,
    cwd: projectDir,
  });

  const finalDur = round2(ffprobeDuration(finalPath));
  const totalCost = round2((manifest.audio?.costUSD ?? 0) + (manifest.images ?? []).reduce((a, f) => a + f.costUSD, 0));
  writeFragment(projectDir, "final", {
    file: "final.mp4",
    durationSec: finalDur,
    sceneCount: scenes.length,
    totalCostUSD: totalCost,
    hash,
    generatedAt: new Date().toISOString(),
  });
  log("INFO", `assemble: final.mp4 done — ${finalDur}s, ${scenes.length} scenes, subtitles=${subsMode}, total cost $${totalCost}`);
}
