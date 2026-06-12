import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export type Motion = "push-in" | "pull-back" | "pan" | "static";

export function ffmpegAvailable(): boolean {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function ffprobeDuration(file: string): number {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  const d = parseFloat(out.trim());
  if (!Number.isFinite(d)) throw new Error(`ffprobe: cannot read duration of ${file}`);
  return d;
}

function run(args: string[], cwd?: string): void {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
  });
}

// Cross-platform font resolution: ffmpeg drawtext without fontfile relies on
// fontconfig, which is broken on Windows builds -> always pass an explicit file.
const FONT_CANDIDATES = [
  "C:/Windows/Fonts/impact.ttf", // brand font (thumbnail playbook) on Windows
  "C:/Windows/Fonts/arialbd.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/System/Library/Fonts/Supplemental/Impact.ttf",
];
/**
 * Windows drive colons break the filtergraph parser no matter the escaping.
 * Sidestep entirely: copy the font next to the output clip and reference it
 * with a colon-free RELATIVE path (relative to ffmpeg's cwd).
 */
function fontFilePrefix(outFile: string, cwd?: string): string {
  const src = FONT_CANDIDATES.find((p) => existsSync(p));
  if (!src) return "";
  const cached = join(dirname(outFile), "_font.ttf");
  if (!existsSync(cached)) copyFileSync(src, cached);
  const rel = relative(cwd ?? process.cwd(), cached).split("\\").join("/");
  if (rel.includes(":")) return ""; // different drive — give up rather than crash
  return `fontfile='${rel}':`;
}

/**
 * Burn the thumbnail text overlay per references/thumbnail-playbook.md §6:
 * ≤ 2 lines ALL CAPS, Impact (FONT_CANDIDATES), line 1 white / line 2 accent color,
 * right-aligned in the reserved right third, never in the bottom 20%.
 * Output: 1280x720 (YouTube upload spec), center-cropped from the 1536x1024 source.
 */
export function thumbnailOverlay(opts: {
  image: string;
  out: string;
  lines: string[];
  accent?: string; // brand accent — default neon blue (image-prompt-style.md)
  cwd?: string;
}): void {
  const { image, out, lines, accent = "#00C8FF", cwd } = opts;
  const font = fontFilePrefix(out, cwd);
  const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/'/g, "’").replace(/:/g, "\\:");
  const draw = lines.slice(0, 2).map((l, i) => {
    const color = i === 0 ? "white" : accent;
    return `drawtext=${font}text='${esc(l.toUpperCase())}':fontsize=120:fontcolor=${color}:borderw=8:bordercolor=black@0.9:x=w-text_w-56:y=${72 + i * 144}`;
  });
  const filters = ["scale=1280:720:force_original_aspect_ratio=increase", "crop=1280:720", ...draw];
  run(["-i", image, "-vf", filters.join(","), "-frames:v", "1", "-update", "1", out], cwd);
}

/** Render one still image into a Ken Burns motion clip (video only, no audio). */
export function kenBurnsClip(opts: {
  image: string;
  out: string;
  durationSec: number;
  motion: Motion;
  textOverlay?: string | null;
  width?: number;
  height?: number;
  fps?: number;
  cwd?: string;
}): void {
  const { image, out, durationSec, motion, textOverlay, width = 1920, height = 1080, fps = 30, cwd } = opts;
  const frames = Math.max(2, Math.round(durationSec * fps));
  const zMax = 1.14;
  const dz = (zMax - 1).toFixed(4);
  const center = `x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2'`;
  let zp: string;
  switch (motion) {
    case "push-in":
      zp = `zoompan=z='1+${dz}*on/${frames}':${center}`;
      break;
    case "pull-back":
      zp = `zoompan=z='${zMax}-${dz}*on/${frames}':${center}`;
      break;
    case "pan":
      zp = `zoompan=z=1.08:x='(iw-iw/zoom)*on/${frames}':y='ih/2-(ih/zoom)/2'`;
      break;
    default: // static (tiny zoom avoids zoompan edge-case at z=1)
      zp = `zoompan=z=1.001:${center}`;
      break;
  }
  // Upscale first so zoompan sub-pixel motion stays smooth.
  const filters = [
    `scale=${width * 25 / 10}:-2`,
    `${zp}:d=${frames}:s=${width}x${height}:fps=${fps}`,
    "format=yuv420p",
  ];
  if (textOverlay) {
    const esc = textOverlay.replace(/\\/g, "\\\\").replace(/'/g, "’").replace(/:/g, "\\:");
    const font = fontFilePrefix(out, cwd);
    filters.push(
      `drawtext=${font}text='${esc}':fontsize=84:fontcolor=white:borderw=5:bordercolor=black@0.85:x=(w-text_w)/2:y=h-260`,
    );
  }
  run(
    ["-i", image, "-vf", filters.join(","), "-r", String(fps), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-an", out],
    cwd,
  );
}

/**
 * Conform a pre-rendered clip (hyperframes) to its scene window: scale/pad to frame, exact
 * duration (last frame held if the source is shorter), same codec params as kenBurnsClip so
 * concatClips' -c copy stays valid. Video only — any composition audio is dropped.
 */
export function conformClip(opts: {
  clip: string;
  out: string;
  durationSec: number;
  width?: number;
  height?: number;
  fps?: number;
  cwd?: string;
}): void {
  const { clip, out, durationSec, width = 1920, height = 1080, fps = 30, cwd } = opts;
  const d = durationSec.toFixed(3);
  const filters = [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    `fps=${fps}`,
    `tpad=stop_mode=clone:stop_duration=${d}`,
    `trim=duration=${d}`,
    "setpts=PTS-STARTPTS",
    "format=yuv420p",
  ];
  run(
    ["-i", clip, "-vf", filters.join(","), "-r", String(fps), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-an", out],
    cwd,
  );
}

/** Concat pre-encoded scene clips (same codec/params) without re-encoding. */
export function concatClips(listFile: string, out: string, cwd?: string): void {
  run(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", out], cwd);
}

/**
 * Final mux: video + voice (+ optional looped music bed) + burned-in subtitles.
 * Run with cwd = project dir and RELATIVE paths so the subtitles filter needs no escaping.
 */
export function finalMux(opts: {
  videoIn: string;
  voiceIn: string;
  out: string;
  srt?: string | null;
  music?: string | null;
  musicVolume?: number; // 0.15–0.18 per spec
  durationSec: number;
  cwd: string;
}): void {
  const { videoIn, voiceIn, out, srt, music, musicVolume = 0.16, durationSec, cwd } = opts;
  const args: string[] = ["-i", videoIn, "-i", voiceIn];
  if (music) args.push("-stream_loop", "-1", "-i", music);

  if (music) {
    const fadeOutStart = Math.max(0, durationSec - 3).toFixed(2);
    // amix averages inputs -> volume=2 restores voice level after the mix.
    args.push(
      "-filter_complex",
      `[2:a]volume=${musicVolume},afade=t=in:st=0:d=2,afade=t=out:st=${fadeOutStart}:d=3[m];` +
        `[1:a][m]amix=inputs=2:duration=first:dropout_transition=0,volume=2[a]`,
      "-map", "0:v", "-map", "[a]",
    );
  } else {
    args.push("-map", "0:v", "-map", "1:a");
  }
  if (srt) args.push("-vf", `subtitles=${srt}:force_style='FontName=Arial,Bold=1,FontSize=20,BorderStyle=3,Outline=3,OutlineColour=&H80000000,Shadow=0,MarginV=40,Alignment=2'`);
  args.push(
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart",
    out,
  );
  run(args, cwd);
}
