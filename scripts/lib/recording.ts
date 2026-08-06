import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  contextOptions,
  launchAuthedContext,
  RECORD_PROFILE_DIR,
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
  /**
   * Where the page ALREADY IS when filming starts — applied during the pre-roll, so it is cut
   * off by the head trim and never appears on screen.
   *
   * WHY THIS EXISTS (retour terrain 2026-08-01 : « il ne faut pas scroller en permanence »).
   * Without it, every scene about a section 4 000 px down had to OPEN with a long transit: five
   * seconds of scrolling before reaching the thing the voice is talking about. On a scene window
   * of eight seconds that is most of the shot spent travelling, and it reads as a machine
   * seeking, not as someone reading. With `startAt`, the scene opens ON the section, and the
   * only scroll left on camera is the short one a real reader would do next.
   */
  startAt?: { selector?: string; y?: number };
  /** Mettre en pause les animations CSS infinies avant de filmer (défaut: true). Voir §anti-saccade. */
  freezeLoops?: boolean;
  /**
   * Filmer DANS la session connectée du profil d'enregistrement (`.chrome-record`).
   * Voir lib/capture.ts / RECORD_PROFILE_DIR. Interdit tout beat `click` — voir plus bas.
   */
  auth?: boolean;
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
    startAt: spec.startAt ?? null,
    freezeLoops: spec.freezeLoops !== false,
    auth: spec.auth === true,
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

