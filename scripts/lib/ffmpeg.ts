import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fitFontSize, readFontMetrics } from "./fontmetrics.js";

export type Motion = "push-in" | "pull-back" | "pan" | "static";

/**
 * QUALITÉ D'ENCODAGE — relevée le 2026-08-01 après visionnage du premier rendu.
 *
 * Le contenu d'écran (texte fin, aplats, bordures d'un pixel) est le pire cas pour x264 : ce que
 * crf 20 + preset veryfast laisse passer sur une photo devient visiblement pixelisé sur une page
 * web. Et la chaîne empile TROIS générations : webm du screencast -> mp4 -> conformClip -> mux
 * final. Chacune reprenait à crf 20.
 *
 * crf 16 + preset medium coûte ~2,5x la taille de fichier et un peu de temps CPU. Sur une vidéo
 * de 2 min 30 en local, c'est gratuit ; la netteté du texte, elle, se voit.
 */
export const VIDEO_CRF = "16";
export const VIDEO_PRESET = "medium";

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
 *
 * Returns both paths: `rel` for the filtergraph, `abs` for reading the font's own metrics
 * (thumbnailOverlay auto-fits the headline, which ffmpeg cannot do).
 */
function resolveFontFile(outFile: string, cwd?: string): { abs: string; rel: string } | null {
  const src = FONT_CANDIDATES.find((p) => existsSync(p));
  if (!src) return null;
  const cached = join(dirname(outFile), "_font.ttf");
  if (!existsSync(cached)) copyFileSync(src, cached);
  const rel = relative(cwd ?? process.cwd(), cached).split("\\").join("/");
  if (rel.includes(":")) return null; // different drive — give up rather than crash
  return { abs: cached, rel };
}

function fontFilePrefix(outFile: string, cwd?: string): string {
  const f = resolveFontFile(outFile, cwd);
  return f ? `fontfile='${f.rel}':` : "";
}

/**
 * Police pour les SYMBOLES (flèche ↓ du bandeau CTA).
 *
 * Impact — la police de marque — ne contient pas forcément U+2193, et drawtext rend un glyphe
 * absent en « tofu » : un rectangle vide, en plein milieu de l'appel à l'action. On résout donc
 * une police connue pour le porter, et si aucune n'est trouvée on OMET la flèche. Un CTA sans
 * flèche fonctionne ; un CTA avec un carré vide ne fonctionne pas.
 */
const SYMBOL_FONT_CANDIDATES = [
  "C:/Windows/Fonts/arial.ttf",
  "C:/Windows/Fonts/seguisym.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
];

function symbolFontPrefix(outFile: string, cwd?: string): string | null {
  const src = SYMBOL_FONT_CANDIDATES.find((p) => existsSync(p));
  if (!src) return null;
  const cached = join(dirname(outFile), "_font_sym.ttf");
  if (!existsSync(cached)) copyFileSync(src, cached);
  const rel = relative(cwd ?? process.cwd(), cached).split("\\").join("/");
  if (rel.includes(":")) return null;
  return `fontfile='${rel}':`;
}

/**
 * Burn the thumbnail text overlay per references/thumbnail-playbook.md §6:
 * ≤ 2 lines ALL CAPS, Impact (FONT_CANDIDATES), line 1 white / line 2 accent color,
 * right-aligned in the reserved right third, never in the bottom 20%.
 * Output: 1280x720 (YouTube upload spec), center-cropped from the 1536x1024 source.
 */
/**
 * LOCKED THUMBNAIL ART DIRECTION — see references/profiles/<channel>/thumbnail-playbook.md §2.
 *
 * These values ARE the art direction. They are deliberately module constants and not
 * configuration: making them tunable per video would reopen exactly the door the playbook
 * closes (22 published thumbnails with nothing in common). Change them once per quarter, on
 * CTR data, for the whole channel — never for one video.
 */
export const THUMBNAIL_DA = {
  width: 1280,
  height: 720,
  // Seam: the channel signature — the one element still legible at postage-stamp size.
  seamX: 576,
  seamW: 10,
  // Scrim: horizontal gradient, transparent at the seam -> near-opaque at 760, held to the edge.
  // Drawn as N stacked drawbox strips: `geq` isn't in every ffmpeg build, `drawbox` always is.
  scrimFrom: 576,
  scrimTo: 760,
  scrimColor: "0x05070C",
  scrimAlpha: 0.92,
  scrimSteps: 23,
  // Headline: LEFT-aligned on a fixed x so every thumbnail starts at the same optical point.
  textX: 632,
  textMaxWidth: 600,
  fontMax: 112,
  fontMin: 96, // below this we do NOT shrink — the line gets rewritten (playbook §6)
  fontStep: 8,
  lineGap: 144, // between the two cap-tops
  blockCenterY: 360,
  // Fixed marks. Nothing below deadZoneY (progress bar + duration badge).
  markX: 40,
  markY: 40,
  markH: 36,
  logoRightMargin: 40,
  logoY: 40,
  logoH: 52,
  deadZoneY: 576,
} as const;

