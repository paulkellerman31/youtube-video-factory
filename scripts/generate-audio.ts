import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  /** Max characters per API call. See CHUNKING below. 0 or absent = one single call (legacy). */
  maxCharsPerRequest?: number;
}

/**
 * CHUNKING — pourquoi le script n'est plus envoyé d'un bloc (2026-08-01).
 *
 * Sur une génération longue, le ton d'ElevenLabs DÉRIVE : les premières phrases sont posées, les
 * dernières s'aplatissent. C'est le défaut décrit comme « la voix fait pas humain », et il ne se
 * corrige par aucun réglage de `stability` — c'est une propriété de la génération, pas de la voix.
 * La parade documentée est de découper en segments de 600 à 800 caractères.
 *
 * Deux contraintes rendent le découpage non trivial :
 *  1. On coupe UNIQUEMENT sur des frontières de paragraphe. Un paragraphe = une scène dans ce
 *     pipeline, et la coupure tombe donc sur un silence naturel : aucune couture audible.
 *     Un paragraphe plus long que la limite est coupé sur une fin de phrase, jamais au milieu.
 *  2. `timestamps.json` alimente les sous-titres. Chaque segment revient avec un alignement
 *     RELATIF À LUI-MÊME : il faut le décaler de la durée cumulée des segments précédents. Ce
 *     décalage se mesure à l'ffprobe du fichier produit, JAMAIS sur la fin du dernier caractère —
 *     un segment se termine par du silence, et prendre la fin du texte décalerait tous les
 *     sous-titres suivants un peu plus tôt à chaque segment.
 */
