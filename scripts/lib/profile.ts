import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./util.js";

/**
 * Channel profiles: references/profiles/<channel>/{style.md, voice-config.json,
 * thumbnail-playbook.md, render-config.json}.
 * project-config.json carries a "channel" field; legacy projects without it default to "ofm".
 * Fallback chain keeps pre-profile projects working: profile file -> legacy references/ file.
 */

export function getChannel(projectDir: string): string {
  try {
    const cfg = JSON.parse(readFileSync(join(projectDir, "project-config.json"), "utf8")) as { channel?: string };
    if (typeof cfg.channel === "string" && cfg.channel.trim()) return cfg.channel.trim();
  } catch {
    /* no config yet -> legacy default */
  }
  return "ofm";
}

export function getProfileDir(projectDir: string): string {
  return join(REPO_ROOT, "references", "profiles", getChannel(projectDir));
}

/** Resolve a profile file with legacy fallback (e.g. style.md <- image-prompt-style.md). */
export function profileFile(projectDir: string, name: string, legacyName?: string): string {
  const p = join(getProfileDir(projectDir), name);
  if (existsSync(p)) return p;
  return join(REPO_ROOT, "references", legacyName ?? name);
}

export type SubtitlesMode = "burned" | "cc" | "none";

/**
 * Subtitles mode: project-config.json "subtitles" > profile render-config.json > "burned".
 * "burned" is the legacy default so pre-existing projects keep their assemble hash (no re-render).
 * Whatever the mode, subs.srt (CC) is always generated.
 */
export function getSubtitlesMode(projectDir: string): SubtitlesMode {
  const valid = (v: unknown): v is SubtitlesMode => v === "burned" || v === "cc" || v === "none";
  try {
    const cfg = JSON.parse(readFileSync(join(projectDir, "project-config.json"), "utf8")) as { subtitles?: string };
    if (valid(cfg.subtitles)) return cfg.subtitles;
  } catch { /* fall through */ }
  try {
    const rc = JSON.parse(readFileSync(profileFile(projectDir, "render-config.json"), "utf8")) as { subtitles?: string };
    if (valid(rc.subtitles)) return rc.subtitles;
  } catch { /* fall through */ }
  return "burned";
}
