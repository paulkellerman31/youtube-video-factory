import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
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
 * REPÉRAGE — visite le site d'un outil et en dresse la carte, AVANT d'écrire le script.
 *
 * Le problème que ça règle : sans repérage, le plan devine les URLs et pointe le curseur à des
 * coordonnées à l'aveugle. La vidéo montre alors « une page » pendant que la voix parle d'une
 * fonctionnalité — et le script décrit des fonctionnalités que le modèle imagine.
 *
 * Avec la carte, chaque bloc du script est écrit EN FACE d'une section qui existe vraiment, et
 * les beats visent des sélecteurs réels (« survole le bouton du plan Pro ») au lieu d'un pixel.
 *
 * Public uniquement, aucun login, jamais de formulaire. Même trousse anti-blocage que la capture.
 */

export interface ReconSection {
  label: string; // le titre de la section, tel qu'écrit sur la page
  selector: string; // sélecteur CSS stable et unique
  top: number; // position dans le document (px) — utilisable en scrollTo
  /** éléments interactifs proches, candidats naturels à un hover/click */
  targets: Array<{ text: string; selector: string; kind: "button" | "link" | "card" }>;
}

export interface ReconPage {
  url: string;
  title: string;
  kind: "home" | "pricing" | "features" | "docs" | "blog" | "integrations" | "other";
  height: number; // hauteur totale du document
  sections: ReconSection[];
  /** prix trouvés sur la page, tels qu'écrits — jamais reformulés */
  prices: string[];
}

export interface ReconResult {
  root: string;
  capturedAt: string;
  pages: ReconPage[];
  skipped: Array<{ url: string; reason: string }>;
}

const KIND_PATTERNS: Array<[ReconPage["kind"], RegExp]> = [
  ["pricing", /\b(pricing|prix|plans?|tarifs?|cost)\b/i],
  ["docs", /\b(docs?|documentation|help|support|knowledge|guide|api)\b/i],
  ["integrations", /\b(integrations?|connectors?|apps?)\b/i],
  ["blog", /\b(blog|articles?|news|resources?)\b/i],
  ["features", /\b(features?|product|platform|solutions?|how-it-works|use-cases?)\b/i],
];

function classify(url: string, title: string): ReconPage["kind"] {
  const path = (() => { try { return new URL(url).pathname; } catch { return url; } })();
  if (path === "/" || path === "") return "home";
  for (const [kind, re] of KIND_PATTERNS) if (re.test(path)) return kind;
  for (const [kind, re] of KIND_PATTERNS) if (re.test(title)) return kind;
  return "other";
}

/** Ordre de priorité : ce dont le format S a besoin, dans l'ordre où il en a besoin. */
const KIND_PRIORITY: ReconPage["kind"][] = ["home", "features", "pricing", "integrations", "docs", "blog", "other"];

/**
 * Exécuté DANS la page. Récolte les sections (titres) avec un sélecteur stable, leur position,
 * et les éléments cliquables voisins. Aucun clic, aucune saisie : lecture seule.
 *
 * ⚠️ Écrit en CHAÎNE, pas en fonction TypeScript. `tsx`/esbuild réécrit les fonctions nommées en
 * y injectant un helper `__name` qui n'existe pas dans le navigateur : une fonction passée à
 * `page.evaluate` échoue alors avec « __name is not defined ». Une expression sous forme de
 * chaîne traverse le transpileur intacte. (Constaté au premier essai — la panne se produit à
 * l'exécution, jamais à la compilation.)
 */
