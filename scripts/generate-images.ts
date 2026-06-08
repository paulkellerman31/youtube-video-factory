import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { captureHashInput, screenCapture, type CaptureSpec } from "./lib/capture.js";
import { readManifest, writeFragment, type ImageFragment } from "./lib/manifest.js";
import { getRates } from "./lib/rates.js";
import { getChannel, profileFile } from "./lib/profile.js";
import { fetchWithRetry, log, round2, sha256 } from "./lib/util.js";
import type { StepCtx } from "./generate-audio.js";

type AssetSource = "ai_image" | "screen_capture" | "manual_asset";

interface SceneAsset {
  sceneId: string;
  source?: AssetSource; // default: ai_image (legacy entries unchanged)
  prompt?: string; // required for ai_image
  ar?: string;
  capture?: CaptureSpec; // required for screen_capture
}

/** Pull the global style string out of the channel profile's style.md (code fence under its heading). */
function extractGlobalStyle(stylePath: string): string {
  const md = readFileSync(stylePath, "utf8");
  const m = md.match(/## Global style string[^\n]*\n+```\n?([\s\S]*?)```/);
  if (!m) return "";
  return m[1].replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * image-prompts.json -> assets/images/<sceneId>.png, per-scene source:
 *  - ai_image       : gpt-image-1 (prompt + global style) — historical behaviour, unchanged
 *  - screen_capture : Playwright screenshot of a PUBLIC url ($0)
 *  - manual_asset   : human-dropped file at assets/captures/<sceneId>.png ($0) — never
 *                     generated, never overwritten; missing = hard stop, no silent AI fallback
 * Idempotent per scene: ai_image hash(prompt+style+size+quality) / capture hash(spec) /
 * manual hash(file bytes).
 */
export async function generateImages(ctx: StepCtx): Promise<void> {
  const { projectDir, dryRun } = ctx;
  const promptsPath = join(projectDir, "image-prompts.json");
  if (!existsSync(promptsPath)) throw new Error(`missing ${promptsPath}`);
  let scenes: SceneAsset[] = JSON.parse(readFileSync(promptsPath, "utf8"));
  // ONLY_SCENE=s03 -> process a single scene (useful for chunked/recovery runs)
  if (process.env.ONLY_SCENE) scenes = scenes.filter((p) => p.sceneId === process.env.ONLY_SCENE);
  const stylePath = profileFile(projectDir, "style.md", "image-prompt-style.md");
  const style = extractGlobalStyle(stylePath);
  log("INFO", `images: channel=${getChannel(projectDir)} style=${stylePath}`);
  const size = "1536x1024"; // gpt-image-1 landscape; assemble scales to 1920x1080
  const quality = (process.env.IMAGE_QUALITY ?? "medium") as "low" | "medium" | "high";
  const perImage = getRates().gptImage1PerImageUSD[quality] ?? getRates().gptImage1PerImageUSD.medium;

  const outDir = join(projectDir, "assets", "images");
  const manifest = readManifest(projectDir);
  const fragments: ImageFragment[] = [...(manifest.images ?? [])];

  let generated = 0;
  let skipped = 0;
  let cost = 0;

  const upsert = (frag: ImageFragment): void => {
    const idx = fragments.findIndex((f) => f.sceneId === frag.sceneId);
    if (idx >= 0) fragments[idx] = frag;
    else fragments.push(frag);
    writeFragment(projectDir, "images", fragments); // write after EACH asset -> crash-resumable
  };

  for (const p of scenes) {
    const source: AssetSource = p.source ?? "ai_image";
    const outFile = join(outDir, `${p.sceneId}.png`);
    const existing = fragments.find((f) => f.sceneId === p.sceneId);

    // ---------- manual_asset: use, never generate, never overwrite ----------
    if (source === "manual_asset") {
      const manualFile = join(projectDir, "assets", "captures", `${p.sceneId}.png`);
      if (!existsSync(manualFile)) {
        const msg = `asset manuel manquant pour ${p.sceneId} (attendu: assets/captures/${p.sceneId}.png)`;
        if (dryRun) {
          log("WARN", `images: ${p.sceneId} source=manual_asset — ${msg}`);
          continue;
        }
        throw new Error(msg);
      }
      const hash = sha256(readFileSync(manualFile).toString("base64") + "|manual");
      if (existsSync(outFile) && existing?.hash === hash) {
        log("SKIP", `images: ${p.sceneId} up to date (manual, hash ${hash})`);
        skipped++;
        continue;
      }
      if (dryRun) {
        log("DRY", `images: ${p.sceneId} source=manual_asset <- assets/captures/${p.sceneId}.png - $0`);
        generated++;
        continue;
      }
      mkdirSync(outDir, { recursive: true });
      copyFileSync(manualFile, outFile); // copies INTO images/; the captures/ source is never written
      upsert({ sceneId: p.sceneId, file: `assets/images/${p.sceneId}.png`, hash, costUSD: 0, generatedAt: new Date().toISOString() });
      log("COST", `images: ${p.sceneId} $0 (manual_asset)`);
      generated++;
      continue;
    }

    // ---------- screen_capture: Playwright on a PUBLIC url ----------
    if (source === "screen_capture") {
      if (!p.capture?.url) throw new Error(`images: ${p.sceneId} source=screen_capture sans champ capture.url`);
      const hash = sha256(captureHashInput(p.capture) + "|capture");
      if (existsSync(outFile) && existing?.hash === hash) {
        log("SKIP", `images: ${p.sceneId} up to date (capture, hash ${hash})`);
        skipped++;
        continue;
      }
      if (dryRun) {
        log("DRY", `images: ${p.sceneId} source=screen_capture url=${p.capture.url} viewport=${p.capture.viewport ?? "1920x1080"}${p.capture.selector ? ` selector=${p.capture.selector}` : ""}${p.capture.fullPage ? " fullPage" : ""} - $0 (browser NOT launched)`);
        generated++;
        continue;
      }
      mkdirSync(outDir, { recursive: true });
      await screenCapture(p.capture, outFile);
      upsert({ sceneId: p.sceneId, file: `assets/images/${p.sceneId}.png`, hash, costUSD: 0, generatedAt: new Date().toISOString() });
      log("COST", `images: ${p.sceneId} $0 (screen_capture)`);
      generated++;
      continue;
    }

    // ---------- ai_image: historical behaviour, byte-for-byte identical hash ----------
    if (!p.prompt) throw new Error(`images: ${p.sceneId} source=ai_image sans prompt`);
    const fullPrompt = `${p.prompt.trim()}. ${style}`;
    const hash = sha256([fullPrompt, size, quality].join("|"));

    if (existsSync(outFile) && existing?.hash === hash) {
      log("SKIP", `images: ${p.sceneId} up to date (hash ${hash})`);
      skipped++;
      continue;
    }

    if (dryRun) {
      log("DRY", `images: would generate ${p.sceneId} (${quality}, ${size}) - est. $${perImage} - prompt: "${fullPrompt.slice(0, 110)}..."`);
      generated++;
      cost += perImage;
      continue;
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY missing (put it in .env at repo root)");

    log("INFO", `images: generating ${p.sceneId} (${quality})...`);
    const res = await fetchWithRetry(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "gpt-image-1", prompt: fullPrompt, n: 1, size, quality }),
      },
      { label: `gpt-image-1 ${p.sceneId}`, timeoutMs: 300_000 },
    );
    const json = (await res.json()) as { data: Array<{ b64_json: string }> };
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, Buffer.from(json.data[0].b64_json, "base64"));

    upsert({ sceneId: p.sceneId, file: `assets/images/${p.sceneId}.png`, hash, costUSD: perImage, generatedAt: new Date().toISOString() });
    log("COST", `images: ${p.sceneId} $${perImage}`);
    generated++;
    cost += perImage;
  }

  if (dryRun && !process.env.OPENAI_API_KEY) log("WARN", "images: OPENAI_API_KEY missing from .env");
  log(dryRun ? "DRY" : "INFO", `images: ${generated} ${dryRun ? "to generate" : "generated"}, ${skipped} skipped - ${dryRun ? "est. " : ""}$${round2(cost)}`);
}
