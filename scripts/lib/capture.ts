import { log } from "./util.js";

/**
 * Screen capture of a PUBLIC web page via Playwright + local Chromium.
 * STRICT RULES:
 *  - Public URLs only. NEVER automate logins, credentials or authenticated flows
 *    (logged-in views are `manual_asset`: a file the human drops in assets/captures/).
 *  - No third-party screenshot service — Playwright drives a local browser, direct.
 *  - Playwright is a lazy dynamic import: the pipeline runs without it as long as
 *    no scene uses `screen_capture`.
 *
 * ANTI-BLOCAGE (durci) :
 *  - On ressemble à un vrai Chrome : channel "chrome" si dispo, user-agent réaliste,
 *    locale/timezone cohérentes, flag d'automatisation masqué (navigator.webdriver).
 *  - On attend le rendu JS (networkidle) + un délai de stabilisation, et on ferme
 *    les bandeaux cookies courants.
 *  - GARDE-FOU : si la page est une page de blocage (Cloudflare/WAF/captcha) ou une
 *    frame vide (rien de rendu), on N'ÉCRIT PAS l'image et on échoue clairement, en
 *    renvoyant vers la solution manual_asset. Aucune frame cassée ne part au montage.
 *  - On NE fait PAS de proxy résidentiel / solveur de captcha ici : pour UNE capture
 *    de page publique, c'est hors périmètre. Les sites vraiment blindés (Cloudflare
 *    actif) -> manual_asset (capture déposée à la main).
 */
export interface CaptureSpec {
  url: string;
  viewport?: string; // "1920x1080" (default)
  fullPage?: boolean; // default false
  selector?: string; // capture one element instead of the viewport
  hideSelectors?: string[]; // e.g. cookie banners (en plus des sélecteurs génériques)
  delayMs?: number; // settle time after load (défaut 1800ms)
  retries?: number; // tentatives avant échec (défaut 2)
}

/** Normalized spec used for idempotence hashing (delayMs/retries excluded by design). */
export function captureHashInput(spec: CaptureSpec): string {
  return JSON.stringify({
    url: spec.url,
    viewport: spec.viewport ?? "1920x1080",
    fullPage: spec.fullPage ?? false,
    selector: spec.selector ?? null,
    hideSelectors: spec.hideSelectors ?? [],
  });
}

function parseViewport(v?: string): { width: number; height: number } {
  const m = /^(\d+)x(\d+)$/.exec((v ?? "1920x1080").trim());
  if (!m) throw new Error(`capture: viewport invalide "${v}" (attendu "1920x1080")`);
  return { width: parseInt(m[1], 10), height: parseInt(m[2], 10) };
}

// User-agent d'un Chrome récent sur Windows — cohérent avec channel "chrome".
const REALISTIC_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Bandeaux cookies / consentement courants, masqués avant le screenshot.
const COMMON_COOKIE_SELECTORS = [
  "#onetrust-banner-sdk",
  "#onetrust-consent-sdk",
  ".ot-sdk-container",
  "#cookie-banner",
  "#cookie-consent",
  '[id*="cookie"][class*="banner"]',
  '[class*="cookie-consent"]',
  '[class*="cookie-banner"]',
  '[aria-label*="cookie" i]',
  ".cky-consent-container",
  "#CybotCookiebotDialog",
];

// Signatures texte d'une page de blocage / challenge anti-bot.
const BLOCK_PATTERNS = [
  /you have been blocked/i,
  /attention required/i,
  /cloudflare/i,
  /just a moment/i,
  /checking your browser/i,
  /verify you are (a )?human/i,
  /are you a robot/i,
  /access denied/i,
  /request blocked/i,
  /captcha/i,
  /ddos protection/i,
  /unusual traffic/i,
];

// Statuts HTTP qui trahissent un blocage / rate-limit.
const BLOCK_STATUSES = new Set([401, 403, 405, 429, 451, 503]);

interface PageProbe {
  status: number;
  title: string;
  text: string; // body innerText (tronqué)
  contentScore: number; // # d'éléments "porteurs" visibles (texte, img, svg, bg-image)
}

/**
 * Décide si la capture est exploitable. Renvoie une raison d'échec, ou null si OK.
 */
function diagnoseCapture(p: PageProbe): string | null {
  if (BLOCK_STATUSES.has(p.status)) {
    return `page de blocage (HTTP ${p.status})`;
  }
  const haystack = `${p.title}\n${p.text}`;
  const hit = BLOCK_PATTERNS.find((re) => re.test(haystack));
  if (hit) {
    return `page de blocage / challenge anti-bot détecté (motif: ${hit.source})`;
  }
  // Frame vide : quasi aucun texte ET quasi aucun élément rendu (SPA pas peinte, page blanche).
  if (p.text.trim().length < 40 && p.contentScore < 3) {
    return `frame vide — la page ne s'est pas rendue (texte=${p.text.trim().length} chars, éléments=${p.contentScore})`;
  }
  return null;
}

