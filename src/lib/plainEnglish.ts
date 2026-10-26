import type { PipelineResult } from "./runPipeline";
import type { ResolutionStatus } from "./router/types";
import { gateUiLabel } from "./gateLabels";

const SCHEME_PLAIN: Record<string, string> = {
  FOS: "the Financial Ombudsman Service (FOS)",
  ENERGY_OMBUDSMAN: "the Energy Ombudsman",
  ICO: "the Information Commissioner’s Office (ICO)",
  POPLA: "POPLA (private parking appeals)",
  IAS: "the Independent Appeals Service",
  TPT: "the Traffic Penalty Tribunal",
  LONDON_TRIBUNALS: "London Tribunals",
  FSCS_REDIRECT: "FOS instead of FSCS (firm looks solvent)",
};

export function schemePlain(id: string | null | undefined): string {
  if (!id) return "no open scheme door yet";
  return SCHEME_PLAIN[id] ?? id;
}

/** One calm paragraph for the extract stage. */
export function extractStory(result: PipelineResult): string {
  const e = result.extracted;
  const who = e.firmName || "the organisation in your letter";
  const bits: string[] = [];
  bits.push(`We read your letter as correspondence from ${who}.`);
  if (e.hasFinalResponseLetter) {
    bits.push(
      e.finalResponseLetterDate
        ? `It looks like a Final Response dated ${e.finalResponseLetterDate}.`
        : "It looks like a Final Response, but we could not safely read the date."
    );
  } else if (e.hasDeadlockLetter) {
    bits.push(
      e.deadlockLetterDate
        ? `It looks like an energy deadlock / final position dated ${e.deadlockLetterDate}.`
        : "It looks like an energy deadlock / final position."
    );
  } else {
    bits.push(`Sector guess: ${e.sector.replace("_", " ")}. ${e.summary}`);
  }
  bits.push(
    "Next we apply hard scheme rules (clocks and doors). We never invent missing dates."
  );
  return bits.join(" ");
}

/** Plain-English gate story + what to do next. */
export function gateStory(result: PipelineResult): {
  headline: string;
  story: string;
  nextSteps: string;
} {
  const { decision, extracted } = result;
  const status = decision.status as ResolutionStatus;
  const who = extracted.firmName || "the firm";
  const label = gateUiLabel(status);
  const door = schemePlain(decision.targetScheme);

  switch (status) {
    case "ELIGIBLE":
      return {
        headline: `Eligible — you can prepare a pack for ${door}`,
        story: `Your challenge with ${who} has reached a point where escalation looks open. ${extracted.summary} The gate result is “${label}” toward ${door}.`,
        nextSteps: `Next you will open the Human Verification Gate (sections I–IV). Read each section, edit if needed by re-running with clearer text, then Approve all four. Only then can you download the pack and start a complaint on the official portal — we do not send it for you.`,
      };
    case "PREMATURE":
      return {
        headline: "Premature — too early to escalate",
        story: `From this letter it looks like ${who} has not finished their process (or a required date is missing). ${extracted.summary}`,
        nextSteps:
          decision.actionRequired ||
          "Wait for a Final Response / deadlock letter, or supply the missing date, then run again. Starting an ombudsman case now risks rejection as premature.",
      };
    case "TIME_BARRED":
      return {
        headline: "Out of time — the statutory clock looks closed",
        story: `The limitation window for this path appears to have passed relative to the letter date and today’s as-of date. ${decision.reasons[0] ?? ""}`,
        nextSteps:
          decision.actionRequired ||
          "Check exceptional circumstances with the scheme, or take legal advice. We will not unlock a standard “in time” pack.",
      };
    case "REDIRECT_REQUIRED":
      return {
        headline: "Wrong door — use a different route",
        story: `This letter should not go to the door people often guess first. ${decision.reasons.join(" ")}`,
        nextSteps:
          decision.actionRequired ||
          `Follow the redirect toward ${door}. Do not file on the wrong portal.`,
      };
  }
}

export const SCHEME_LINKS: { name: string; href: string }[] = [
  {
    name: "Financial Ombudsman Service (FOS)",
    href: "https://www.financial-ombudsman.org.uk/",
  },
  {
    name: "Energy Ombudsman",
    href: "https://www.energyombudsman.org/",
  },
  {
    name: "Housing Ombudsman",
    href: "https://www.housing-ombudsman.org.uk/",
  },
  {
    name: "Legal Ombudsman",
    href: "https://www.legalombudsman.org.uk/",
  },
  {
    name: "Information Commissioner's Office (ICO)",
    href: "https://ico.org.uk/",
  },
];