/** ffmpeg drawtext escaping (backslash, quote, colon, percent are all special). */
function escDrawtext(t: string): string {
  return t
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "’")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
}

/** `#00C8FF` / `00C8FF` -> `0x00C8FF`; passes through names like `white`. */
function toFFColor(c: string): string {
  const hex = c.replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(hex) ? `0x${hex.toUpperCase()}` : c;
}

/**
 * Burn the locked art direction onto the generated thumbnail image.
 *
 * Composition (playbook §2): full-bleed image -> right scrim -> cyan seam -> two left-aligned
 * headline lines (shared auto-fitted size) -> channel mark top-left -> tool logo top-right.
 *
 * The auto-fit is computed HERE, from the font's own metrics, because `drawtext` cannot measure
 * a string and shrink itself. Both lines always share one size: two headlines at different
 * sizes would break the series, which is the entire point of the locked DA.
 *
 * Output is JPEG (q≈92): a photoreal 1280x720 PNG routinely exceeds YouTube's 2MB limit.
 * Returns the chosen size and whether a line still overflowed at the floor (caller warns).
 */
export function thumbnailOverlay(opts: {
  image: string;
  out: string;
  lines: string[];
  accent?: string; // brand accent — default neon blue (channel style.md)
  logo?: string | null; // real PNG from the vendor press kit — NEVER an AI-drawn logo
  channelMark?: string | null; // channel wordmark; absent = slot left empty, render still valid
  cwd?: string;
}): { fontSize: number; overflow: boolean } {
  const { image, out, lines, accent = "#00C8FF", logo, channelMark, cwd } = opts;
  const D = THUMBNAIL_DA;
  const fontAbs = resolveFontFile(out, cwd);
  const fontPrefix = fontAbs ? `fontfile='${fontAbs.rel}':` : "";

  const text = lines.slice(0, 2).map((l) => l.toUpperCase());
  let fontSize: number = D.fontMax;
  let overflow = false;
  let capHeightEm = 0.79; // Impact fallback if the font can't be parsed
  let ascentEm = 1.0;
  if (fontAbs) {
    try {
      const m = readFontMetrics(fontAbs.abs);
      capHeightEm = m.capHeightEm;
      ascentEm = m.ascentEm;
      const fit = fitFontSize(m, text, D.textMaxWidth, { max: D.fontMax, min: D.fontMin, step: D.fontStep });
      fontSize = fit.size;
      overflow = fit.overflow;
    } catch {
      /* metrics unreadable -> nominal size; the render still succeeds */
    }
  }

  // Vertical placement: the visible block (cap top of line 1 -> cap bottom of line 2) is
  // centred on blockCenterY.
  // CALIBRATED, not assumed: ffmpeg's drawtext positions `y` at the top of the actual glyph
  // ink, not at the font's ascent line. Measured on a real render — y=216 produced ink starting
  // at exactly row 216, where an ascent-based origin would have put it 22px lower. ALL-CAPS text
  // has nothing above the cap line, so no offset is applied. If a future ffmpeg changes this,
  // the headline drifts vertically as a block — visible immediately on one test render.
  const capH = capHeightEm * fontSize;
  const capTop1 = D.blockCenterY - (D.lineGap + capH) / 2;
  const yOf = (i: number): number => Math.round(capTop1 + i * D.lineGap);
  void ascentEm; // kept for the fallback path below; drawtext needs no ascent correction

  const filters: string[] = [
    `scale=${D.width}:${D.height}:force_original_aspect_ratio=increase`,
    `crop=${D.width}:${D.height}`,
  ];

  // Scrim gradient, then the solid tail. Strips must TILE, never overlap: an overlapped column
  // gets the darkening applied twice and the ramp stops being linear (measured, not theoretical).
  const stripW = (D.scrimTo - D.scrimFrom) / D.scrimSteps;
  for (let i = 0; i < D.scrimSteps; i++) {
    const a = (D.scrimAlpha * (i + 0.5)) / D.scrimSteps;
    const x = Math.round(D.scrimFrom + i * stripW);
    const w = Math.round(D.scrimFrom + (i + 1) * stripW) - x;
    if (w <= 0) continue;
    filters.push(`drawbox=x=${x}:y=0:w=${w}:h=${D.height}:color=${D.scrimColor}@${a.toFixed(3)}:t=fill`);
  }
  filters.push(
    `drawbox=x=${D.scrimTo}:y=0:w=${D.width - D.scrimTo}:h=${D.height}:color=${D.scrimColor}@${D.scrimAlpha}:t=fill`,
  );

  // Seam.
  filters.push(`drawbox=x=${D.seamX}:y=0:w=${D.seamW}:h=${D.height}:color=${toFFColor("#00C8FF")}@1:t=fill`);

  // Headline — line 1 white, line 2 accent.
  text.forEach((l, i) => {
    const color = i === 0 ? "white" : toFFColor(accent);
    filters.push(
      `drawtext=${fontPrefix}text='${escDrawtext(l)}':fontsize=${fontSize}:fontcolor=${color}:` +
        `borderw=8:bordercolor=black@0.9:x=${D.textX}:y=${yOf(i)}`,
    );
  });

  // Marks need a second input each -> filter_complex only when a file actually exists.
  const marks: Array<{ file: string; expr: string }> = [];
  if (channelMark && existsSync(channelMark)) {
    marks.push({ file: channelMark, expr: `overlay=${D.markX}:${D.markY}` });
  }
  if (logo && existsSync(logo)) {
    marks.push({ file: logo, expr: `overlay=W-w-${D.logoRightMargin}:${D.logoY}` });
  }

  const args: string[] = ["-i", image];
  if (marks.length === 0) {
    args.push("-vf", filters.join(","));
  } else {
    const parts: string[] = [];
    marks.forEach((m, i) => {
      args.push("-i", m.file);
      // Scale each mark to its locked height, preserving aspect ratio.
      const h = i === 0 && channelMark && existsSync(channelMark) ? D.markH : D.logoH;
      parts.push(`[${i + 1}:v]scale=-1:${h}[m${i}]`);
    });
    let chain = `[0:v]${filters.join(",")}[base]`;
    let cur = "base";
    marks.forEach((m, i) => {
      const next = i === marks.length - 1 ? "out" : `s${i}`;
      chain += `;[${cur}][m${i}]${m.expr}[${next}]`;
      cur = next;
    });
    args.push("-filter_complex", `${parts.join(";")};${chain}`, "-map", "[out]");
  }
  args.push("-frames:v", "1", "-update", "1", "-q:v", "3", out);
  run(args, cwd);
  return { fontSize, overflow };
}

