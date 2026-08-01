/**
 * Repérage d'un site d'outil, AVANT d'écrire le script.
 *
 *   npx tsx scripts/recon.ts https://botpenguin.com/
 *   npx tsx scripts/recon.ts https://botpenguin.com/ --pages 8
 *
 * Sort deux fichiers dans `tool-maps/` :
 *   <domaine>.json  — la carte, lue par le rédacteur du plan
 *   <domaine>.md    — la même chose en lisible, à parcourir en 30 secondes
 *
 * Ensuite, le plan écrit ses beats avec les VRAIS sélecteurs de la carte au lieu de
 * pointer le curseur à l'aveugle.
 */
import { join } from "node:path";
import { reconSite, writeReconFiles } from "./lib/recon.js";
import { REPO_ROOT } from "./lib/util.js";

const url = process.argv[2];
if (!url) {
  console.error("usage: npx tsx scripts/recon.ts <url> [--pages N] [--viewport 1440x810]");
  process.exit(2);
}
const pagesArg = process.argv.indexOf("--pages");
const vpArg = process.argv.indexOf("--viewport");
const maxPages = pagesArg > 0 ? parseInt(process.argv[pagesArg + 1], 10) : 6;
const viewport = vpArg > 0 ? process.argv[vpArg + 1] : "1440x810";

const domain = new URL(url).hostname.replace(/^www\./, "");
const outDir = join(REPO_ROOT, "tool-maps");

console.log(`Repérage de ${url} (max ${maxPages} pages)…\n`);
const res = await reconSite(url, { viewport, maxPages });
writeReconFiles(res, join(outDir, `${domain}.json`), join(outDir, `${domain}.md`));

console.log(`\n${res.pages.length} page(s) cartographiée(s) :`);
for (const p of res.pages) {
  console.log(`  [${p.kind.padEnd(12)}] ${p.sections.length.toString().padStart(2)} sections · ${p.prices.length} prix · ${p.url}`);
}
for (const s of res.skipped) console.log(`  [ÉCARTÉE    ] ${s.url} — ${s.reason}`);

const kinds = new Set(res.pages.map((p) => p.kind));
const manque = (["home", "features", "pricing"] as const).filter((k) => !kinds.has(k));
if (manque.length) {
  console.log(`\n⚠️  Manque pour le format S : ${manque.join(", ")}.`);
  console.log("   Relancer avec --pages 10, ou donner l'URL directement (ex. .../pricing).");
}

console.log(`\n→ tool-maps/${domain}.md`);