const DEFAULT_MAX_CHARS = 800;
/** Modèle de repli si le modèle configuré n'accepte pas /with-timestamps (voir plus bas). */
const TIMESTAMPS_FALLBACK_MODEL = "eleven_multilingual_v2";

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/** Paragraphes regroupés en segments de <= maxChars, sans jamais couper au milieu d'une phrase. */
export function splitForSynthesis(text: string, maxChars: number): string[] {
  if (maxChars <= 0 || text.length <= maxChars) return [text];
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  // Un paragraphe seul trop long est recoupé sur les fins de phrase.
  const units: string[] = [];
  for (const p of paras) {
    if (p.length <= maxChars) { units.push(p); continue; }
    let cur = "";
    for (const s of p.split(/(?<=[.!?])\s+/)) {
      if (cur && (cur + " " + s).length > maxChars) { units.push(cur); cur = s; }
      else cur = cur ? `${cur} ${s}` : s;
    }
    if (cur) units.push(cur);
  }

  const chunks: string[] = [];
  let cur = "";
  for (const u of units) {
    if (cur && (cur + "\n\n" + u).length > maxChars) { chunks.push(cur); cur = u; }
    else cur = cur ? `${cur}\n\n${u}` : u;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/**
 * CONTINUITÉ ENTRE SEGMENTS — corrigé le 2026-08-05 après signalement d'un changement d'accent.
 *
 * Défaut : « à 1:42 la voix change et prend un accent différent ». Cause exacte — le découpage
 * envoyait chaque segment SANS lui dire ce qui le précédait. À chaque nouvelle requête le modèle
 * ré-infère l'identité du locuteur à partir du seul texte qu'il reçoit, et comme la stabilité est
 * volontairement basse (0,40, pour obtenir de la variation humaine), il peut atterrir sur un
 * accent différent. Le découpage a résolu la dérive de ton et créé une dérive d'identité.
 *
 * ElevenLabs documente exactement le remède : `previous_text` / `next_text` — « can be used to
 * improve the speech's continuity when concatenating together multiple generations » — et
 * `previous_request_ids`, décrit comme spécifiquement destiné au « splitting up a large task into
 * multiple requests ». On envoie les deux : le texte voisin toujours, l'identifiant de requête
 * précédente quand l'API nous l'a renvoyé.
 */
async function synthesizeChunk(
  chunk: string,
  vc: VoiceConfig,
  modelId: string,
  key: string,
  ctx: { previousText?: string; nextText?: string; previousRequestIds?: string[] } = {},
): Promise<{ audio: Buffer; alignment: Alignment | null; requestId: string | null }> {
  const res = await fetchWithRetry(
    `https://api.elevenlabs.io/v1/text-to-speech/${vc.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text: chunk,
        model_id: modelId,
        ...(ctx.previousText ? { previous_text: ctx.previousText } : {}),
        ...(ctx.nextText ? { next_text: ctx.nextText } : {}),
        ...(ctx.previousRequestIds?.length ? { previous_request_ids: ctx.previousRequestIds.slice(-3) } : {}),
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
  const json = (await res.json()) as {
    audio_base64: string;
    alignment?: Alignment;
    normalized_alignment?: Alignment;
  };
  return {
    audio: Buffer.from(json.audio_base64, "base64"),
    alignment: json.alignment ?? json.normalized_alignment ?? null,
    requestId: res.headers?.get?.("request-id") ?? null,
  };
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

  const maxChars = vc.maxCharsPerRequest ?? DEFAULT_MAX_CHARS;
  const chunks = splitForSynthesis(text, maxChars);
  // NOTE: le hash inclut le découpage — changer maxCharsPerRequest resynthétise, comme il se doit.
  const hash = sha256([text, vc.voiceId, vc.modelId, JSON.stringify(vc.settings), `chunks:${maxChars}|continuity:v1`].join("|"));
  const audioDir = join(projectDir, "assets", "audio");
  const outFile = join(audioDir, "voice.mp3");
  const estCost = round2(text.length * getRates().elevenlabsPerCharUSD);

  const m = readManifest(projectDir);
  if (existsSync(outFile) && m.audio?.hash === hash) {
    log("SKIP", `audio: voice.mp3 up to date (hash ${hash})`);
    return;
  }

  if (dryRun) {
    log("DRY", `audio: would synthesize ${text.length} chars in ${chunks.length} segment(s) of <=${maxChars}, voice=${vc.voiceId}, model=${vc.modelId} — est. $${estCost}`);
    if (vc.voiceId.includes("REMPLIR")) log("WARN", `audio: voiceId not set in ${vcPath}`);
    if (!process.env.ELEVENLABS_API_KEY) log("WARN", "audio: ELEVENLABS_API_KEY missing from .env");
    return;
  }

  if (vc.voiceId.includes("REMPLIR")) throw new Error(`${vcPath}: voiceId is not set`);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing (put it in .env at repo root)");

  mkdirSync(audioDir, { recursive: true });
  const tmpDir = join(audioDir, "_chunks");
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });

  log("INFO", `audio: synthesizing ${text.length} chars in ${chunks.length} segment(s) with ElevenLabs (${vc.modelId})…`);

  /**
   * Repli de modèle. `/with-timestamps` exige un modèle qui expose l'alignement caractère par
   * caractère, et la doc ElevenLabs ne garantit pas que ce soit le cas de tous les modèles. Si le
   * modèle configuré est refusé, on bascule UNE fois sur un modèle connu pour le supporter plutôt
   * que de planter au premier segment — mais on le dit fort, parce que la voix ne sonnera pas
   * comme celle qui a été choisie.
   */
  let modelId = vc.modelId;
  const parts: string[] = [];
  const chars: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;

  const requestIds: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    // Le modèle doit savoir ce qui précède ET ce qui suit, sinon il ré-invente le locuteur.
    const ctx = {
      previousText: i > 0 ? chunks[i - 1] : undefined,
      nextText: i + 1 < chunks.length ? chunks[i + 1] : undefined,
      previousRequestIds: requestIds,
    };
    let out: { audio: Buffer; alignment: Alignment | null; requestId: string | null };
    try {
      out = await synthesizeChunk(chunks[i], vc, modelId, key, ctx);
    } catch (e) {
      /**
       * NE BASCULER QUE SUR UNE INCOMPATIBILITÉ DE MODÈLE — corrigé le 2026-08-05.
       *
       * La première version basculait sur N'IMPORTE QUELLE erreur. Un HTTP 401 « paiement en
       * échec » a donc été annoncé comme « le modèle eleven_v3 a été refusé », envoyant chercher
       * un problème dans voice-config.json alors que la facture ElevenLabs était impayée. Un
       * repli n'a de sens que si la cause est plausiblement le modèle : 400 / 422. Une erreur
       * d'authentification, de paiement ou de quota doit remonter TELLE QUELLE, immédiatement.
       */
      const msg = (e as Error).message;
      const status = Number(/HTTP (\d{3})/.exec(msg)?.[1] ?? 0);
      const modelCouldBeTheCause = status === 400 || status === 422;
      if (/payment|invoice|quota|unauthor/i.test(msg) || status === 401 || status === 402 || status === 429) {
        throw new Error(
          `audio: ElevenLabs a refusé la requête pour une raison de COMPTE, pas de modèle — ${msg}\n` +
          `        → vérifier l'abonnement, la facturation et le quota sur elevenlabs.io. ` +
          `Ni voice-config.json ni le script ne sont en cause.`,
        );
      }
      if (!modelCouldBeTheCause || modelId === TIMESTAMPS_FALLBACK_MODEL) throw e;
      log("WARN", `audio: le modèle "${modelId}" a été refusé par /with-timestamps (${msg}). Repli sur "${TIMESTAMPS_FALLBACK_MODEL}" — la voix ne sera PAS celle configurée, corrige voice-config.json.`);
      modelId = TIMESTAMPS_FALLBACK_MODEL;
      out = await synthesizeChunk(chunks[i], vc, modelId, key, ctx);
    }
    if (out.requestId) requestIds.push(out.requestId);

    const part = join(tmpDir, `${String(i).padStart(2, "0")}.mp3`);
    writeFileSync(part, out.audio);
    parts.push(part);

    if (i > 0) {
      // Rendre au flux de caractères la coupure de paragraphe retirée par le découpage, sinon le
      // dernier mot d'un segment se colle au premier du suivant dans les sous-titres.
      for (const c of "\n\n") { chars.push(c); starts.push(offset); ends.push(offset); }
    }
    if (out.alignment?.characters) {
      const a = out.alignment;
      for (let k = 0; k < a.characters.length; k++) {
        chars.push(a.characters[k]);
        starts.push(round2(a.character_start_times_seconds[k] + offset));
        ends.push(round2(a.character_end_times_seconds[k] + offset));
      }
    }
    // Décalage mesuré sur le fichier, pas sur la fin du texte — voir le commentaire CHUNKING.
    offset = round2(offset + ffprobeDuration(part));
    log("INFO", `audio: segment ${i + 1}/${chunks.length} — ${chunks[i].length} car., cumul ${offset}s`);
  }

  if (parts.length === 1) {
    writeFileSync(outFile, readFileSync(parts[0]));
  } else {
    const list = join(tmpDir, "concat.txt");
    writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n");
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", outFile]);
  }
  rmSync(tmpDir, { recursive: true, force: true });

  const alignment = chars.length
    ? { characters: chars, character_start_times_seconds: starts, character_end_times_seconds: ends }
    : null;
  if (!alignment) log("WARN", "audio: aucun alignement renvoyé — les sous-titres seront absents");
  writeFileSync(join(audioDir, "timestamps.json"), JSON.stringify(alignment));

  const durationSec = round2(ffprobeDuration(outFile));
  const words = text.split(/\s+/).filter(Boolean).length;
  writeFragment(projectDir, "audio", {
    file: "assets/audio/voice.mp3",
    durationSec,
    voiceId: vc.voiceId,
    hash,
    costUSD: estCost,
    generatedAt: new Date().toISOString(),
  });
  log("COST", `audio: $${estCost} (${text.length} chars, ${chunks.length} segment(s), modèle ${modelId})`);
  // Le débit réel est une constante d'instrument : le preset s'en sert pour dimensionner les
  // scènes. On le RELÈVE à chaque génération plutôt que de le supposer (cf. §SCRIPT STRUCTURE).
  log("INFO", `audio: done — ${durationSec}s · ${words} mots · DÉBIT MESURÉ ${Math.round((words / durationSec) * 60)} mots/minute`);
}
