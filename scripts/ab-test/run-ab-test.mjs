// A/B test modèle image — gpt-image-1 vs gpt-image-1.5 (standalone, ne touche pas au pipeline prod).
// Usage (depuis la racine du repo) :
//   IMAGE_MODEL=gpt-image-1   IMAGE_QUALITY=medium TEST_PREFIX=ab-a node scripts/ab-test/run-ab-test.mjs
//   IMAGE_MODEL=gpt-image-1.5 IMAGE_QUALITY=medium TEST_PREFIX=ab-b node scripts/ab-test/run-ab-test.mjs
// Sortie : tmp/ab-tests/<TEST_PREFIX>/  (PNG + results.json). tmp/ est gitignoré.
//
// Prompts en MÉTHODE POSITIVE (cf. style.md) — sauf la scène short_text qui teste VOLONTAIREMENT
// le rendu d'un mot court (c'est le seul cas où on demande du texte au modèle).

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

// Charge OPENAI_API_KEY depuis .env si pas déjà dans l'env.
function loadEnvKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envPath = join(repoRoot, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = /^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

const KEY = loadEnvKey();
if (!KEY) { console.error("OPENAI_API_KEY manquante (.env ou env)."); process.exit(1); }

const MODEL = process.env.IMAGE_MODEL ?? "gpt-image-1";
const QUALITY = process.env.IMAGE_QUALITY ?? "medium";
const PREFIX = process.env.TEST_PREFIX ?? `ab-${Date.now()}`;
const SIZE = "1536x1024";

const scenes = [
  {
    id: "concept_hero",
    n: 1,
    prompt:
      "Photorealistic mid-shot of a confident male narrator in his 30s standing in front of a large holographic analytics panel showing abstract glowing charts, dark luxury tech office, neon blue rim lighting, subtle bokeh, 50mm lens, shallow depth of field, natural skin texture, plain unmarked surfaces, smooth featureless screens, cinematic high contrast, 16:9",
  },
  {
    id: "character_consistency",
    n: 2, // 2 images pour juger la cohérence INTRA-modèle du même personnage
    prompt:
      "Flat 2D cartoon illustration, TED-Ed style, of a friendly round teal water-droplet mascot with two big dot eyes, a small cheerful smile and one white highlight, clean bold outlines, soft cream background, plain unmarked shapes, smooth flat colors, 16:9",
  },
  {
    id: "short_text",
    n: 1, // teste VOLONTAIREMENT le rendu d'un mot court (le seul cas où on veut du texte)
    prompt:
      'A high-impact YouTube thumbnail, dark luxury tech style, with the bold uppercase words "RED FLAG" in large clean sans-serif letters, neon blue and white on a dark background, an oversized warning emblem, dramatic rim lighting, high contrast, 16:9',
  },
];

const only = process.env.SCENE; // optionnel : ne générer qu'une scène (concept_hero|character_consistency|short_text)
const activeScenes = only ? scenes.filter((s) => s.id === only) : scenes;

const outDir = join(repoRoot, "tmp", "ab-tests", PREFIX);
mkdirSync(outDir, { recursive: true });

async function genScene(s) {
  const t0 = Date.now();
  let res, body;
  try {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, prompt: s.prompt, n: s.n, size: SIZE, quality: QUALITY }),
    });
    body = await res.json();
  } catch (e) {
    return { scene: s.id, ok: false, error: String(e), latencyMs: Date.now() - t0 };
  }
  const latencyMs = Date.now() - t0;
  if (!res.ok) {
    // Capture explicite des erreurs de palier qualité / modèle inconnu.
    return { scene: s.id, ok: false, status: res.status, error: body?.error ?? body, latencyMs };
  }
  const files = [];
  (body.data ?? []).forEach((d, i) => {
    if (!d.b64_json) return;
    const f = join(outDir, `${s.id}_${MODEL}_${QUALITY}_${i + 1}.png`);
    writeFileSync(f, Buffer.from(d.b64_json, "base64"));
    files.push(f);
  });
  return { scene: s.id, ok: true, latencyMs, files, usage: body.usage ?? null };
}

console.log(`\n=== A/B image — model=${MODEL} quality=${QUALITY} prefix=${PREFIX} ===`);
const results = [];
for (const s of scenes) {
  process.stdout.write(`  ${s.id} (n=${s.n})… `);
  const r = await genScene(s);
  results.push({ model: MODEL, quality: QUALITY, prefix: PREFIX, size: SIZE, ...r });
  console.log(r.ok ? `OK ${(r.latencyMs / 1000).toFixed(1)}s -> ${r.files.length} img` : `ERREUR ${r.status ?? ""}`);
  if (!r.ok) console.log(`     ↳ ${JSON.stringify(r.error).slice(0, 300)}`);
}

const summaryPath = join(outDir, "results.json");
writeFileSync(summaryPath, JSON.stringify({ model: MODEL, quality: QUALITY, size: SIZE, scenes: results }, null, 2));
console.log(`\nImages + results.json -> tmp/ab-tests/${PREFIX}/`);
console.log("Compare les PNG des 2 runs (prefix A vs B) et remplis scorecard.md.\n");
