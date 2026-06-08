import { log } from "./util.js";

/**
 * Screen capture of a PUBLIC web page via Playwright + local Chromium.
 * STRICT RULES:
 *  - Public URLs only. NEVER automate logins, credentials or authenticated flows
 *    (logged-in views are `manual_asset`: a file the human drops in assets/captures/).
 *  - No third-party screenshot service — Playwright drives a local browser, direct.
 *  - Playwright is a lazy dynamic import: the pipeline runs without it as long as
 *    no scene uses `screen_capture`.
 */
export interface CaptureSpec {
  url: string;
  viewport?: string; // "1920x1080" (default)
  fullPage?: boolean; // default false
  selector?: string; // capture one element instead of the viewport
  hideSelectors?: string[]; // e.g. cookie banners
  delayMs?: number; // extra settle time after load
}

/** Normalized spec used for idempotence hashing (delayMs excluded by design). */
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
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport });
    await page.goto(spec.url, { waitUntil: "load", timeout: 60_000 });
    if (spec.hideSelectors?.length) {
      await page.addStyleTag({
        content: spec.hideSelectors.map((s) => `${s} { display: none !important; }`).join("\n"),
      });
    }
    if (spec.delayMs) await page.waitForTimeout(spec.delayMs);
    if (spec.selector) {
      await page.locator(spec.selector).first().screenshot({ path: outFile });
    } else {
      await page.screenshot({ path: outFile, fullPage: spec.fullPage ?? false });
    }
    log("INFO", `capture: ${spec.url} -> ${outFile}`);
  } finally {
    await browser.close();
  }
}
