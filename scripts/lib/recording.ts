import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  contextOptions,
  diagnoseCapture,
  hideAutomation,
  hideCookieBanners,
  launchBrowser,
  loadChromium,
  parseViewportSpec,
  probePage,
} from "./capture.js";
import { log } from "./util.js";

/**
 * `source: "screen_recording"` — a PUBLIC page FILMED, not frozen.
 *
 * WHY: field feedback 2026-08-01 — fully AI-generated videos read as "delegated to someone who
 * doesn't know the tool". A cursor that moves, a page that scrolls, a pricing row hovered: that
 * is the cheapest and most legible proof that a human is behind the video. Same Playwright, same
 * local Chrome, same $0 as `screen_capture`.
 *
 * STRICT RULES (identical to capture.ts):
 *  - Public URLs only. NEVER automate a login, credentials or an authenticated flow.
 *  - `click` is restricted to page-local, harmless interactions (see playBeat).
 *  - A blocked page fails LOUDLY — no Cloudflare frame ever reaches the edit.
 */

export type BeatVerb = "settle" | "dwell" | "moveTo" | "scrollTo" | "hover" | "click";

export interface Beat {
  do: BeatVerb;
  ms: number;
  selector?: string;
  x?: number;
  y?: number;
}

export interface RecordingSpec {
  url: string;
  viewport?: string; // "1920x1080" (default)
  cursor?: boolean; // draw the synthetic cursor (default true)
  hideSelectors?: string[];
  beats: Beat[];
  /** planned scene length; the clip is filmed longer and conformed at assembly */
  plannedDurationSec?: number;
}

/** Normalized spec used for idempotence hashing — re-films only when the spec really changes. */
export function recordingHashInput(spec: RecordingSpec): string {
  return JSON.stringify({
    url: spec.url,
    viewport: spec.viewport ?? "1920x1080",
    cursor: spec.cursor !== false,
    hideSelectors: spec.hideSelectors ?? [],
    beats: spec.beats,
  });
}

/** Total scripted time, plus the safety margin (see MARGIN below). */
export function recordingDurationSec(spec: RecordingSpec): number {
  const scripted = spec.beats.reduce((n, b) => n + Math.max(0, b.ms), 0) / 1000;
  const planned = spec.plannedDurationSec ?? scripted;
  // assemble.ts rescales EVERY scene window (factor = audioDur / planEnd) and dumps the residual
  // drift onto the last one — that factor is unknown while filming. Under-filming means
  // conformClip freezes the last frame, i.e. exactly the dead shot the retention rules ban.
  return Math.max(scripted, planned) * 1.3 + 3;
}

const CURSOR_ID = "__factory_cursor__";

/**
 * Synthetic cursor. Playwright's screencast does NOT capture the system pointer, so we draw one.
 * Injected via addInitScript so it survives navigations (an in-page node is destroyed by any
 * reload — including a tab click). Caveat: a <dialog> or fullscreen element lives in the top
 * layer and will paint over any z-index.
 */
function cursorInitScript(id: string): string {
  return `(() => {
    const draw = () => {
      if (document.getElementById(${JSON.stringify(id)})) return;
      const d = document.createElement('div');
      d.id = ${JSON.stringify(id)};
      d.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;pointer-events:none;' +
        'z-index:2147483647;transform:translate(-2px,-2px);will-change:left,top;';
      d.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26">' +
        '<path d="M3 2 L3 20 L8 15.5 L11.5 23 L14.8 21.4 L11.4 14.2 L18 14 Z" ' +
        'fill="#fff" stroke="rgba(0,0,0,.65)" stroke-width="1.4" ' +
        'style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))"/></svg>';
      (document.body || document.documentElement).appendChild(d);
      window.__factoryCursor = d;
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw);
    else draw();
  })()`;
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Move the cursor along a CURVED path with a small overshoot-and-settle at the end.
 *
 * This is the whole trick. A straight, constant-speed move reads as a script instantly; a hand
 * never travels in a straight line and never stops exactly on target the first time. The
 * quadratic Bézier control point is offset perpendicular to the path, its sign alternating
 * between moves so successive gestures don't all bow the same way.
 */
async function moveCursor(
  page: any,
  from: { x: number; y: number },
  to: { x: number; y: number },
  ms: number,
  sign: number,
): Promise<{ x: number; y: number }> {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1 || ms <= 0) return to;

  // Control point: midpoint pushed sideways by 8–14% of the distance.
  const bow = dist * (0.08 + 0.06 * ((Math.abs(Math.round(dx + dy)) % 7) / 7)) * sign;
  const nx = dist ? -dy / dist : 0;
  const ny = dist ? dx / dist : 0;
  const cx = (from.x + to.x) / 2 + nx * bow;
  const cy = (from.y + to.y) / 2 + ny * bow;

  // Overshoot target: 5–8px past the arrival, along the incoming direction.
  const over = 5 + (Math.abs(Math.round(dist)) % 4);
  const ox = to.x + (dist ? (dx / dist) * over : 0);
  const oy = to.y + (dist ? (dy / dist) * over : 0);

  const fps = 60;
  const settleMs = 120;
  const travelMs = Math.max(60, ms - settleMs);
  const steps = Math.max(2, Math.round((travelMs / 1000) * fps));

  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    const mt = 1 - t;
    const x = mt * mt * from.x + 2 * mt * t * cx + t * t * ox;
    const y = mt * mt * from.y + 2 * mt * t * cy + t * t * oy;
    await setCursor(page, x, y);
    await page.waitForTimeout(Math.round(travelMs / steps));
  }
  // Settle back onto the real target.
  const back = 6;
  for (let i = 1; i <= back; i++) {
    const t = i / back;
    await setCursor(page, ox + (to.x - ox) * t, oy + (to.y - oy) * t);
    await page.waitForTimeout(Math.round(settleMs / back));
  }
  return to;
}

