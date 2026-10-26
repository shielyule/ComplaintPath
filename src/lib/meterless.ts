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

  // Hackathon rule: Nightshift is primary. xAI only if AI_PREFER=xai or
  // ALLOW_XAI_FALLBACK=true (off for demo recording).
  const prefer =
    (process.env.AI_PREFER || "nightshift").toLowerCase() === "xai"
      ? "xai"
      : "nightshift";
  const allowXaiFallback =
    (process.env.ALLOW_XAI_FALLBACK || "").toLowerCase() === "true";

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
    // Nemotron occasionally returns empty_response — retry before giving up
    let last: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await completeWith(nightshift, model, messages, "nightshift");
      } catch (err) {
        last = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!/empty_response|502|499|timeout|aborted/i.test(msg)) throw err;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    throw last instanceof Error
      ? last
      : new Error(`Nightshift failed after retries: ${String(last)}`);
  };

  if (prefer === "xai") {
    try {
      return await tryXai();
    } catch {
      return tryNightshift();
    }
  }

  try {
    return await tryNightshift();
  } catch (nsErr) {
    if (allowXaiFallback && getXaiClient()) {
      try {
        return await tryXai();
      } catch (xErr) {
        const a = nsErr instanceof Error ? nsErr.message : String(nsErr);
        const b = xErr instanceof Error ? xErr.message : String(xErr);
        throw new Error(`AI extract failed. Nightshift: ${a}. xAI: ${b}`);
      }
    }
    throw nsErr instanceof Error
      ? nsErr
      : new Error(`Nightshift extract failed: ${String(nsErr)}`);
  }
}