export async function screenCapture(spec: CaptureSpec, outFile: string): Promise<void> {
  if (!/^https?:\/\//i.test(spec.url)) {
    throw new Error(`capture: URL non publique ou invalide "${spec.url}" — http(s) uniquement`);
  }
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "capture: playwright introuvable — installe-le en local : npm i playwright && npx playwright install chromium",
    );
  }
  const viewport = parseViewport(spec.viewport);
  const delayMs = spec.delayMs ?? 1800;
  const retries = Math.max(0, spec.retries ?? 2);

  // Args qui réduisent les signaux d'automatisation.
  const launchArgs = [
    "--disable-blink-features=AutomationControlled",
    "--no-first-run",
    "--no-default-browser-check",
  ];

  // On privilégie le vrai Chrome (channel) — meilleur fingerprint que le Chromium bundlé.
  // Fallback automatique sur le Chromium de Playwright si Chrome n'est pas installé.
  async function launch() {
    try {
      return await chromium.launch({ channel: "chrome", headless: true, args: launchArgs });
    } catch {
      return await chromium.launch({ headless: true, args: launchArgs });
    }
  }

  const browser = await launch();
  try {
    let lastReason = "raison inconnue";
    for (let attempt = 0; attempt <= retries; attempt++) {
      const context = await browser.newContext({
        viewport,
        userAgent: REALISTIC_UA,
        locale: "en-US",
        timezoneId: "America/New_York",
        deviceScaleFactor: 1,
        extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
      });
      // Masque navigator.webdriver et quelques tells avant tout script de la page.
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
        // @ts-ignore
        window.chrome = window.chrome || { runtime: {} };
        Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
        Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      });
      const page = await context.newPage();
      try {
        let status = 0;
        try {
          const resp = await page.goto(spec.url, { waitUntil: "networkidle", timeout: 60_000 });
          status = resp?.status() ?? 0;
        } catch {
          // networkidle peut timeouter sur des pages qui pollent en continu : on retombe sur load.
          const resp = await page.goto(spec.url, { waitUntil: "load", timeout: 60_000 });
          status = resp?.status() ?? 0;
        }

        // Masque bandeaux cookies (génériques + fournis).
        const selectors = [...COMMON_COOKIE_SELECTORS, ...(spec.hideSelectors ?? [])];
        if (selectors.length) {
          await page.addStyleTag({
            content: selectors.map((s) => `${s} { display: none !important; }`).join("\n"),
          }).catch(() => {});
        }

        // Stabilisation : délai + petit scroll pour déclencher le lazy-load, puis retour en haut.
        await page.waitForTimeout(delayMs);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
        await page.waitForTimeout(400);
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});

        // Sonde l'état réel de la page rendue.
        const probe = await page.evaluate(() => {
          const text = (document.body?.innerText ?? "").slice(0, 4000);
          let score = 0;
          const els = Array.from(document.body?.querySelectorAll("*") ?? []);
          for (const el of els) {
            const r = (el as HTMLElement).getBoundingClientRect();
            if (r.width < 8 || r.height < 8) continue;
            const tag = el.tagName.toLowerCase();
            if (tag === "img" || tag === "svg" || tag === "canvas" || tag === "video") score++;
            else {
              const bg = getComputedStyle(el as HTMLElement).backgroundImage;
              if (bg && bg !== "none") score++;
            }
          }
          return { title: document.title ?? "", text, contentScore: score };
        });

        const reason = diagnoseCapture({ status, ...probe });
        if (reason) {
          lastReason = reason;
          log("WARN", `capture: tentative ${attempt + 1}/${retries + 1} rejetée — ${reason} (${spec.url})`);
          await context.close();
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); // backoff
            continue;
          }
          break;
        }

        // OK : on écrit l'image.
        if (spec.selector) {
          await page.locator(spec.selector).first().screenshot({ path: outFile });
        } else {
          await page.screenshot({ path: outFile, fullPage: spec.fullPage ?? false });
        }
        log("INFO", `capture: ${spec.url} -> ${outFile}`);
        await context.close();
        return;
      } catch (e) {
        await context.close().catch(() => {});
        throw e;
      }
    }

    // Toutes les tentatives ont échoué : on échoue bruyamment, on ne livre PAS de déchet.
    throw new Error(
      `capture: ${spec.url} inexploitable — ${lastReason}. ` +
        `Ce site bloque la capture automatique. Solution : déposer une capture manuelle ` +
        `(passer la scène en source "manual_asset" et mettre le fichier dans assets/captures/<sceneId>.png).`,
    );
  } finally {
    await browser.close();
  }
}
