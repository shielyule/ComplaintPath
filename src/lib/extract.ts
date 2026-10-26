import type { ComplaintPayload } from "./router/types";
import { chatCompletion, sampleMode } from "./meterless";

export type ExtractedLetter = {
  sector: ComplaintPayload["sector"];
  firmName?: string;
  firmStatus?: "ACTIVE" | "IN_DEFAULT" | "UNKNOWN";
  complaintRaisedDate?: string;
  hasFinalResponseLetter?: boolean;
  finalResponseLetterDate?: string;
  hasDeadlockLetter?: boolean;
  deadlockLetterDate?: string;
  raisedWithDpoDate?: string;
  hasDpoFinalResponse?: boolean;
  seekingFinancialDamagesOnly?: boolean;
  landType?: "PRIVATE" | "COUNCIL";
  privateTradeBody?: "BPA" | "IPC" | "UNKNOWN";
  operatorRejectionDate?: string;
  summary: string;
  rawModelJson?: string;
  via: "nightshift" | "xai" | "sample" | "heuristic";
};

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function parseIsoDate(raw: RegExpMatchArray): string | undefined {
  if (raw[2]?.match(/^[A-Za-z]+$/)) {
    const m = MONTHS[raw[2].toLowerCase()];
    if (!m) return undefined;
    return `${raw[3]}-${m}-${raw[1]!.padStart(2, "0")}`;
  }
  return `${raw[1]}-${raw[2]!.padStart(2, "0")}-${raw[3]!.padStart(2, "0")}`;
}

function firstDateIn(text: string): string | undefined {
  const m =
    text.match(
      /\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/
    ) ||
    text.match(
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i
    );
  return m ? parseIsoDate(m) : undefined;
}

/** Holding / ack letters often mention “Final Response” in the negative. */
function isExplicitHoldingOrNonFrl(lower: string): boolean {
  return (
    /\bnot\s+(our\s+)?final\s+response\b/.test(lower) ||
    /\bthis\s+letter\s+is\s+not\b.{0,60}\bfinal\s+response\b/.test(lower) ||
    /\backnowledg(?:e|ement|ment)\s+of\s+complaint\b/.test(lower) ||
    /\bstill\s+investigating\b/.test(lower) ||
    /\bwe\s+are\s+investigating\b/.test(lower) ||
    /\bdo\s+not\s+escalate\b/.test(lower) ||
    /\buntil\s+we\s+issue\s+(a\s+)?final\s+response\b/.test(lower) ||
    /\baim\s+to\s+respond\s+fully\s+within\s+eight\s+weeks\b/.test(lower)
  );
}

function isAffirmativeFinalResponse(lower: string): boolean {
  if (isExplicitHoldingOrNonFrl(lower)) return false;
  return (
    /\bthis\s+(constitutes|is|represents)\s+our\s+final\s+response\b/.test(
      lower
    ) ||
    /\bfinal\s+response\s+under\s+(the\s+)?(fca\s+)?disp\b/.test(lower) ||
    /\bcomplaint\s+final\s+response\b/.test(lower) ||
    /\bthis\s+is\s+our\s+final\s+decision\b/.test(lower) ||
    (/\bfinal\s+response\b/.test(lower) && /\bdisp\b/.test(lower))
  );
}

function extractComplaintRaisedDate(
  letter: string,
  fallback?: string
): string | undefined {
  const patterns = [
    /complaint\s+dated\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})/i,
    /(?:thank you for your|further to your)\s+letter\s+of\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})/i,
    /complaint\s+of\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})/i,
    /subject\s+access\s+request\s+of\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})/i,
    /(?:sar|request)\s+of\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})/i,
  ];
  for (const re of patterns) {
    const m = letter.match(re);
    if (m?.[1]) {
      const iso = firstDateIn(m[1]);
      if (iso) return iso;
    }
  }
  return fallback;
}

