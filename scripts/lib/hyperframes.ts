import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT, log, sha256 } from "./util.js";

/**
 * Animated HTML scene -> MP4 clip via the HyperFrames CLI (local render, $0 API).
 * STRICT RULES:
 *  - The composition is a self-contained dir INSIDE the project (hyperframes/<sceneId>/index.html),
 *    written by the plan like an image prompt — versioned with the project, deterministic render.
 *  - Local render only (Chrome headless managed by hyperframes + ffmpeg). NEVER the cloud
 *    render commands (cloud/lambda/cloudrun) — zero API, zero cost per render.
 *  - hyperframes is a devDependency invoked through its local bin: the pipeline runs without
 *    it as long as no scene uses `source: "hyperframes"`.
 */
export interface HyperframesSpec {
  dir?: string; // composition dir relative to the project (default: hyperframes/<sceneId>)
  fps?: number; // default 30 — must match assemble's 30 fps clips
  quality?: "draft" | "standard" | "high"; // default standard
}

export function compositionDir(projectDir: string, sceneId: string, spec?: HyperframesSpec): string {
  return join(projectDir, spec?.dir ?? join("hyperframes", sceneId));
}

/** Idempotence input: every composition file (relative path + content hash) + render settings. */
export function hyperframesHashInput(compDir: string, spec?: HyperframesSpec): string {
  const files: string[] = [];
  const walk = (d: string): void => {
    const entries = readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === "renders") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(relative(compDir, p).split("\\").join("/") + ":" + sha256(readFileSync(p).toString("base64")));
    }
  };
  walk(compDir);
  return JSON.stringify({ files, fps: spec?.fps ?? 30, quality: spec?.quality ?? "standard" });
}

export function renderHyperframes(compDir: string, outFile: string, spec?: HyperframesSpec): void {
  // Local bin invoked via node directly: npx-free (Windows .cmd shims need a shell).
  const cli = join(REPO_ROOT, "node_modules", "hyperframes", "dist", "cli.js");
  if (!existsSync(cli)) {
    throw new Error(
      "hyperframes introuvable — installe-le en local : npm i -D hyperframes && npx hyperframes browser ensure",
    );
  }
  log("INFO", `hyperframes: render ${compDir} -> ${outFile}`);
  execFileSync(
    process.execPath,
    [cli, "render", compDir, "-o", outFile, "--fps", String(spec?.fps ?? 30), "--quality", spec?.quality ?? "standard", "--quiet"],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
}