const MAP_PAGE_SRC = `(() => {
  const sel = (el) => {
    const id = el.id;
    if (id && document.querySelectorAll('#' + CSS.escape(id)).length === 1) return '#' + CSS.escape(id);
    const attrs = ['data-testid','data-test','data-id','data-section','aria-label'];
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v) {
        const s = '[' + a + '="' + CSS.escape(v) + '"]';
        try { if (document.querySelectorAll(s).length === 1) return s; } catch (e) {}
      }
    }
    const part = (e) => {
      const tag = e.tagName.toLowerCase();
      const raw = (typeof e.className === 'string' ? e.className : '');
      const cls = raw.split(/\\s+/).filter((c) => c && !/^(is-|has-|active|open)/.test(c) && c.length < 30)[0];
      const base = cls ? tag + '.' + CSS.escape(cls) : tag;
      const sibs = e.parentElement ? Array.from(e.parentElement.children).filter((x) => x.tagName === e.tagName) : [];
      const i = sibs.indexOf(e);
      return (sibs.length > 1 && i >= 0) ? base + ':nth-of-type(' + (i + 1) + ')' : base;
    };
    const chain = [];
    let cur = el;
    for (let d = 0; cur && d < 4; d++) {
      chain.unshift(part(cur));
      const candidate = chain.join(' > ');
      try { if (document.querySelectorAll(candidate).length === 1) return candidate; } catch (e) {}
      cur = cur.parentElement;
    }
    return chain.join(' > ');
  };

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 20 && r.height > 8 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
  };

  const clean = (s) => (s || '').replace(/\\s+/g, ' ').trim().slice(0, 90);

  const heads = Array.from(document.querySelectorAll('h1, h2, h3')).filter(visible);
  const sections = heads.map((h) => {
    const rect = h.getBoundingClientRect();
    const top = Math.round(rect.top + window.scrollY);
    let box = h;
    let p = h.parentElement;
    for (let d = 0; p && d < 3; d++) {
      if (p.getBoundingClientRect().height > rect.height * 2.5) { box = p; break; }
      p = p.parentElement;
    }
    const targets = Array.from(box.querySelectorAll("a, button, [role='button']"))
      .filter(visible)
      .filter((e) => clean(e.textContent).length > 1)
      .slice(0, 4)
      .map((e) => ({
        text: clean(e.textContent),
        selector: sel(e),
        kind: (e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') ? 'button' : 'link'
      }));
    return { label: clean(h.textContent), selector: sel(h), top: top, targets: targets };
  }).filter((s) => s.label.length > 2);

  const priceRe = /(?:[$\\u20AC\\u00A3]\\s?\\d[\\d.,]*(?:\\s?\\/\\s?\\w+)?|\\b\\d[\\d.,]*\\s?(?:USD|EUR)\\b)/g;
  const bodyText = ((document.body && document.body.innerText) || '').slice(0, 20000);
  const prices = Array.from(new Set((bodyText.match(priceRe) || []).map((s) => s.trim()))).slice(0, 12);

  const links = Array.from(document.querySelectorAll('a[href]'))
    .map((a) => a.href)
    .filter((h) => h && h.indexOf('javascript:') !== 0 && h.indexOf('mailto:') !== 0);

  return {
    title: clean(document.title),
    height: document.documentElement.scrollHeight,
    sections: sections.slice(0, 14),
    prices: prices,
    links: Array.from(new Set(links)).slice(0, 200)
  };
})()`;

interface MapResult {
  title: string;
  height: number;
  sections: ReconSection[];
  prices: string[];
  links: string[];
}

