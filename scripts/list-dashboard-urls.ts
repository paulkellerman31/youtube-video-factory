/**
 * Relève les URLs internes atteignables depuis le dashboard connecté — LECTURE SEULE.
 *
 * Pourquoi ce script existe : une scène `auth` se pilote par URL (aucun clic n'est autorisé dans
 * un compte réel). Il faut donc connaître les adresses exactes des sections, et elles ne se
 * devinent pas : une URL fausse ferait échouer le rendu après plusieurs minutes de capture.
 *
 * Ce script N'ÉCRIT RIEN, ne clique nulle part, ne suit aucun lien : il ouvre une page, lit les
 * `href` du menu, et les affiche. Rien ne sort de la machine.
 *
 * Lancer : dashboard-urls.bat   (ou `npx tsx scripts/list-dashboard-urls.ts <url>`)
 */
import { join } from "node:path";
import {
  contextOptions,
  hideAutomation,
  launchAuthedContext,
  loadChromium,
  RECORD_PROFILE_DIR,
} from "./lib/capture.js";

const START = process.argv[2] ?? process.env.DASH_URL ?? "https://app.botpenguin.com/home-v2";

const chromium = await loadChromium();
const context = await launchAuthedContext(
  chromium,
  join(process.cwd(), RECORD_PROFILE_DIR),
  contextOptions({ width: 1440, height: 810 }),
);

try {
  await hideAutomation(context);
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(START, { waitUntil: "load", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const origin = new URL(START).origin;
  const links = await page.evaluate((org: string) => {
    const out: { url: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const el = a as HTMLAnchorElement;
      let u: URL;
      try {
        u = new URL(el.getAttribute("href") || "", location.href);
      } catch {
        continue;
      }
      if (u.origin !== org) continue;
      const clean = u.origin + u.pathname;
      if (seen.has(clean)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue; // lien invisible
      seen.add(clean);
      out.push({ url: clean, label: (el.innerText || el.textContent || "").trim().slice(0, 40) });
    }
    return out;
  }, origin);

  console.log(`\nPage lue : ${page.url()}`);
  console.log(`Titre    : ${await page.title()}\n`);
  if (!links.length) {
    console.log("Aucun lien interne visible — le menu est probablement en JavaScript sans <a>.");
    console.log("Dans ce cas : ouvre chaque section à la main dans Chrome et copie l'URL de la barre d'adresse.\n");
  } else {
    console.log(`${links.length} sections atteignables par URL :\n`);
    for (const l of links) console.log(`  ${l.url}${l.label ? `   — ${l.label}` : ""}`);
    console.log("");
  }
  console.log("Copie-colle cette liste. Rien n'a été modifié, rien n'est sorti de la machine.\n");
} finally {
  await context.close().catch(() => {});
}
