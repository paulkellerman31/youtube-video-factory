import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ffprobeDuration } from "./lib/ffmpeg.js";
import { readManifest, writeFragment } from "./lib/manifest.js";
import { getRates } from "./lib/rates.js";
import { getChannel, profileFile } from "./lib/profile.js";
import { fetchWithRetry, log, round2, sha256 } from "./lib/util.js";

export interface StepCtx {
  projectDir: string;
  dryRun: boolean;
}

interface VoiceConfig {
  voiceId: string;
  modelId: string;
  settings: { stability: number; similarityBoost: number; style: number; useSpeakerBoost: boolean; speed?: number };
}

/**
 * voiceover.txt + <profile>/voice-config.json -> assets/audio/voice.mp3 (+ timestamps.json
 * from ElevenLabs character alignment, used later for subtitle timing — no Whisper call needed).
 */
export async function generateAudio(ctx: StepCtx): Promise<void> {
  const { projectDir, dryRun } = ctx;
  const textPath = join(projectDir, "voiceover.txt");
  if (!existsSync(textPath)) throw new Error(`missing ${textPath}`);
  const text = readFileSync(textPath, "utf8").trim();
  if (!text) throw new Error("voiceover.txt is empty");

  const vcPath = profileFile(projectDir, "voice-config.json");
  const vc: VoiceConfig = JSON.parse(readFileSync(vcPath, "utf8"));
  log("INFO", `audio: channel=${getChannel(projectDir)} voice-config=${vcPath}`);
  const hash = sha256([text, vc.voiceId, vc.modelId, JSON.stringify(vc.settings)].join("|"));
  const outFile = join(projectDir, "assets", "audio", "voice.mp3");
  const estCost = round2(text.length * getRates().elevenlabsPerCharUSD);

  const m = readManifest(projectDir);
  if (existsSync(outFile) && m.audio?.hash === hash) {
    log("SKIP", `audio: voice.mp3 up to date (hash ${hash})`);
    return;
  }

  if (dryRun) {
    log("DRY", `audio: would synthesize ${text.length} chars, voice=${vc.voiceId}, model=${vc.modelId} — est. $${estCost}`);
    if (vc.voiceId.includes("REMPLIR")) log("WARN", `audio: voiceId not set in ${vcPath}`);
    if (!process.env.ELEVENLABS_API_KEY) log("WARN", "audio: ELEVENLABS_API_KEY missing from .env");
    return;
  }

  if (vc.voiceId.includes("REMPLIR")) throw new Error(`${vcPath}: voiceId is not set`);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing (put it in .env at repo root)");

  log("INFO", `audio: synthesizing ${text.length} chars with ElevenLabs (${vc.modelId})…`);
  const res = await fetchWithRetry(
    `https://api.elevenlabs.io/v1/text-to-speech/${vc.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: vc.modelId,
        voice_settings: {
          stability: vc.settings.stability,
          similarity_boost: vc.settings.similarityBoost,
          style: vc.settings.style,
          use_speaker_boost: vc.settings.useSpeakerBoost,
          ...(vc.settings.speed != null ? { speed: vc.settings.speed } : {}),
        },
      }),
    },
    { label: "elevenlabs tts", timeoutMs: 300_000 },
  );
  const json = (await res.json()) as { audio_base64: string; alignment?: unknown; normalized_alignment?: unknown };

  mkdirSync(join(projectDir, "assets", "audio"), { recursive: true });
  writeFileSync(outFile, Buffer.from(json.audio_base64, "base64"));
  const alignment = json.alignment ?? json.normalized_alignment ?? null;
  writeFileSync(join(projectDir, "assets", "audio", "timestamps.json"), JSON.stringify(alignment));

  const durationSec = round2(ffprobeDuration(outFile));
  writeFragment(projectDir, "audio", {
    file: "assets/audio/voice.mp3",
    durationSec,
    voiceId: vc.voiceId,
    hash,
    costUSD: estCost,
    generatedAt: new Date().toISOString(),
  });
  log("COST", `audio: $${estCost} (${text.length} chars)`);
  log("INFO", `audio: done — ${durationSec}s`);
}