/** Render one still image into a Ken Burns motion clip (video only, no audio). */
export function kenBurnsClip(opts: {
  image: string;
  out: string;
  durationSec: number;
  motion: Motion;
  textOverlay?: string | null;
  ctaBand?: CtaBand | null;
  width?: number;
  height?: number;
  fps?: number;
  cwd?: string;
}): void {
  const { image, out, durationSec, motion, textOverlay, ctaBand, width = 1920, height = 1080, fps = 30, cwd } = opts;
  const frames = Math.max(2, Math.round(durationSec * fps));
  // Amplitude du zoom. 1,14 convient à une image générée ; sur une capture d'écran, le même
  // mouvement agrandit du texte déjà à sa résolution native et le rend flou et laid — constaté
  // au premier rendu. Les scènes de contenu d'écran doivent être en motion "static".
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
    const font = fontFilePrefix(out, cwd);
    filters.push(
      `drawtext=${font}text='${escDrawtext(textOverlay)}':fontsize=84:fontcolor=white:borderw=5:bordercolor=black@0.85:x=(w-text_w)/2:y=h-260`,
    );
  }
  if (ctaBand) filters.push(...ctaBandFilters(ctaBand, out, height, cwd));
  run(
    ["-i", image, "-vf", filters.join(","), "-r", String(fps), "-c:v", "libx264", "-preset", VIDEO_PRESET, "-crf", VIDEO_CRF, "-an", out],
    cwd,
  );
}

/**
 * Conform a pre-rendered clip (hyperframes) to its scene window: scale/pad to frame, exact
 * duration (last frame held if the source is shorter), same codec params as kenBurnsClip so
 * concatClips' -c copy stays valid. Video only — any composition audio is dropped.
 */
/**
 * BANDEAU D'APPEL À L'ACTION — ajouté le 2026-08-01.
 *
 * Deux fonctions dans un seul objet, et c'est voulu :
 *  1. **Conversion** — l'appel à l'action reste lisible sans le son. Un spectateur qui regarde en
 *     sourdine (le cas majoritaire sur mobile) n'entend pas « le lien est en description ».
 *  2. **Conformité** — la FTC (16 CFR Part 255) et le droit français (L. 121-4, 11°) imposent que
 *     la divulgation d'une rémunération d'affiliation soit faite « clear and conspicuous » et
 *     **dans le même média que la recommandation** : donc À L'ÉCRAN autant qu'à l'audio pour une
 *     vidéo. La ligne 2 du bandeau porte cette divulgation.
 *
 * Le bandeau est dessiné DANS la passe d'encodage existante (conformClip / kenBurnsClip) : pas de
 * génération supplémentaire, donc pas de perte de qualité — le contenu d'écran est déjà le pire cas
 * de x264 et n'a pas besoin d'un ré-encodage de plus.
 */