/** Move both the drawn cursor and the REAL pointer, so :hover states actually fire. */
async function setCursor(page: any, x: number, y: number): Promise<void> {
  await page
    .evaluate(
      ([px, py, id]: [number, number, string]) => {
        const d = document.getElementById(id);
        if (d) {
          d.style.left = px + "px";
          d.style.top = py + "px";
        }
      },
      [Math.round(x), Math.round(y), CURSOR_ID],
    )
    .catch(() => {});
  await page.mouse.move(Math.round(x), Math.round(y)).catch(() => {});
}

/** Damped scroll: ease-in-out, capped speed, small overshoot correction at the stop. */
async function smoothScrollTo(page: any, targetY: number, ms: number): Promise<number> {
  const startY = (await page.evaluate(() => window.scrollY).catch(() => 0)) as number;
  const dist = targetY - startY;
  if (Math.abs(dist) < 2) return startY;

  // Speed cap: a scroll faster than this reads as a page reload, not as reading.
  const MAX_PX_PER_SEC = 900;
  const needed = (Math.abs(dist) / MAX_PX_PER_SEC) * 1000;
  let dur = ms;
  if (needed > ms) {
    dur = Math.round(needed);
    log("WARN", `recording: scroll de ${Math.round(Math.abs(dist))}px trop long pour ${ms}ms — beat allongé à ${dur}ms (plafond ${MAX_PX_PER_SEC}px/s)`);
  }

  const over = Math.sign(dist) * (3 + (Math.abs(Math.round(dist)) % 4));
  const fps = 60;
  const steps = Math.max(2, Math.round((dur / 1000) * fps));
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    await page.evaluate((y: number) => window.scrollTo(0, y), Math.round(startY + (dist + over) * t)).catch(() => {});
    await page.waitForTimeout(Math.round(dur / steps));
  }
  await page.evaluate((y: number) => window.scrollTo(0, y), Math.round(targetY)).catch(() => {});
  await page.waitForTimeout(90);
  return targetY;
}

/** Viewport-space centre of a selector, or null if it isn't there. */
async function centerOf(page: any, selector: string): Promise<{ x: number; y: number } | null> {
  try {
    const el = page.locator(selector).first();
    const box = await el.boundingBox({ timeout: 4000 });
    if (!box) return null;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  } catch {
    return null;
  }
}

/** Document-space top of a selector, or null. */
async function documentTopOf(page: any, selector: string): Promise<number | null> {
  try {
    return (await page.evaluate((s: string) => {
      const el = document.querySelector(s);
      if (!el) return null;
      return el.getBoundingClientRect().top + window.scrollY;
    }, selector)) as number | null;
  } catch {
    return null;
  }
}