function heuristicExtract(letter: string): ExtractedLetter {
  const lower = letter.toLowerCase();
  const letterDate = firstDateIn(letter);

  const isEnergy =
    lower.includes("energy") ||
    lower.includes("ofgem") ||
    lower.includes("deadlock") ||
    (lower.includes("supplier") && lower.includes("ombudsman"));
  const isIco =
    lower.includes("gdpr") ||
    lower.includes("data protection") ||
    lower.includes("subject access") ||
    (lower.includes("dpo") && !lower.includes("ombudsman"));
  const isParking =
    lower.includes("parking") ||
    lower.includes("pcn") ||
    lower.includes("popla");

  if (isParking) {
    return {
      sector: "parking",
      landType: "PRIVATE",
      privateTradeBody: lower.includes("ipc") ? "IPC" : "BPA",
      operatorRejectionDate: letterDate,
      summary: "Heuristic: parking operator rejection detected.",
      via: "heuristic",
    };
  }
  if (isIco) {
    const sarOrComplaintDate = extractComplaintRaisedDate(letter);
    const hasFinal =
      !isExplicitHoldingOrNonFrl(lower) &&
      (lower.includes("final position") ||
        lower.includes("final response") ||
        lower.includes("disclosed the personal data"));
    return {
      sector: "data_privacy",
      firmName: letter.match(
        /^([A-Z][A-Za-z0-9 &.'-]{2,}(?:\s+(?:COUNCIL|PLC|LTD|LIMITED))?)/m
      )?.[1]?.trim(),
      // Clock for ICO: date of DPO reply / letter; SAR date is separate context
      raisedWithDpoDate: letterDate ?? sarOrComplaintDate,
      complaintRaisedDate: sarOrComplaintDate,
      hasDpoFinalResponse: hasFinal,
      seekingFinancialDamagesOnly:
        lower.includes("compensation") || lower.includes("damages"),
      summary: hasFinal
        ? `Heuristic: DPO final position${letterDate ? ` dated ${letterDate}` : ""}${sarOrComplaintDate ? `; SAR/complaint referenced ${sarOrComplaintDate}` : ""}.`
        : "Heuristic: data protection correspondence — DPO process may still be open.",
      via: "heuristic",
    };
  }
  if (isEnergy) {
    const hasDeadlock =
      lower.includes("deadlock") && !isExplicitHoldingOrNonFrl(lower);
    return {
      sector: "energy",
      complaintRaisedDate:
        extractComplaintRaisedDate(letter, letterDate) ?? "2026-01-01",
      hasDeadlockLetter: hasDeadlock,
      deadlockLetterDate: hasDeadlock ? letterDate : undefined,
      summary: hasDeadlock
        ? "Heuristic: energy deadlock letter detected."
        : "Heuristic: energy correspondence — no clear deadlock yet.",
      via: "heuristic",
    };
  }

  const holding = isExplicitHoldingOrNonFrl(lower);
  const hasFrl = !holding && isAffirmativeFinalResponse(lower);
  const complaintRaisedDate =
    extractComplaintRaisedDate(letter, undefined) ??
    (hasFrl ? undefined : letterDate) ??
    letterDate;

  return {
    sector: "financial",
    firmStatus: "ACTIVE",
    firmName: letter.match(
      /^([A-Z][A-Z0-9 &.'-]{2,}(?:\s+(?:PLC|LTD|LIMITED|BANK|INSURANCE|UK))?)/m
    )?.[1]?.trim(),
    complaintRaisedDate: complaintRaisedDate ?? letterDate ?? "2026-01-01",
    hasFinalResponseLetter: hasFrl,
    finalResponseLetterDate: hasFrl ? letterDate : undefined,
    summary: holding
      ? "Heuristic: holding / acknowledgement — not a Final Response (premature to escalate)."
      : hasFrl
        ? "Heuristic: affirmative Final Response detected."
        : "Heuristic: financial correspondence without clear Final Response.",
    via: "heuristic",
  };
}

export async function extractLetterTokens(
  letter: string
): Promise<ExtractedLetter> {
  const system = `Extract UK complaint letter facts as ONE JSON object only (no markdown).
Keys: sector (financial|energy|data_privacy|parking), firmName, firmStatus (ACTIVE|IN_DEFAULT|UNKNOWN),
complaintRaisedDate, hasFinalResponseLetter, finalResponseLetterDate, hasDeadlockLetter, deadlockLetterDate,
raisedWithDpoDate, hasDpoFinalResponse, seekingFinancialDamagesOnly, landType (PRIVATE|COUNCIL|null),
privateTradeBody (BPA|IPC|UNKNOWN|null), operatorRejectionDate, summary.
Dates YYYY-MM-DD or null — never invent dates.
If letter says NOT a Final Response / acknowledgement / still investigating → hasFinalResponseLetter=false.`;

  if (!sampleMode()) {
    const { text, via } = await chatCompletion(
      [
        { role: "system", content: system },
        { role: "user", content: letter.slice(0, 6000) },
      ],
      {
        forceLive: true,
        model: process.env.METERLESS_EXTRACT_MODEL || "meterless/auto",
      }
    );
    if (!text) throw new Error("Empty AI extract reply");
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error("AI extract reply had no JSON object");
    }
    const jsonSlice = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(jsonSlice) as ExtractedLetter;
    if (!parsed.sector || !parsed.summary) {
      throw new Error("AI JSON missing sector/summary");
    }
    return {
      ...parsed,
      rawModelJson: jsonSlice,
      via: via === "xai" ? "xai" : "nightshift",
    };
  }

  return heuristicExtract(letter);
}

export function toComplaintPayload(
  extracted: ExtractedLetter,
  todayIso?: string
): ComplaintPayload {
  const today = todayIso ?? new Date().toISOString().split("T")[0];
  switch (extracted.sector) {
    case "energy":
      return {
        sector: "energy",
        todayIso: today,
        complaintRaisedDate: extracted.complaintRaisedDate ?? today,
        hasDeadlockLetter: Boolean(extracted.hasDeadlockLetter),
        deadlockLetterDate: extracted.deadlockLetterDate,
      };
    case "data_privacy":
      return {
        sector: "data_privacy",
        todayIso: today,
        raisedWithDpoDate: extracted.raisedWithDpoDate,
        hasDpoFinalResponse: Boolean(extracted.hasDpoFinalResponse),
        seekingFinancialDamagesOnly: Boolean(
          extracted.seekingFinancialDamagesOnly
        ),
      };
    case "parking":
      return {
        sector: "parking",
        todayIso: today,
        landType: extracted.landType ?? "PRIVATE",
        privateTradeBody: extracted.privateTradeBody ?? "UNKNOWN",
        operatorRejectionDate: extracted.operatorRejectionDate,
      };
    default:
      return {
        sector: "financial",
        todayIso: today,
        firmStatus: extracted.firmStatus ?? "ACTIVE",
        complaintRaisedDate: extracted.complaintRaisedDate ?? today,
        hasFinalResponseLetter: Boolean(extracted.hasFinalResponseLetter),
        finalResponseLetterDate: extracted.finalResponseLetterDate,
      };
  }
}