/** Deterministic jitter in [0,1) — same spec films the same way twice, unlike Math.random. */
function lcg(seed: number): () => number {
  let s = (Math.abs(Math.round(seed)) % 2147483646) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Scroll the way a hand does: in FLICKS, not in one glide.
 *
 * WHY THIS WAS REWRITTEN (retour terrain 2026-08-01 : « le scroll et le mouvement n'ont pas
 * l'air naturel »). The first version animated the whole distance as a single ease-in-out sweep
 * at up to 900 px/s. It is smooth, it is continuous, and it is exactly what no human produces:
 * a mouse wheel moves the page in discrete notches, three or four in quick succession, then the
 * hand stops while the eye reads, then another burst. The giveaway is not the speed, it is the
 * ABSENCE OF PAUSES — a constant-velocity page is as robotic as a constant-velocity cursor.
 *
 * So: bursts of ~180-420 px, each decelerating (ease-out, like a wheel spinning down), separated
 * by short pauses, with a longer read-pause every third or fourth burst. Spare time left over
 * from the beat budget goes into those pauses rather than into a slower glide — stillness is the
 * thing that reads as human, so it is what we buy with the extra milliseconds.
 */
async function humanScrollTo(page: any, targetY: number, ms: number): Promise<number> {
  const startY = (await page.evaluate(() => window.scrollY).catch(() => 0)) as number;
  const dist = targetY - startY;
  if (Math.abs(dist) < 8) {
    await page.waitForTimeout(ms);
    return startY;
  }

  const dir = Math.sign(dist);
  const total = Math.abs(dist);
  const rnd = lcg(total * 31 + Math.round(startY));

  // Plan the bursts first, so we know how much time the movement itself needs.
  const bursts: number[] = [];
  let planned = 0;
  while (planned < total) {
    const step = Math.min(total - planned, 180 + Math.round(rnd() * 240));
    bursts.push(step);
    planned += step;
  }
  // A burst decelerates over ~1.6 px/ms; below 130 ms it reads as a jump cut.
  const burstMs = bursts.map((d) => Math.max(130, Math.round(d / 1.6)));
  const moveTime = burstMs.reduce((a, b) => a + b, 0);
  const minPause = 70 * (bursts.length - 1);

  let budget = ms;
  if (moveTime + minPause > ms) {
    budget = moveTime + minPause;
    log("WARN", `recording: scroll de ${Math.round(total)}px impossible en ${ms}ms sans accélérer de façon non naturelle — beat allongé à ${budget}ms`);
  }
  // Everything not spent moving is spent NOT moving. That is the point.
  const spare = budget - moveTime;
  const gaps = Math.max(1, bursts.length - 1);

  let y = startY;
  for (let i = 0; i < bursts.length; i++) {
    const from = y;
    const to = y + dir * bursts[i];
    const steps = Math.max(3, Math.round(burstMs[i] / 16));
    for (let k = 1; k <= steps; k++) {
      const t = 1 - Math.pow(1 - k / steps, 3); // ease-out: a wheel spinning down
      await page.evaluate((v: number) => window.scrollTo(0, v), Math.round(from + (to - from) * t)).catch(() => {});
      await page.waitForTimeout(Math.round(burstMs[i] / steps));
    }
    y = to;
    if (i < bursts.length - 1) {
      // Every 3rd-4th gap is a read-pause; the rest are the short hesitations between notches.
      const isRead = i % (3 + Math.round(rnd())) === 2;
      const share = (spare / gaps) * (isRead ? 2.1 : 0.55);
      await page.waitForTimeout(Math.max(70, Math.round(share + rnd() * 60)));
    }
  }
  // Land exactly, then let the eye settle before the next beat starts.
  await page.evaluate((v: number) => window.scrollTo(0, v), Math.round(targetY)).catch(() => {});
  await page.waitForTimeout(120);
  return targetY;
}

/**
 * Jump the page to its starting position BEFORE filming begins (see RecordingSpec.startAt).
 * Descends in a few big hops so lazy-loaded images and reveal-on-scroll sections have fired by
 * the time the first frame is kept — landing cold on a deep offset films a half-built page.
 */
async function preScroll(page: any, targetY: number): Promise<void> {
  const hops = Math.min(6, Math.max(1, Math.ceil(targetY / 1400)));
  for (let i = 1; i <= hops; i++) {
    await page.evaluate((v: number) => window.scrollTo(0, v), Math.round((targetY * i) / hops)).catch(() => {});
    await page.waitForTimeout(220);
  }
  await page.evaluate((v: number) => window.scrollTo(0, v), Math.round(targetY)).catch(() => {});
  await page.waitForTimeout(450);
}

/**
 * GEL DES ANIMATIONS EN BOUCLE — ajouté le 2026-08-01 après signalement d'un artefact visuel.
 *
 * Le screencast de Playwright sort en cadence VARIABLE ; on le ramène à 30 images/seconde fixes.
 * Une animation CSS qui tourne en continu — bandeau de logos clients, pastille qui pulse, dégradé
 * qui défile — n'a aucune raison d'être en phase avec 30 Hz : le rééchantillonnage produit un
 * saccadement, voire un déchirement, que l'œil lit comme un défaut d'encodage. Et le crf 16 ne le
 * corrige pas, puisque le défaut est dans la source, pas dans la compression.
 *
 * On met en pause UNIQUEMENT les animations déclarées infinies. Les animations d'apparition au
 * scroll (une seule itération) continuent de jouer : ce sont elles qui font vivre la page, et
 * elles se terminent, donc elles ne saccadent pas.
 *
 * ⚠️ Code navigateur passé en CHAÎNE : tsx/esbuild réécrit les fonctions nommées avec un helper
 * `__name` inexistant dans la page (voir le même piège dans lib/recon.ts).
 */
const FREEZE_LOOPS_SRC = `(() => {
  let n = 0;
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.animationIterationCount && cs.animationIterationCount.split(',').some(v => v.trim() === 'infinite')) {
      el.style.animationPlayState = 'paused';
      n++;
    }
  }
  return n;
})()`;

async function freezeLoopingAnimations(page: any): Promise<void> {
  try {
    const n = (await page.evaluate(FREEZE_LOOPS_SRC)) as number;
    if (n > 0) log("INFO", `recording: ${n} animation(s) en boucle mises en pause (anti-saccade)`);
  } catch {
    /* page hostile ou CSP stricte : on filme quand même */
  }
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
  /**
   * LECTURE SEULE DANS UN COMPTE RÉEL — règle codée, pas recommandée.
   *
   * Sur un site vitrine, « interaction inoffensive » a un sens : un onglet, un accordéon. Dans un
   * dashboard, la même notion ne tient plus — un clic supprime un bot, lance un abonnement, vide
   * une liste. On ne peut pas énumérer à l'avance ce qui est sûr, donc on interdit la catégorie.
   */
  if (spec.auth && spec.beats.some((b) => b.do === "click")) {
    throw new Error(
      `recording: ${spec.url} — un beat "click" est interdit dans une scène authentifiée.\n` +
      `        Dans un compte réel, aucun clic ne peut être garanti inoffensif.\n` +
      `        Utiliser scrollTo / moveTo / hover, ou filmer la page publique équivalente.`,
    );
  }

  const chromium = await loadChromium();
  const viewport = parseViewportSpec(spec.viewport);
  const withCursor = spec.cursor !== false;
  const tmpDir = join(process.cwd(), ".recording-tmp", `${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  /**
   * En mode authentifié, le contexte persistant EST le navigateur : lancer en plus un Chrome
   * jetable ouvrirait une seconde fenêtre pour rien (et elle serait filmée par l'utilisateur qui
   * regarde). On ne lance donc `launchBrowser` que dans le cas public.
   */
  const browser = spec.auth ? null : await launchBrowser(chromium);
  let context: any = null;
  let webm: string | null = null;
  let headOffsetSec = 0;

  try {
    // Playwright has NO start/stop recording API — recordVideo covers the WHOLE context life.
    // Everything before the beats (blank page, load, cookie-banner flash, probe) IS filmed, so
    // we timestamp the start of the beats and trim that head off with ffmpeg -ss below.
    const t0 = Date.now();
    const ctxOpts = {
      ...contextOptions(viewport),
      recordVideo: { dir: tmpDir, size: { width: viewport.width, height: viewport.height } },
    };
    // Un profil persistant EST son propre contexte : pas de newContext() par-dessus.
    context = spec.auth
      ? await launchAuthedContext(chromium, join(process.cwd(), RECORD_PROFILE_DIR), ctxOpts)
      : await browser!.newContext(ctxOpts);
    if (spec.auth) log("INFO", `recording: session authentifiée — profil ${RECORD_PROFILE_DIR} (lecture seule)`);
    await hideAutomation(context);
    if (withCursor) await context.addInitScript(cursorInitScript(CURSOR_ID));

    const page = spec.auth ? (context.pages()[0] ?? await context.newPage()) : await context.newPage();
    let status = 0;
    try {
      const resp = await page.goto(spec.url, { waitUntil: "networkidle", timeout: 60_000 });
      status = resp?.status() ?? 0;
    } catch {
      const resp = await page.goto(spec.url, { waitUntil: "load", timeout: 60_000 });
      status = resp?.status() ?? 0;
    }

    await hideCookieBanners(page, spec.hideSelectors);
    if (spec.freezeLoops !== false) await freezeLoopingAnimations(page);
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

    /**
     * PAGE TRADUITE — arrêt dur.
     *
     * Google Translate marque la racine du document (`translated-ltr` / `translated-rtl`) et
     * réécrit le texte en place. Une capture traduite est inutilisable et ne se voit qu'en lisant
     * l'image : le clip est net, cadré, à la bonne durée, et raconte autre chose que le produit.
     * Les flags de lancement l'empêchent ; ceci vérifie qu'ils ont bien tenu.
     */
    const translated = await page.evaluate(() => {
      const c = document.documentElement.className || "";
      return /\btranslated-(ltr|rtl)\b/.test(c) || !!document.querySelector("#goog-gt-tt, .goog-te-banner-frame");
    });
    if (translated) {
      throw new Error(
        `recording: ${spec.url} — la page a été TRADUITE automatiquement par le navigateur.\n` +
          `        Le texte filmé ne serait pas celui du produit.\n` +
          `        Dans le Chrome de record-profile.bat : Paramètres > Langues > décocher « Proposer de traduire ».`,
      );
    }

    /**
     * BANDES NOIRES — contrôle, parce que le défaut est invisible au code.
     *
     * L'enregistreur préserve le rapport largeur/hauteur : si la zone de page réelle n'a pas le
     * même rapport que la taille demandée, il complète en noir au lieu d'échouer. Le mp4 sort
     * « valide », aux bonnes dimensions, avec des bandes — et on ne s'en aperçoit qu'au
     * visionnage. On mesure donc le viewport réel et on le dit.
     */
    const real = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    const wantRatio = viewport.width / viewport.height;
    const realRatio = real.w / real.h;
    if (Math.abs(realRatio - wantRatio) / wantRatio > 0.01) {
      log(
        "WARN",
        `recording: cadre réel ${real.w}x${real.h} (rapport ${realRatio.toFixed(3)}) ≠ demandé ` +
          `${viewport.width}x${viewport.height} (${wantRatio.toFixed(3)}) — le clip aura des BANDES NOIRES. ` +
          (spec.auth
            ? `Cause probable : la fenêtre n'est pas en plein écran, ou la mise à l'échelle Windows n'est pas à 100 %.`
            : `Cause probable : viewport trop grand pour l'écran.`),
      );
    }

    let pos = { x: viewport.width * 0.5, y: viewport.height * 0.62 };
    if (withCursor) await setCursor(page, pos.x, pos.y);

    // startAt — position the page OFF CAMERA, before the head-trim boundary below.
    if (spec.startAt) {
      let y = spec.startAt.y;
      if (spec.startAt.selector) {
        const top = await documentTopOf(page, spec.startAt.selector);
        if (top == null) {
          log("WARN", `recording: startAt "${spec.startAt.selector}" introuvable — la scène s'ouvrira en haut de page`);
        } else {
          y = Math.max(0, top - viewport.height * 0.22);
        }
      }
      if (y != null) await preScroll(page, y);
    }

    const beatsStart = Date.now();
    headOffsetSec = (beatsStart - t0) / 1000;

    let sign = 1;
    for (const b of spec.beats) {
      const ms = Math.max(0, b.ms ?? 0);
      switch (b.do) {
        case "settle":
        case "dwell": {
          /**
           * A cursor frozen to the pixel for four seconds is its own tell — a hand resting on a
           * mouse drifts a few pixels. On long holds only: nudge once, slowly, mid-dwell. Short
           * holds stay perfectly still, because that is also what hands do.
           */
          if (withCursor && ms > 2200) {
            const head = Math.round(ms * 0.45);
            await page.waitForTimeout(head);
            const drift = { x: pos.x + (sign > 0 ? 11 : -14), y: pos.y + 7 };
            pos = await moveCursor(page, pos, drift, 520, sign);
            await page.waitForTimeout(Math.max(0, ms - head - 520));
          } else {
            await page.waitForTimeout(ms);
          }
          break;
        }
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
          await humanScrollTo(page, y, ms);
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
    /**
     * Le contexte persistant n'appartient à aucun `browser` : si on sort par une exception avant
     * le close nominal, la fenêtre Chrome resterait ouverte ET garderait le verrou sur
     * .chrome-record — le rendu suivant échouerait sans raison lisible. On ferme les deux, dans
     * l'ordre, en ignorant un double-close déjà effectué.
     */
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
