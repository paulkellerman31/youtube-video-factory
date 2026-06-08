#!/usr/bin/env -S npx tsx
/**
 * factory run <project-dir> [--dry-run] [--only <audio|images|assemble>]
 * Usage: npm run factory -- run projects/2026-06-07_topic-slug --dry-run
 */
import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { assemble } from "./assemble.js";
import { generateAudio, type StepCtx } from "./generate-audio.js";
import { generateImages } from "./generate-images.js";
import { readManifest, recordError } from "./lib/manifest.js";
import { loadEnv, log, REPO_ROOT, round2, setLogFile } from "./lib/util.js";

const STEPS: Array<[string, (ctx: StepCtx) => Promise<void>]> = [
  ["audio", generateAudio],
  ["images", generateImages],
  ["assemble", assemble],
];

function usage(): never {
  console.log("Usage: factory run <project-dir> [--dry-run] [--only <audio|images|assemble>]");
  process.exit(1);
}

async function main(): Promise<void> {
  loadEnv();
  const argv = process.argv.slice(2);
  const [cmd, projectArg] = argv;
  if (cmd !== "run" || !projectArg) usage();

  const dryRun = argv.includes("--dry-run");
  const onlyIdx = argv.indexOf("--only");
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;
  if (only && !STEPS.some(([n]) => n === only)) usage();

  // Accept absolute path, path relative to cwd, or bare project name under projects/.
  let projectDir = isAbsolute(projectArg) ? projectArg : resolve(process.cwd(), projectArg);
  if (!existsSync(projectDir)) projectDir = join(REPO_ROOT, "projects", projectArg);
  if (!existsSync(join(projectDir, "project-config.json"))) {
    console.error(`No project-config.json found in: ${projectDir}`);
    process.exit(1);
  }

  setLogFile(projectDir);
  log("INFO", `=== factory run ${projectDir}${dryRun ? " [DRY-RUN]" : ""}${only ? ` [only: ${only}]` : ""} ===`);

  for (const [name, fn] of STEPS) {
    if (only && name !== only) continue;
    const t0 = Date.now();
    log("INFO", `--- step: ${name} ---`);
    try {
      await fn({ projectDir, dryRun });
      log("INFO", `--- step ${name} ok (${((Date.now() - t0) / 1000).toFixed(1)}s) ---`);
    } catch (e) {
      const msg = `${name}: ${(e as Error).message}`;
      log("ERROR", msg);
      if (!dryRun) recordError(projectDir, msg);
      process.exit(1);
    }
  }

  // Summary
  const m = readManifest(projectDir);
  const imgCost = (m.images ?? []).reduce((a, f) => a + f.costUSD, 0);
  const total = round2((m.audio?.costUSD ?? 0) + imgCost);
  log("INFO", `=== done. audio: $${m.audio?.costUSD ?? "-"} | images: $${round2(imgCost)} | total: $${total}${m.final ? ` | final.mp4: ${m.final.durationSec}s` : ""} ===`);
}

main();