export interface CtaBand {
  /** L'action, verbe + offre réelle. Reste identique d'une occurrence à l'autre. */
  line1: string;
  /** Levée de risque et/ou divulgation d'affiliation. */
  line2?: string;
  /** Flèche ↓ à droite du bandeau (défaut: affichée). Mettre `false` pour l'enlever. */
  arrow?: boolean;
}

const CTA_BAND = {
  height: 190,
  bg: "#05070C",
  bgAlpha: 0.88,
  rule: "#00C8FF",
  ruleH: 6,
  padX: 90,
  size1: 54,
  size2: 34,
  color1: "white",
  color2: "#9FB3C8",
  arrowSize: 96,
  arrowRight: 190,
} as const;

function ctaBandFilters(band: CtaBand, out: string, height: number, cwd?: string): string[] {
  const font = fontFilePrefix(out, cwd);
  const top = height - CTA_BAND.height;
  const f: string[] = [
    `drawbox=x=0:y=${top}:w=iw:h=${CTA_BAND.height}:color=${toFFColor(CTA_BAND.bg)}@${CTA_BAND.bgAlpha}:t=fill`,
    `drawbox=x=0:y=${top}:w=iw:h=${CTA_BAND.ruleH}:color=${toFFColor(CTA_BAND.rule)}:t=fill`,
    `drawtext=${font}text='${escDrawtext(band.line1)}':fontsize=${CTA_BAND.size1}:fontcolor=${toFFColor(CTA_BAND.color1)}:x=${CTA_BAND.padX}:y=${top + 42}`,
  ];
  if (band.line2) {
    f.push(
      `drawtext=${font}text='${escDrawtext(band.line2)}':fontsize=${CTA_BAND.size2}:fontcolor=${toFFColor(CTA_BAND.color2)}:x=${CTA_BAND.padX}:y=${top + 118}`,
    );
  }
  // Repère directionnel : la description est sous le lecteur en desktop comme en mobile portrait.
  // Aucun effet mesuré — direction probable, coût nul. Omise si aucune police ne porte le glyphe.
  if (band.arrow !== false) {
    const sym = symbolFontPrefix(out, cwd);
    if (sym) {
      f.push(
        `drawtext=${sym}text='↓':fontsize=${CTA_BAND.arrowSize}:fontcolor=${toFFColor(CTA_BAND.rule)}:x=w-${CTA_BAND.arrowRight}:y=${top + 40}`,
      );
    }
  }
  return f;
}

export function conformClip(opts: {
  clip: string;
  out: string;
  durationSec: number;
  width?: number;
  height?: number;
  fps?: number;
  ctaBand?: CtaBand | null;
  cwd?: string;
}): void {
  const { clip, out, durationSec, width = 1920, height = 1080, fps = 30, ctaBand, cwd } = opts;
  const d = durationSec.toFixed(3);
  const filters = [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    `fps=${fps}`,
    `tpad=stop_mode=clone:stop_duration=${d}`,
    `trim=duration=${d}`,
    "setpts=PTS-STARTPTS",
    ...(ctaBand ? ctaBandFilters(ctaBand, out, height, cwd) : []),
    "format=yuv420p",
  ];
  run(
    ["-i", clip, "-vf", filters.join(","), "-r", String(fps), "-c:v", "libx264", "-preset", VIDEO_PRESET, "-crf", VIDEO_CRF, "-an", out],
    cwd,
  );
}

/**
 * Re-encode an arbitrary source clip (a hand-recorded `manual_asset`, any codec/fps/container)
 * into the pipeline's canonical params, WITHOUT touching its duration — the scene window isn't
 * known yet at the images step; `conformClip` fits it later at assembly.
 */
export function normalizeClip(opts: { clip: string; out: string; fps?: number; cwd?: string }): void {
  const { clip, out, fps = 30, cwd } = opts;
  run(
    [
      "-i", clip,
      "-vf", `fps=${fps},format=yuv420p`,
      "-r", String(fps), "-vsync", "cfr",
      "-c:v", "libx264", "-preset", VIDEO_PRESET, "-crf", VIDEO_CRF, "-an",
      out,
    ],
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
    "-c:v", "libx264", "-preset", VIDEO_PRESET, "-crf", VIDEO_CRF,
    "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart",
    out,
  );
  run(args, cwd);
}
