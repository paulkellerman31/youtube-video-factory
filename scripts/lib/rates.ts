/**
 * Configurable cost table — estimates for budgeting/logging, NOT authoritative billing.
 * Do not hardcode prices elsewhere. Override via env (or .env):
 *   RATE_ELEVENLABS_PER_CHAR, RATE_GPTIMAGE_LOW, RATE_GPTIMAGE_MEDIUM, RATE_GPTIMAGE_HIGH
 */
export interface Rates {
  elevenlabsPerCharUSD: number;
  gptImage1PerImageUSD: Record<"low" | "medium" | "high", number>;
}

const num = (v: string | undefined, d: number): number =>
  v !== undefined && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : d;

export function getRates(): Rates {
  return {
    // ~ElevenLabs Creator-tier effective rate; adjust to your plan.
    elevenlabsPerCharUSD: num(process.env.RATE_ELEVENLABS_PER_CHAR, 0.00011),
    // gpt-image-1.5 (défaut prod depuis 2026-06-13) landscape 1536x1024, coût/image par palier.
    // Tarif doc OpenAI ; confirmer via usage facturé. Override possible par env RATE_GPTIMAGE_*.
    gptImage1PerImageUSD: {
      low: num(process.env.RATE_GPTIMAGE_LOW, 0.02),
      medium: num(process.env.RATE_GPTIMAGE_MEDIUM, 0.05),
      high: num(process.env.RATE_GPTIMAGE_HIGH, 0.2),
    },
  };
}
