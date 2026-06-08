import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Repo root = two levels up from scripts/lib/ */
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Load .env at repo root into process.env (existing env vars win). Never logs values. */
export function loadEnv(): void {
  const envPath = join(REPO_ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const v = m[2].replace(/^["']|["']$/g, "");
    if (v && process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

/** Short stable hash for idempotence checks. */
export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

let logFile: string | null = null;
export function setLogFile(projectDir: string): void {
  logFile = join(projectDir, "pipeline.log");
}

export type LogLevel = "INFO" | "WARN" | "ERROR" | "COST" | "SKIP" | "DRY";
export function log(level: LogLevel, msg: string): void {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  console.log(line);
  if (logFile) {
    try { appendFileSync(logFile, line + "\n"); } catch { /* logging must never crash the run */ }
  }
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** fetch with timeout + exponential-backoff retries on network errors / 429 / 5xx. */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: { retries?: number; timeoutMs?: number; label?: string } = {},
): Promise<Response> {
  const { retries = 3, timeoutMs = 180_000, label = url } = opts;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      const body = (await res.text().catch(() => "")).slice(0, 400);
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`${label}: HTTP ${res.status} ${body}`);
        log("WARN", `${label}: HTTP ${res.status} — retry ${attempt}/${retries}`);
      } else {
        throw new Error(`${label}: HTTP ${res.status} ${body}`); // 4xx = no retry
      }
    } catch (e) {
      clearTimeout(timer);
      const msg = (e as Error).message ?? String(e);
      if (/HTTP 4(?!29)/.test(msg)) throw e; // non-retryable client error
      lastErr = e;
      log("WARN", `${label}: ${msg} — retry ${attempt}/${retries}`);
    }
    await sleep(1500 * 2 ** (attempt - 1));
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label}: failed after ${retries} attempts`);
}

export const round2 = (n: number): number => Math.round(n * 10000) / 10000;