export async function reconSite(
  rootUrl: string,
  opts: { viewport?: string; maxPages?: number; maxPerKind?: number } = {},
): Promise<ReconResult> {
  if (!/^https?:\/\//i.test(rootUrl)) throw new Error(`recon: URL invalide "${rootUrl}"`);
  const maxPages = opts.maxPages ?? 8;
  const maxPerKind = opts.maxPerKind ?? 2;
  const viewport = parseViewportSpec(opts.viewport ?? "1440x810");
  const origin = new URL(rootUrl).origin;

  const chromium = await loadChromium();
  const browser = await launchBrowser(chromium);
  const result: ReconResult = { root: rootUrl, capturedAt: new Date().toISOString(), pages: [], skipped: [] };

  try {
    const context = await browser.newContext(contextOptions(viewport));
    await hideAutomation(context);
    const page = await context.newPage();

    const queue: string[] = [rootUrl];
    const seen = new Set<string>();

    const visit = async (url: string): Promise<string[]> => {
      let status = 0;
      try {
        const r = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
        status = r?.status() ?? 0;
      } catch {
        const r = await page.goto(url, { waitUntil: "load", timeout: 45_000 }).catch(() => null);
        status = r?.status() ?? 0;
      }
      await hideCookieBanners(page);
      await page.waitForTimeout(1200);

      const reason = diagnoseCapture(await probePage(page, status));
      if (reason) { result.skipped.push({ url, reason }); return []; }

      // déclenche le lazy-load puis revient en haut : ici rien n'est filmé, c'est sans risque
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
      await page.waitForTimeout(250);

      const m = (await page.evaluate(MAP_PAGE_SRC)) as MapResult;
      // La page d'entrée EST la home, quelle que soit son URL (`/`, `/index.html`, `/fr/`…).
      const kind = result.pages.length === 0 ? "home" : classify(url, m.title);
      result.pages.push({
        url, title: m.title, kind,
        height: m.height, sections: m.sections, prices: m.prices,
      });
      log("INFO", `recon: ${url} — ${m.sections.length} sections, ${m.prices.length} prix`);
      return m.links;
    };

    /**
     * COUVERTURE D'ABORD, pas priorité brute.
     *
     * Constaté sur un vrai site : la file triée par KIND_PRIORITY a consommé tout son budget
     * sur cinq pages « features » quasi identiques (une par canal) et n'a JAMAIS atteint le
     * pricing — c'est-à-dire le beat 3, obligatoire. Un tri par priorité empile les pages du
     * type le mieux classé ; ce qu'il faut, c'est couvrir chaque type une fois avant d'en
     * reprendre un deuxième.
     */
    const countByKind = (): Map<string, number> => {
      const m = new Map<string, number>();
      for (const p of result.pages) m.set(p.kind, (m.get(p.kind) ?? 0) + 1);
      return m;
    };

    while (queue.length && result.pages.length < maxPages) {
      const counts = countByKind();
      // on prend en premier une page d'un type PAS ENCORE couvert ; à défaut, le mieux classé
      queue.sort((a, b) => {
        const ka = classify(a, ""), kb = classify(b, "");
        const na = counts.get(ka) ?? 0, nb = counts.get(kb) ?? 0;
        if (na !== nb) return na - nb;
        return KIND_PRIORITY.indexOf(ka) - KIND_PRIORITY.indexOf(kb);
      });
      const url = queue.shift()!;
      const norm = url.split("#")[0].replace(/\/$/, "");
      if (seen.has(norm)) continue;
      const kind = classify(url, "");
      if ((counts.get(kind) ?? 0) >= maxPerKind) continue; // plafond par type
      seen.add(norm);

      const links = await visit(url);

      const candidates = links
        .filter((h) => { try { return new URL(h).origin === origin; } catch { return false; } })
        .filter((h) => !/\.(pdf|zip|png|jpe?g|svg|mp4|webm)(\?|$)/i.test(h))
        .filter((h) => !seen.has(h.split("#")[0].replace(/\/$/, "")))
        .filter((h) => classify(h, "") !== "other");
      for (const h of candidates) if (!queue.includes(h)) queue.push(h);
    }

    // Filet de sécurité : si un type indispensable au format S manque encore, on tente les
    // chemins usuels avant d'abandonner. Coût nul si la page n'existe pas (elle est écartée).
    const have = new Set(result.pages.map((p) => p.kind));
    const FALLBACKS: Array<[ReconPage["kind"], string[]]> = [
      ["pricing", ["/pricing", "/chatbot-pricing", "/plans", "/tarifs"]],
      ["docs", ["/docs", "/help", "/documentation"]],
    ];
    for (const [kind, paths] of FALLBACKS) {
      if (have.has(kind) || result.pages.length >= maxPages) continue;
      for (const p of paths) {
        const u = origin + p;
        if (seen.has(u.replace(/\/$/, ""))) continue;
        seen.add(u.replace(/\/$/, ""));
        log("INFO", `recon: ${kind} absent — tentative sur ${u}`);
        await visit(u);
        if (result.pages.some((x) => x.kind === kind)) break;
      }
    }

    await context.close();
  } finally {
    await browser.close().catch(() => {});
  }

  // ordre de restitution = ordre d'usage dans le script
  result.pages.sort((a, b) => KIND_PRIORITY.indexOf(a.kind) - KIND_PRIORITY.indexOf(b.kind));
  return result;
}

/** Écrit la carte en JSON + un résumé lisible, à donner tel quel au rédacteur du plan. */
export function writeReconFiles(res: ReconResult, jsonPath: string, mdPath: string): void {
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(res, null, 2));

  const L: string[] = [];
  L.push(`# Carte du site — ${res.root}`);
  L.push(`Relevé le ${res.capturedAt.slice(0, 10)}. ${res.pages.length} page(s).`);
  L.push("");
  L.push("> Écrire le script EN FACE de cette carte : chaque bloc parle d'une section qui existe");
  L.push("> réellement ci-dessous, et ses beats visent les sélecteurs listés. Ne jamais inventer");
  L.push("> une fonctionnalité ou un prix qui ne figure pas ici.");
  L.push("");
  for (const p of res.pages) {
    L.push(`## [${p.kind}] ${p.title}`);
    L.push(`\`${p.url}\` — hauteur ${p.height}px`);
    if (p.prices.length) L.push(`**Prix affichés :** ${p.prices.join(" · ")}`);
    L.push("");
    for (const s of p.sections) {
      L.push(`- **${s.label}** — \`scrollTo\` \`${s.selector}\` (y≈${s.top})`);
      for (const t of s.targets) L.push(`    - cible : « ${t.text} » → \`${t.selector}\``);
    }
    L.push("");
  }
  if (res.skipped.length) {
    L.push("## Pages écartées");
    for (const s of res.skipped) L.push(`- ${s.url} — ${s.reason}`);
  }
  writeFileSync(mdPath, L.join("\n") + "\n");
}