export async function screenRecording(spec: RecordingSpec, outFile: string): Promise<void> {
  if (!/^https?:\/\//i.test(spec.url)) {
    throw new Error(`recording: URL non publique ou invalide "${spec.url}" — http(s) uniquement`);
  }
  if (!spec.beats?.length) throw new Error(`recording: ${spec.url} sans beats`);

  const chromium = await loadChromium();
  const viewport = parseViewportSpec(spec.viewport);
  const withCursor = spec.cursor !== false;
  const tmpDir = join(process.cwd(), ".recording-tmp", `${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  const browser = await launchBrowser(chromium);
  let webm: string | null = null;
  let headOffsetSec = 0;

  try {
    // Playwright has NO start/stop recording API — recordVideo covers the WHOLE context life.
    // Everything before the beats (blank page, load, cookie-banner flash, probe) IS filmed, so
    // we timestamp the start of the beats and trim that head off with ffmpeg -ss below.
    const t0 = Date.now();
    const context = await browser.newContext({
      ...contextOptions(viewport),
      recordVideo: { dir: tmpDir, size: { width: viewport.width, height: viewport.height } },
    });
    await hideAutomation(context);
    if (withCursor) await context.addInitScript(cursorInitScript(CURSOR_ID));

    const page = await context.newPage();
    let status = 0;
    try {
      const resp = await page.goto(spec.url, { waitUntil: "networkidle", timeout: 60_000 });
      status = resp?.status() ?? 0;
    } catch {
      const resp = await page.goto(spec.url, { waitUntil: "load", timeout: 60_000 });
      status = resp?.status() ?? 0;
    }

    await hideCookieBanners(page, spec.hideSelectors);
    // Sites that scroll-jack (Lenis, ScrollSmoother, CSS scroll-behavior) fight the script.
    await page
      .addStyleTag({ content: "html,body{scroll-behavior:auto !important;}" })
      .catch(() => {});
    await page.waitForTimeout(1200);

    // Same anti-block diagnosis as screen_capture — a blocked page must never reach the edit.
    const reason = diagnoseCapture(await probePage(page, status));
    if (reason) {
      await context.close().catch(() => {});
      throw new Error(
        `recording: ${spec.url} inexploitable — ${reason}. Ce site bloque la capture automatique. ` +
          `Solution : enregistrer l'écran à la main et passer la scène en source "manual_asset" ` +
          `(fichier dans assets/captures/<sceneId>.mp4).`,
      );
    }

    let pos = { x: viewport.width * 0.5, y: viewport.height * 0.62 };
    if (withCursor) await setCursor(page, pos.x, pos.y);

    const beatsStart = Date.now();
    headOffsetSec = (beatsStart - t0) / 1000;

    let sign = 1;
    for (const b of spec.beats) {
      const ms = Math.max(0, b.ms ?? 0);
      switch (b.do) {
        case "settle":
        case "dwell":
          await page.waitForTimeout(ms);
          break;
        case "scrollTo": {
          let y = b.y;
          if (b.selector) {
            const top = await documentTopOf(page, b.selector);
            if (top == null) {
              log("WARN", `recording: sélecteur introuvable "${b.selector}" — beat scrollTo ignoré`);
              await page.waitForTimeout(ms);
              break;
            }
            y = Math.max(0, top - viewport.height * 0.25);
          }
          if (y == null) { await page.waitForTimeout(ms); break; }
          await smoothScrollTo(page, y, ms);
          break;
        }
        case "moveTo":
        case "hover": {
          let target: { x: number; y: number } | null = null;
          if (b.selector) target = await centerOf(page, b.selector);
          else if (b.x != null && b.y != null) target = { x: b.x, y: b.y };
          if (!target) {
            log("WARN", `recording: cible introuvable pour ${b.do} (${b.selector ?? `${b.x},${b.y}`}) — beat en attente`);
            await page.waitForTimeout(ms);
            break;
          }
          const moveMs = b.do === "hover" ? Math.round(ms * 0.55) : ms;
          pos = await moveCursor(page, pos, target, moveMs, sign);
          sign = -sign;
          if (b.do === "hover") await page.waitForTimeout(ms - moveMs);
          break;
        }
        case "click": {
          // Page-local, harmless interactions ONLY (tab, accordion, pricing toggle, carousel).
          // Never a submit, a signup, a checkout, or an off-domain navigation.
          if (!b.selector) { await page.waitForTimeout(ms); break; }
          const target = await centerOf(page, b.selector);
          if (!target) {
            log("WARN", `recording: sélecteur introuvable "${b.selector}" — click ignoré`);
            await page.waitForTimeout(ms);
            break;
          }
          const moveMs = Math.round(ms * 0.6);
          pos = await moveCursor(page, pos, target, moveMs, sign);
          sign = -sign;
          await page.mouse.click(Math.round(target.x), Math.round(target.y)).catch(() => {});
          await page.waitForTimeout(Math.max(0, ms - moveMs));
          break;
        }
      }
    }

    // Keep filming past the scripted beats: the final scene window is only known at assembly.
    const minTotalMs = recordingDurationSec(spec) * 1000;
    const elapsed = Date.now() - beatsStart;
    if (elapsed < minTotalMs) await page.waitForTimeout(Math.round(minTotalMs - elapsed));

    // The video is only finalized on context close, and its name is random — read the path after.
    const video = page.video();
    await context.close();
    if (video) webm = await video.path().catch(() => null);
    if (!webm) {
      const found = readdirSync(tmpDir).find((f) => f.endsWith(".webm"));
      webm = found ? join(tmpDir, found) : null;
    }
    if (!webm || !existsSync(webm)) throw new Error(`recording: aucune vidéo produite pour ${spec.url}`);

    // webm -> mp4, head trimmed, CFR forced (the screencast is variable-frame-rate and the
    // container duration is unreliable). Same codec params as kenBurnsClip so `concat -c copy`
    // stays valid downstream; conformClip then fits it to the real scene window.
    execFileSync(
      "ffmpeg",
      [
        "-hide_banner", "-loglevel", "error", "-y",
        "-ss", headOffsetSec.toFixed(3),
        "-i", webm,
        "-vf", "fps=30,format=yuv420p",
        "-r", "30", "-vsync", "cfr",
        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-an",
        outFile,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    log("INFO", `recording: ${spec.url} -> ${outFile} (tête coupée ${headOffsetSec.toFixed(1)}s)`);
  } finally {
    await browser.close().catch(() => {});
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
