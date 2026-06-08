import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface AudioFragment {
  file: string;
  durationSec: number;
  voiceId: string;
  hash: string;
  costUSD: number;
  generatedAt: string;
}

export interface ImageFragment {
  sceneId: string;
  file: string;
  hash: string;
  costUSD: number;
  generatedAt: string;
}

export interface FinalFragment {
  file: string;
  durationSec: number;
  sceneCount: number;
  totalCostUSD: number;
  hash: string;
  generatedAt: string;
}

export interface Manifest {
  audio?: AudioFragment;
  images?: ImageFragment[];
  final?: FinalFragment;
  updatedAt?: string;
  lastError?: string | null;
}

export const manifestPath = (projectDir: string): string => join(projectDir, "manifest.json");

export function readManifest(projectDir: string): Manifest {
  const p = manifestPath(projectDir);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8")) as Manifest;
  } catch {
    return {};
  }
}

/** Single-writer-per-step: each script only ever writes its own key. */
export function writeFragment<K extends keyof Manifest>(projectDir: string, key: K, value: Manifest[K]): void {
  const m = readManifest(projectDir);
  m[key] = value;
  m.updatedAt = new Date().toISOString();
  m.lastError = null;
  writeFileSync(manifestPath(projectDir), JSON.stringify(m, null, 2));
}

export function recordError(projectDir: string, err: string): void {
  const m = readManifest(projectDir);
  m.lastError = err;
  m.updatedAt = new Date().toISOString();
  writeFileSync(manifestPath(projectDir), JSON.stringify(m, null, 2));
}
