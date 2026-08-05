import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { concatClips, conformClip, type CtaBand, ffmpegAvailable, ffprobeDuration, finalMux, kenBurnsClip, type Motion } from "./lib/ffmpeg.js";
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
  /**
   * Bandeau d'appel à l'action incrusté sur cette scène (voir lib/ffmpeg.ts / CtaBand).
   * Contrairement à `textOverlay`, il s'applique AUSSI aux clips — c'est même son cas principal,
   * puisque toutes les scènes d'une vidéo tool-centric sont des enregistrements d'écran.
   */
  ctaBand?: CtaBand | null;
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

/** Sources showing real UI or their own text — burned subtitles must never cover them. */
const NO_BURNED_SUBS_SOURCES = new Set([
  "screen_capture",
  "screen_recording",
  "manual_asset",
  "hyperframes",
]);

/** Scene ids whose visuals must never be covered by burned subtitles (real UI, animated HTML, overlays). */
function protectedSceneIds(projectDir: string, scenes: SceneCfg[]): Set<string> {
  const ids = new Set<string>();
  for (const s of scenes) if (s.textOverlay || s.ctaBand) ids.add(s.sceneId);
  for (const [sceneId, source] of sceneSources(projectDir)) {
    if (NO_BURNED_SUBS_SOURCES.has(source)) ids.add(sceneId);
  }
  return ids;
}

/**
 * project-config.json + manifest + assets -> final.mp4
 * Per scene: Ken Burns clip sized to its (rescaled) audio window -> concat -> voice (+ music bed).
 * Clip scenes (hyperframes, screen_recording, and a hand-recorded manual_asset) use their
 * pre-rendered clip conformed to the scene window instead of a Ken Burns still.
 * Subtitles: subs.srt (CC chunking) is ALWAYS written. Burned subtitles (mode "burned") use
 * their own short-segment cut (subs-burned.srt: <=4 words, one line) and are dropped on
 * screen_capture / screen_recording / manual_asset / hyperframes scenes and on scenes with a
 * text overlay.
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
  /**
   * Resolve a scene's rendered asset by PROBING the disk rather than trusting its declared
   * source. `manual_asset` can be either a still or a hand-recorded clip — only the file that
   * actually landed says which. Clip wins over still if both somehow exist.
   */
  const sceneAsset = (sceneId: string): { path: string; isClip: boolean } => {
    const candidates: Array<{ path: string; isClip: boolean }> = [
      { path: join(projectDir, "assets", "hyperframes", `${sceneId}.mp4`), isClip: true },
      { path: join(projectDir, "assets", "recordings", `${sceneId}.mp4`), isClip: true },
      { path: join(projectDir, "assets", "images", `${sceneId}.png`), isClip: false },
    ];
    const found = candidates.find((c) => existsSync(c.path));
    if (found) return found;
    // Nothing on disk yet: report the path the declared source WOULD produce, for the error.
    const src = sources.get(sceneId) ?? "ai_image";
    if (src === "hyperframes") return { path: candidates[0].path, isClip: true };
    if (src === "screen_recording") return { path: candidates[1].path, isClip: true };
    return { path: candidates[2].path, isClip: false };
  };
  const missingImages = scenes.filter((s) => !existsSync(sceneAsset(s.sceneId).path));

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
    const asset = sceneAsset(s.sceneId);
    if (asset.isClip) {
      const kind = sources.get(s.sceneId) ?? "clip";
      log("INFO", `assemble: scene ${s.sceneId} — clip ${kind}, ${durations[i].toFixed(2)}s`);
      if (s.textOverlay) log("WARN", `assemble: ${s.sceneId} textOverlay ignoré (clip — pas de Ken Burns, le mouvement est déjà dedans)`);
      // A clip shorter than its window gets its last frame held by conformClip — a frozen shot,
      // which the retention rules call a killer. Warn loudly rather than ship it silently.
      try {
        const clipDur = ffprobeDuration(asset.path);
        if (clipDur + 0.05 < durations[i]) {
          log("WARN", `assemble: ${s.sceneId} clip de ${clipDur.toFixed(2)}s pour une fenêtre de ${durations[i].toFixed(2)}s — la dernière frame sera GELÉE. Rallonger les beats ou raccourcir la scène.`);
        }
      } catch { /* durée illisible: on laisse conformClip faire */ }
      conformClip({ clip: asset.path, out: join(clipsDir, `${s.sceneId}.mp4`), durationSec: durations[i], ctaBand: s.ctaBand ?? null });
      if (s.ctaBand) log("INFO", `assemble: ${s.sceneId} — bandeau CTA incrusté`);
      return;
    }
    log("INFO", `assemble: scene ${s.sceneId} — ${s.motion}, ${durations[i].toFixed(2)}s`);
    kenBurnsClip({
      image: asset.path,
      out: join(clipsDir, `${s.sceneId}.mp4`),
      durationSec: durations[i],
      motion: s.motion,
      textOverlay: s.textOverlay,
      ctaBand: s.ctaBand ?? null,
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
          /**
           * CAS LIMITE ATTEINT LE 2026-08-01 — ne pas retirer ce garde-fou.
           * Depuis que le preset impose 100 % de footage réel, TOUTES les scènes sont
           * "protégées" et il ne reste AUCUN segment à incruster : `subs-burned.srt` fait
           * 0 octet. Le filtre `subtitles=` de ffmpeg refuse un fichier vide et fait échouer
           * le mux final — après 8 minutes de tournage déjà payées en temps CPU. On ne passe
           * donc le filtre que s'il reste quelque chose à afficher.
           * `subs.srt` (les CC YouTube) reste écrit intégralement, lui : rien n'est perdu.
           */
          if (short.length === 0) {
            log("INFO", "assemble: aucune sous-titre incrusté à afficher (toutes les scènes sont du footage réel) — filtre subtitles non appliqué, subs.srt CC inchangé");
            srt = null;
          } else {
            srt = "subs-burned.srt";
          }
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
