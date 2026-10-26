import { randomUUID } from "crypto";
import { extractLetterTokens, toComplaintPayload } from "./extract";
import { routeComplaint } from "./router/routeComplaint";
import type { RoutingDecision } from "./router/types";
import { appendTrace } from "./trace";
import {
  buildWorldContext,
  createWorld,
  observe,
  serializeWorld,
  upsertEntity,
} from "./worldModel";
import { loadSchemeRules } from "./zetaris";
import { chatCompletion, sampleMode } from "./meterless";
import { fetchSchemePortal, type PortalFetchResult } from "./brightdata";

export type PackSection = {
  id: string;
  title: string;
  body: string;
  approved: boolean;
};

export type PipelineResult = {
  trace_id: string;
  extracted: Awaited<ReturnType<typeof extractLetterTokens>>;
  decision: RoutingDecision;
  schemeSource: "zetaris" | "sample";
  portalFetch: PortalFetchResult | null;
  pack: PackSection[];
  world: ReturnType<typeof serializeWorld>;
  worldContext: ReturnType<typeof buildWorldContext>;
  meterlessMode: string;
};

function draftPack(
  decision: RoutingDecision,
  extracted: Awaited<ReturnType<typeof extractLetterTokens>>,
  letterExcerpt: string,
  portalFetch: PortalFetchResult | null
): PackSection[] {
  const scheme = decision.targetScheme ?? "NONE";
  return [
    {
      id: "facts",
      title: "I. Chronology & facts",
      body: `${extracted.summary}\n\nScheme target: ${scheme}\nStatus: ${decision.status}\n\nLetter excerpt:\n${letterExcerpt.slice(0, 800)}`,
      approved: false,
    },
    {
      id: "eligibility",
      title: "II. Eligibility & gate reasons",
      body: decision.reasons.join("\n"),
      approved: false,
    },
    {
      id: "remedy",
      title: "III. Requested redress",
      body:
        decision.status === "ELIGIBLE"
          ? "Seek fair resolution consistent with the scheme rules: refund of disputed charges, interest where applicable, and apology for service failure."
          : decision.actionRequired ??
            decision.advisoryNote ??
            "Do not submit a standard pack until eligibility is restored.",
      approved: false,
    },
    {
      id: "portal",
      title: "IV. Next step / portal",
      body: [
        decision.portalUrl && decision.status === "ELIGIBLE"
          ? `Next steps: log on to the designated scheme portal (${decision.portalUrl}) and fill out their complaint form using the data collated in this Gate Pack. ComplaintPath does not file for you.`
          : "No portal yet — resolve the gate blocker first. ComplaintPath does not file for you.",
        decision.portalUrl ? `Portal: ${decision.portalUrl}` : "",
        decision.advisoryNote ? `Note: ${decision.advisoryNote}` : "",
        portalFetch
          ? `\nLive portal check (${portalFetch.source}/${portalFetch.status}):\n${portalFetch.excerpt}`
          : "",
        portalFetch?.error ? `Fetch note: ${portalFetch.error}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      approved: false,
    },
  ];
}

async function enrichPackWithModel(
  pack: PackSection[],
  decision: RoutingDecision
): Promise<PackSection[]> {
  if (sampleMode() || decision.status !== "ELIGIBLE") return pack;
  try {
    const { text } = await chatCompletion(
      [
        {
          role: "system",
          content:
            "Tighten section III redress wording for a UK ombudsman pack. Return plain text only, max 120 words. No invented dates or award amounts.",
        },
        { role: "user", content: pack[2].body },
      ],
      { forceLive: true }
    );
    if (text) {
      return pack.map((s, i) => (i === 2 ? { ...s, body: text } : s));
    }
  } catch {
    /* keep deterministic draft */
  }
  return pack;
}

/** Multi-agent style pipeline with shared World Model + critique/block. */
export async function runComplaintPipeline(
  letter: string,
  todayIso?: string
): Promise<PipelineResult> {
  const trace_id = `run_${randomUUID().slice(0, 8)}`;
  const world = createWorld(trace_id);
  const meterlessMode = process.env.METERLESS_MODEL || "meterless/auto";

  await appendTrace({
    timestamp: new Date().toISOString(),
    trace_id,
    agent_name: "Orchestrator",
    action: "start_run",
    input_summary: `letter_chars=${letter.length}`,
    status: "success",
  });

  const { rules, source: schemeSource } = await loadSchemeRules();
  await appendTrace({
    timestamp: new Date().toISOString(),
    trace_id,
    agent_name: "DataRetrieverAgent",
    action: "load_scheme_rules",
    output_summary: `${rules.length} rules via ${schemeSource}`,
    target_agent: "ExtractorAgent",
    status: "success",
  });

  for (const rule of rules) {
    upsertEntity(world, {
      type: "scheme",
      name: rule.scheme_id,
      properties: rule as unknown as Record<string, unknown>,
      agentId: "DataRetrieverAgent",
      confidence: schemeSource === "zetaris" ? 0.95 : 0.7,
    });
  }

  const extracted = await extractLetterTokens(letter);
  await appendTrace({
    timestamp: new Date().toISOString(),
    trace_id,
    agent_name: "ExtractorAgent",
    action: "extract_tokens",
    output_summary: `${extracted.sector} via ${extracted.via}: ${extracted.summary}`,
    target_agent: "GateAgent",
    confidence: extracted.via === "nightshift" ? 0.85 : 0.6,
    status: "success",
  });

  upsertEntity(world, {
    type: "complaint_extract",
    name: extracted.firmName ?? "unknown_firm",
    properties: { ...extracted },
    agentId: "ExtractorAgent",
  });
  observe(world, {
    agentId: "ExtractorAgent",
    kind: "extraction",
    summary: extracted.summary,
  });

  const payload = toComplaintPayload(extracted, todayIso);
  let decision = routeComplaint(payload);

  // Critique / block: GateAgent is authority — never emit ELIGIBLE pack if dates missing for letter path
  if (
    extracted.sector === "financial" &&
    extracted.hasFinalResponseLetter &&
    !extracted.finalResponseLetterDate
  ) {
    decision = {
      targetScheme: null,
      status: "PREMATURE",
      reasons: [
        "Evaluator blocked eligibility: final response indicated but date missing — refusing to invent a date.",
      ],
      actionRequired: "Provide the Final Response Letter date.",
    };
    await appendTrace({
      timestamp: new Date().toISOString(),
      trace_id,
      agent_name: "EvidenceEvaluatorAgent",
      action: "block_undated_frl",
      output_summary: "Blocked undated FRL path",
      target_agent: "GateAgent",
      status: "needs_revision",
    });
  }

  await appendTrace({
    timestamp: new Date().toISOString(),
    trace_id,
    agent_name: "GateAgent",
    action: "route_complaint",
    output_summary: `${decision.status} → ${decision.targetScheme}`,
    target_agent: "PackWriterAgent",
    status: "success",
  });

  upsertEntity(world, {
    type: "routing_decision",
    name: decision.targetScheme ?? "blocked",
    properties: { ...decision },
    agentId: "GateAgent",
    confidence: 1,
  });
  observe(world, {
    agentId: "GateAgent",
    kind: "gate",
    summary: `${decision.status}: ${decision.reasons[0] ?? ""}`,
  });

  let portalFetch: PortalFetchResult | null = null;
  if (decision.portalUrl) {
    portalFetch = await fetchSchemePortal(decision.portalUrl);
    await appendTrace({
      timestamp: new Date().toISOString(),
      trace_id,
      agent_name: "WebRetrieverAgent",
      action: "fetch_scheme_portal",
      output_summary: `${portalFetch.source}/${portalFetch.status} ${decision.portalUrl}`,
      target_agent: "PackWriterAgent",
      status: portalFetch.status === "error" ? "needs_revision" : "success",
    });
    upsertEntity(world, {
      type: "portal_snapshot",
      name: decision.targetScheme ?? "portal",
      properties: { ...portalFetch },
      agentId: "WebRetrieverAgent",
      confidence: portalFetch.source === "brightdata" ? 0.85 : 0.5,
    });
    observe(world, {
      agentId: "WebRetrieverAgent",
      kind: "portal_fetch",
      summary: `${portalFetch.source}: ${portalFetch.excerpt.slice(0, 160)}`,
    });
  }

  let pack = draftPack(decision, extracted, letter, portalFetch);
  pack = await enrichPackWithModel(pack, decision);

  await appendTrace({
    timestamp: new Date().toISOString(),
    trace_id,
    agent_name: "PackWriterAgent",
    action: "draft_pack",
    output_summary: `${pack.length} sections; status=${decision.status}`,
    target_agent: "FinalReviewerAgent",
    status: "success",
  });

  // Final reviewer: time-barred / premature packs cannot be auto-approved
  if (decision.status !== "ELIGIBLE") {
    pack = pack.map((s) => ({ ...s, approved: false }));
    await appendTrace({
      timestamp: new Date().toISOString(),
      trace_id,
      agent_name: "FinalReviewerAgent",
      action: "lock_approvals",
      output_summary: "Non-eligible gate — pack sections remain unapproved",
      status: "success",
    });
  } else {
    await appendTrace({
      timestamp: new Date().toISOString(),
      trace_id,
      agent_name: "FinalReviewerAgent",
      action: "await_human_approve",
      output_summary: "Eligible — human must approve each section before export",
      status: "success",
    });
  }

  const worldContext = buildWorldContext(world);
  return {
    trace_id,
    extracted,
    decision,
    schemeSource,
    portalFetch,
    pack,
    world: serializeWorld(world),
    worldContext,
    meterlessMode,
  };
}
