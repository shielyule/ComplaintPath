import OpenAI from "openai";

export function sampleMode(): boolean {
  return (process.env.SAMPLE_MODE ?? "true").toLowerCase() === "true";
}

export function getMeterlessClient(): OpenAI | null {
  const baseURL = process.env.METERLESS_BASE_URL;
  const apiKey =
    process.env.METERLESS_RUNTIME_TOKEN || process.env.METERLESS_API_KEY;
  if (!baseURL || !apiKey) return null;
  return new OpenAI({
    baseURL,
    apiKey,
    timeout: 120_000,
    maxRetries: 1,
    defaultHeaders: {
      "meterless-app": "complaintpath",
      "meterless-scope": "user",
    },
  });
}

export function getXaiClient(): OpenAI | null {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1",
    timeout: 90_000,
    maxRetries: 1,
  });
}

export type LlmVia = "nightshift" | "xai" | "sample";

async function completeWith(
  client: OpenAI,
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  via: LlmVia
): Promise<{ text: string; model: string; via: LlmVia }> {
  const reply = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.1,
    max_tokens: 900,
  });
  const text = reply.choices[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error(`Empty ${via} reply`);
  return { text, model: reply.model || model, via };
}

/**
 * Live LLM: Nightshift first (Nemotron), then xAI backup for demo reliability.
 * SAMPLE_MODE=true → empty sample (callers use heuristic).
 */
export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: { forceLive?: boolean; model?: string }
): Promise<{ text: string; model: string; via: LlmVia }> {
  const useSample = sampleMode() && !opts?.forceLive;
  if (useSample) {
    return { text: "", model: "sample", via: "sample" };
  }

  // Primary = Nightshift (hackathon rule). xAI only if Nightshift fails / AI_PREFER=xai.
  const preferXai =
    (process.env.AI_PREFER || "").toLowerCase() === "xai" && getXaiClient();

  const tryXai = async () => {
    const xai = getXaiClient();
    if (!xai) throw new Error("XAI_API_KEY not configured");
    const xaiModel =
      process.env.XAI_MODEL?.trim() || "grok-4-fast-non-reasoning";
    return completeWith(xai, xaiModel, messages, "xai");
  };

  const tryNightshift = async () => {
    const nightshift = getMeterlessClient();
    if (!nightshift) throw new Error("Nightshift not configured");
    const model =
      opts?.model ||
      process.env.METERLESS_EXTRACT_MODEL ||
      process.env.METERLESS_MODEL ||
      "meterless/auto";
    return completeWith(nightshift, model, messages, "nightshift");
  };

  let lastErr: unknown;
  const order = preferXai
    ? [tryXai, tryNightshift]
    : [tryNightshift, tryXai];

  for (const fn of order) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }

  throw new Error(
    lastErr instanceof Error
      ? `AI extract failed after Nightshift/xAI: ${lastErr.message}`
      : "AI extract failed (no LLM available)."
  );
}
