"use client";

import { useMemo, useState } from "react";
import type { PipelineResult, PackSection } from "@/lib/runPipeline";
import type { ResolutionStatus } from "@/lib/router/types";
import { gateTone, gateUiLabel, HOME_STEPS, type StepId } from "@/lib/gateLabels";
import { extractStory, gateStory, SCHEME_LINKS } from "@/lib/plainEnglish";
import { downloadPackFiles, nextStepsInstruction } from "@/lib/packExport";
import { BrandWordmark } from "./BrandMark";
import { HomeLanding } from "./HomeLanding";
import { InfoTip, StageBack } from "./InfoTip";

const SAMPLE_LETTER = `Caledonian Trust Bank PLC
Customer Relations Centre, PO Box 412, Edinburgh EH1 1YZ
Date: 14 July 2026
Our Ref: CTB-99201-FRL

Dear Ms. Miller,

COMPLAINT FINAL RESPONSE: UNAUTHORISED DIRECT DEBIT CHARGES

We have concluded our investigation into your complaint dated 2 June 2026 regarding
disputed debit entries totaling £1,420.00.

Our records confirm these transactions were authenticated via your registered mobile
device. Consequently, we are not upholding your claim for reimbursement.

This constitutes our Final Response on the matter. You now have the right to refer your
complaint to the Financial Ombudsman Service. You must do so within six months of the
date of this letter. We enclose a copy of the Financial Ombudsman Service explanatory
leaflet for your reference.`;

const SCHEME_NAME: Record<string, string> = {
  FOS: "Financial Ombudsman Service",
  ENERGY_OMBUDSMAN: "Energy Ombudsman",
  ICO: "Information Commissioner's Office",
  POPLA: "POPLA",
  IAS: "IAS",
  TPT: "Traffic Penalty Tribunal",
  LONDON_TRIBUNALS: "London Tribunals",
  FSCS_REDIRECT: "FSCS → redirect to FOS",
};

type FlowStep = StepId;

function activeNavId(step: FlowStep): StepId {
  if (step === "landing" || step === "intake") return "intake";
  return step;
}

function ShellHeader({
  step,
  onBrand,
}: {
  step: FlowStep;
  onBrand: () => void;
}) {
  const active = activeNavId(step);
  return (
    <header className="sticky top-0 z-50 border-b border-surface-highest bg-surface">
      <div className="border-b border-surface-highest bg-surface-low">
        <div className="mx-auto flex max-w-civic flex-wrap items-center justify-between gap-2 px-5 py-1.5 md:px-12">
          <div className="flex flex-wrap items-center gap-3 font-label text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
            <span>Public non-advisory service</span>
            <span className="text-outline-variant">•</span>
            <span>Schedule 17 FSMA &amp; prescribed schemes</span>
            <span className="text-outline-variant">•</span>
            <span>Independent citizen guidance</span>
          </div>
        </div>
      </div>
      <div className="mx-auto flex h-20 max-w-civic items-center justify-between gap-6 px-5 md:px-12">
        <button type="button" onClick={onBrand} className="flex flex-col text-left">
          <BrandWordmark />
          <span className="mt-0.5 font-label text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
            Statutory redress &amp; ombudsman gateway
          </span>
        </button>
        <nav
          className="hidden items-center gap-5 lg:flex"
          aria-label="Progress"
        >
          {HOME_STEPS.map((s) => {
            const isActive = s.id === active;
            const icoHint =
              s.id === "ico"
                ? "Only appears when the gate routes you to the ICO (data protection). Skipped for FOS / Energy / parking."
                : undefined;
            return (
              <span
                key={s.id}
                title={icoHint}
                className={`py-2 text-[13px] ${
                  isActive
                    ? "border-b-2 border-ink font-medium text-ink"
                    : s.id === "ico" && active !== "ico"
                      ? "border-b-2 border-transparent text-outline-variant"
                      : "border-b-2 border-transparent text-on-surface-variant"
                }`}
              >
                {s.num}. {s.label}
              </span>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

type RagStatus = "Verified" | "Missing" | "Blocker";

function tokenStatus(
  value: string | undefined | boolean | null,
  critical = false
): RagStatus {
  if (value === true || (typeof value === "string" && value.trim().length > 0))
    return "Verified";
  if (critical) return "Blocker";
  return "Missing";
}

/** RAG: green = ok, amber = missing (non-blocking), red = game stopper. */
function TokenBadge({ status }: { status: RagStatus }) {
  const cls =
    status === "Verified"
      ? "border-civic-green text-civic-green bg-[#EBF4F0]"
      : status === "Blocker"
        ? "border-crimson text-crimson bg-[#FBF3F2]"
        : "border-ochre text-ochre bg-ochre-fill";
  return (
    <span
      className={`inline-flex border px-2 py-0.5 font-label text-[10px] font-semibold uppercase tracking-[0.08em] ${cls}`}
    >
      {status}
    </span>
  );
}

function ExtractPanel({
  result,
  dateOverride,
  setDateOverride,
  firmOverride,
  setFirmOverride,
  onContinue,
  onBack,
}: {
  result: PipelineResult;
  dateOverride: string;
  setDateOverride: (v: string) => void;
  firmOverride: string;
  setFirmOverride: (v: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const e = result.extracted;
  const firmName = (firmOverride || e.firmName || "").trim();
  const story = extractStory({
    ...result,
    extracted: { ...e, firmName: firmName || e.firmName },
  });
  const [editingFirm, setEditingFirm] = useState(false);
  const [firmDraft, setFirmDraft] = useState(firmName);

  /** Sector-aware clock date (UI used to only look at FRL → false ICO blockers). */
  const clock = (() => {
    switch (e.sector) {
      case "data_privacy":
        return {
          value: e.raisedWithDpoDate || dateOverride || undefined,
          label: "DPO / letter date (ICO clock)",
          tip: "Letters often have two dates: when you made the SAR/complaint, and the date of this DPO reply. The reply date is usually the one we show here. Missing reply date can block a clean ICO path.",
          secondary:
            e.complaintRaisedDate &&
            e.complaintRaisedDate !== (e.raisedWithDpoDate || dateOverride)
              ? `Also in the letter: SAR / complaint dated ${e.complaintRaisedDate}`
              : undefined,
          blockerCopy:
            "We need the date of the DPO reply (or when you raised with the DPO). Enter the date printed on this letter.",
          mustHave: true,
        };
      case "energy":
        return {
          value:
            e.deadlockLetterDate ||
            e.complaintRaisedDate ||
            dateOverride ||
            undefined,
          label: "Deadlock / letter date (Energy clock)",
          tip: "Energy paths use the deadlock letter date (12-month window) or when you first complained (8-week wait).",
          secondary: undefined as string | undefined,
          blockerCopy:
            "Enter the deadlock letter date (or complaint date) printed on the letter.",
          mustHave: Boolean(e.hasDeadlockLetter),
        };
      case "parking":
        return {
          value: e.operatorRejectionDate || dateOverride || undefined,
          label: "Operator rejection date",
          tip: "POPLA/IAS windows run from the operator’s rejection date.",
          secondary: undefined as string | undefined,
          blockerCopy: "Enter the rejection date on the parking letter.",
          mustHave: true,
        };
      default:
        return {
          value: e.finalResponseLetterDate || dateOverride || undefined,
          label: "Final Response / letter date (FOS clock)",
          tip: "For FOS, the 6-month window usually runs from the Final Response date (DISP 2.8). Holding letters may mention “Final Response” only to say you do not have one yet.",
          secondary:
            e.complaintRaisedDate &&
            e.complaintRaisedDate !==
              (e.finalResponseLetterDate || dateOverride)
              ? `Also in the letter: complaint raised / referenced ${e.complaintRaisedDate}`
              : undefined,
          blockerCopy:
            "For FOS, enter the Final Response date printed on the letter (DISP 2.8 clock).",
          mustHave: Boolean(e.hasFinalResponseLetter),
        };
    }
  })();

  const dateValue = clock.value;
  const dateIsBlocker = clock.mustHave && !dateValue;
  const dateStatus: RagStatus = dateValue
    ? "Verified"
    : dateIsBlocker
      ? "Blocker"
      : "Missing";
  const firmStatus = tokenStatus(firmName, false);
  const cannotContinue = dateIsBlocker;

  return (
    <section className="mx-auto max-w-civic px-5 py-10 md:px-12">
      <div className="mb-8 border-b border-rule pb-4">
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
          Step 2 · Extract
        </p>
        <h1 className="mt-2 flex flex-wrap items-center font-display text-[28px] font-medium tracking-tight text-ink md:text-[32px]">
          What we pulled from your letter
          <InfoTip label="Parsing statutory correspondence">
            Plain English: we scan the text for who wrote it, whether it is a
            Final Response / deadlock, and the date. Those facts feed the next
            step (the hard gate). We never invent a missing date.
          </InfoTip>
        </h1>
        <p className="mt-3 max-w-3xl border-l-2 border-civic-green bg-[#EBF4F0] p-4 text-[15px] leading-6 text-body-ink">
          {story}
        </p>
        <p className="mt-3 font-label text-[10px] uppercase tracking-[0.08em] text-on-surface-variant">
          <span className="text-civic-green">Verified</span>
          {" · "}
          <span className="text-ochre">Missing</span> (fill if you can)
          {" · "}
          <span className="text-crimson">Blocker</span> (must fix to continue)
        </p>
      </div>

      <div className="space-y-3">
        {/* Fact 01 — respondent (editable) */}
        <div
          className={`border bg-white p-5 ${
            firmStatus === "Missing"
              ? "border-ochre"
              : firmStatus === "Verified"
                ? "border-rule"
                : "border-rule"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Fact 01 · Who wrote this (respondent)
                <InfoTip label="Respondent">
                  The company or body that sent the letter — the other side of
                  your dispute. Edit if the parser missed the letterhead.
                </InfoTip>
              </div>
              {editingFirm ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={firmDraft}
                    onChange={(ev) => setFirmDraft(ev.target.value)}
                    placeholder="e.g. Caledonian Trust Bank PLC"
                    className="min-w-[220px] flex-1 border border-ink bg-surface-low px-3 py-2 font-display text-[16px] text-ink outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFirmOverride(firmDraft.trim());
                      setEditingFirm(false);
                    }}
                    className="bg-ink px-3 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-surface"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFirmDraft(firmName);
                      setEditingFirm(false);
                    }}
                    className="border border-outline-variant px-3 py-2 font-label text-[11px] uppercase tracking-[0.08em] text-ink"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <p className="font-display text-[18px] text-ink">
                    {firmName || "Respondent not named"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFirmDraft(firmName);
                      setEditingFirm(true);
                    }}
                    className="font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-ink underline decoration-outline-variant underline-offset-4 hover:text-civic-green"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <TokenBadge status={firmStatus} />
          </div>
        </div>

        {/* Fact 02 */}
        <div className="border border-rule bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Fact 02 · What kind of letter
                <InfoTip label="What kind of letter">
                  Final Response = firm says investigation finished. Deadlock =
                  energy supplier says talks ended. Holding letters are usually
                  too early.
                </InfoTip>
              </div>
              <p className="mt-1 font-display text-[18px] text-ink">
                {e.hasFinalResponseLetter
                  ? "Final Response Letter (FRL)"
                  : e.hasDeadlockLetter
                    ? "Deadlock / final energy response"
                    : e.sector === "data_privacy"
                      ? "DPO / data protection correspondence"
                      : "Complaint correspondence"}
              </p>
            </div>
            <TokenBadge status="Verified" />
          </div>
        </div>

        {/* Fact 03 */}
        <div className="border border-rule bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Fact 03 · Sector &amp; machine summary
                <InfoTip label="Sector & summary">
                  Internal parse note. “Heuristic” means we used rules/keywords
                  when the live model was off — still checked by the gate.
                </InfoTip>
              </div>
              <p className="mt-1 font-display text-[18px] text-ink">
                {e.sector.replace("_", " ")} — {e.summary}
              </p>
              <p className="mt-2 font-label text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">
                Extract via:{" "}
                <span
                  className={
                    e.via === "nightshift" || e.via === "xai"
                      ? "text-civic-green"
                      : "text-ochre"
                  }
                >
                  {e.via === "nightshift"
                      ? "Nightshift AI (Nemotron)"
                      : e.via === "xai"
                        ? "xAI Grok (backup LLM)"
                        : e.via === "heuristic"
                          ? "Heuristic (sample mode)"
                          : e.via}
                </span>
              </p>
              <p className="mt-1 font-label text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">
                Scheme data:{" "}
                <span
                  className={
                    result.schemeSource === "zetaris"
                      ? "text-civic-green"
                      : "text-ochre"
                  }
                >
                  {result.schemeSource === "zetaris"
                    ? "Zetaris live (scheme clocks)"
                    : "Sample rules (Zetaris offline)"}
                </span>
              </p>
            </div>
            <TokenBadge status="Verified" />
          </div>
        </div>

        {/* Fact 04 — sector clock date */}
        <div
          className={`border bg-white p-5 ${
            dateStatus === "Blocker"
              ? "border-2 border-crimson"
              : dateStatus === "Missing"
                ? "border-ochre"
                : "border-rule"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Fact 04 · {clock.label}
                <InfoTip label={clock.label}>{clock.tip}</InfoTip>
              </div>
              <p className="mt-1 font-display text-[18px] text-ink">
                {dateValue
                  ? `Primary clock date: ${dateValue}`
                  : "Primary clock date: Missing or ambiguous in text"}
              </p>
              {clock.secondary && (
                <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
                  {clock.secondary}
                </p>
              )}
            </div>
            <TokenBadge status={dateStatus} />
          </div>
          {(dateStatus === "Blocker" || dateStatus === "Missing") && (
            <div
              className={`mt-4 space-y-3 border-l-2 p-3 ${
                dateStatus === "Blocker"
                  ? "border-crimson bg-[#FBF3F2]"
                  : "border-ochre bg-ochre-fill"
              }`}
            >
              {dateStatus === "Blocker" && (
                <p className="text-[13px] font-semibold text-crimson">
                  Game stopper — we need this date before a clean eligible path
                  can open.
                </p>
              )}
              <p className="text-[12px] leading-5 text-on-surface-variant">
                {clock.blockerCopy}
              </p>
              <input
                type="date"
                value={dateOverride}
                onChange={(ev) => setDateOverride(ev.target.value)}
                className={`border bg-white px-3 py-2 text-[14px] outline-none focus:border-ink ${
                  dateStatus === "Blocker" ? "border-crimson" : "border-ochre"
                }`}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <StageBack onBack={onBack} label="Back to intake" />
        <button
          type="button"
          disabled={cannotContinue}
          onClick={onContinue}
          className="bg-ink px-8 py-3.5 font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-surface hover:bg-body-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue to jurisdictional door
        </button>
      </div>
    </section>
  );
}

function GateDetermination({
  result,
  firmDisplay,
  onContinuePack,
  onRestart,
  onBack,
}: {
  result: PipelineResult;
  firmDisplay?: string;
  onContinuePack: () => void;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { decision, extracted, trace_id } = result;
  const respondent = firmDisplay || extracted.firmName;
  const status = decision.status as ResolutionStatus;
  const tone = gateTone(status);
  const label = gateUiLabel(status);
  const scheme =
    (decision.targetScheme && SCHEME_NAME[decision.targetScheme]) ||
    decision.targetScheme ||
    "No door open";
  const plain = gateStory(result);
  const continueEligible = status === "ELIGIBLE";

  return (
    <section className="mx-auto max-w-civic px-5 py-10 md:px-12">
      <div className="mb-6 max-w-3xl">
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
          Step 3 · Jurisdictional door
        </p>
        <h1 className="mt-2 flex flex-wrap items-center font-display text-[28px] font-medium text-ink md:text-[32px]">
          Dummy&apos;s guide: did a door open?
          <InfoTip label="What this stage is">
            We apply fixed scheme rules (time limits, wrong doors). Result is
            one of four: Eligible, Premature, Out of Time, or Wrong Door. This
            is not the pack yet — only the go / no-go decision.
          </InfoTip>
        </h1>
        <p className="mt-3 border-l-2 border-ink bg-surface-low p-4 text-[15px] leading-6 text-body-ink">
          <strong className="font-semibold">{plain.headline}</strong>
          <br />
          {plain.story}
        </p>
      </div>

      <div className="mx-auto max-w-3xl border border-[#E2DFD7] bg-white p-6 shadow-[0_16px_40px_rgba(17,28,36,0.06)] md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="bg-surface-low px-2 py-1 font-label text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
            Gateway record
          </span>
          <span className="font-label text-[11px] text-outline font-tabular">
            REF: {trace_id}
          </span>
        </div>
        <div className="mt-4 border-t border-[#EBE8DF] pt-6">
          <div className="flex items-center font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
            Respondent (who rejected you)
            <InfoTip label="Respondent">
              The organisation named on the letter — e.g. your bank or energy
              supplier. Not you.
            </InfoTip>
          </div>
          <h2 className="mt-1 font-display text-[24px] font-semibold text-ink">
            {respondent || "Respondent not named"}
          </h2>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            {extracted.summary}
          </p>
        </div>

        {extracted.hasFinalResponseLetter && (
          <div className="mt-6 inline-block border border-dashed border-[#9E2A2B] bg-[#FBF3F2] px-4 py-2">
            <div className="flex items-center font-label text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9E2A2B]">
              Final response
              <InfoTip label="Final Response / DISP 1.6.2R">
                FCA rules say when a firm finishes its complaint process it
                should issue a Final Response and tell you about FOS. “DISP
                1.6.2R” is that rule label — not a court case number.
              </InfoTip>
            </div>
            <p className="font-label text-[10px] font-semibold text-[#9E2A2B]">
              DISP 1.6.2R path (financial)
            </p>
          </div>
        )}

        <div className={`mt-6 border p-4 ${tone.ribbon}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-label text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
                Gate result: {label}
              </p>
              <p className="mt-1 text-[12px] text-on-surface-variant">
                Designated door: {scheme}
              </p>
            </div>
            <span
              className={`border bg-white px-3 py-1.5 font-label text-[10px] font-bold uppercase tracking-[0.08em] ${tone.badge}`}
            >
              {label}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border border-[#E5E2D9] bg-[#FAFAF8]">
            <div className="flex items-center bg-[#F4F2EC] px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
              Why (rule reasons)
              <InfoTip label="Reasons">
                Short machine reasons from the gate. The plain-English story
                above is the hand-hold; these are the citations.
              </InfoTip>
            </div>
            <ul className="space-y-2 p-4 text-[13px] leading-5 text-ink">
              {decision.reasons.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </div>
          <div className="border border-[#E5E2D9] bg-[#FAFAF8]">
            <div className="flex items-center bg-[#F4F2EC] px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
              What you should do next
              <InfoTip label="Action required">
                If Eligible: we send you to build and approve a pack, then you
                file on the official portal yourself. We never auto-submit.
              </InfoTip>
            </div>
            <div className="space-y-3 p-4 text-[13px] leading-5 text-ink">
              <p>{plain.nextSteps}</p>
              {decision.portalUrl && (
                <a
                  href={decision.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-civic-green underline underline-offset-2"
                >
                  Open official scheme portal
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2DFD7] pt-6">
          <StageBack onBack={onBack} label="Back to extract" />
          {continueEligible ? (
            <button
              type="button"
              onClick={onContinuePack}
              className="bg-ink px-6 py-3 font-label text-[12px] font-bold uppercase tracking-[0.08em] text-surface hover:bg-body-ink"
            >
              Build pack for {scheme} →
            </button>
          ) : (
            <button
              type="button"
              onClick={onRestart}
              className="border border-ink px-5 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-surface-low"
            >
              Start another letter
            </button>
          )}
        </div>
      </div>

      {/* Compact other states legend — not interactive panels */}
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-2 md:grid-cols-4">
        {(
          [
            "ELIGIBLE",
            "PREMATURE",
            "TIME_BARRED",
            "REDIRECT_REQUIRED",
          ] as ResolutionStatus[]
        ).map((s) => {
          const t = gateTone(s);
          const active = s === status;
          return (
            <div
              key={s}
              className={`border px-3 py-2 text-center font-label text-[10px] font-semibold uppercase tracking-[0.06em] ${
                active ? `${t.border} ${t.ink}` : "border-rule text-outline"
              }`}
            >
              {gateUiLabel(s)}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const SECTION_TIPS: Record<string, string> = {
  facts:
    "Who, what, when — the story of your complaint in short form. Check names and dates match the letter.",
  eligibility:
    "Why the gate said Eligible / Premature / Out of Time / Wrong Door. Read before you file.",
  remedy:
    "What you are asking for (refund, apology, etc.). Edit by re-running with clearer letter text if needed.",
  portal:
    "Where to file next (official portal link + any live portal note). We do not submit for you.",
};

function PackBuilder({
  result,
  pack,
  approved,
  toggleApprove,
  onExport,
  onBack,
}: {
  result: PipelineResult;
  pack: PackSection[];
  approved: Record<string, boolean>;
  toggleApprove: (id: string) => void;
  onExport: () => void;
  onBack: () => void;
}) {
  const approvedCount = pack.filter((s) => approved[s.id]).length;
  const allApproved =
    result.decision.status === "ELIGIBLE" && approvedCount === pack.length;
  const locked = !allApproved;
  const scheme =
    (result.decision.targetScheme &&
      SCHEME_NAME[result.decision.targetScheme]) ||
    result.decision.targetScheme ||
    "the scheme";
  const plain = gateStory(result);

  return (
    <section className="mx-auto max-w-civic px-5 py-10 md:px-12">
      <div className="mb-2 bg-surface-high px-4 py-2 font-label text-[11px] text-on-surface-variant">
        <span className="font-semibold text-ink">
          DOSSIER REF: {result.trace_id}
        </span>
        <span className="mx-2 text-outline-variant">/</span>
        <span>
          Gate: {gateUiLabel(result.decision.status)} →{" "}
          {result.decision.targetScheme ?? "—"}
        </span>
      </div>

      <div className="mt-6 bg-surface-low p-6 md:p-8">
        <p className="inline-block bg-secondary-container/40 px-2 py-0.5 font-label text-[10px] font-semibold uppercase tracking-[0.08em] text-civic-green">
          Step 4 · Human gate pack
        </p>
        <h1 className="mt-3 flex flex-wrap items-center font-display text-[28px] font-medium tracking-tight text-ink md:text-[32px]">
          Check the pack, then approve
          <InfoTip label="Human verification gate">
            AI drafted four sections. You must Approve each one before download
            unlocks. That is deliberate — you stay in control of what leaves
            this desk.
          </InfoTip>
        </h1>
        <p className="mt-3 max-w-3xl border-l-2 border-civic-green bg-white p-4 text-[15px] leading-6 text-body-ink">
          {plain.story} When every section is approved, download the pack and
          use it to start your complaint with {scheme} on their official portal.
          ComplaintPath never files for you.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {pack.map((section) => {
          const ok = Boolean(approved[section.id]);
          return (
            <article
              key={section.id}
              className="border border-rule bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-surface-low px-5 py-3">
                <h2 className="flex flex-wrap items-center font-display text-[18px] font-medium text-ink">
                  {section.title}
                  <InfoTip label={section.title}>
                    {SECTION_TIPS[section.id] ||
                      "Read carefully; approve only if it matches your letter."}
                  </InfoTip>
                </h2>
                <div className="flex items-center gap-3">
                  {ok ? (
                    <span className="bg-secondary-container/50 px-2 py-0.5 font-label text-[10px] font-semibold uppercase tracking-[0.06em] text-civic-green">
                      Approved
                    </span>
                  ) : (
                    <span className="border border-ochre bg-ochre-fill px-2 py-0.5 font-label text-[10px] font-semibold uppercase tracking-[0.06em] text-ochre">
                      Pending
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleApprove(section.id)}
                    className={`border px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      ok
                        ? "border-civic-green text-civic-green"
                        : "border-ink bg-ink text-surface"
                    }`}
                  >
                    {ok ? "Revoke" : "Approve"}
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap px-5 py-5 font-body text-[14px] leading-6 text-body-ink">
                {section.body}
              </pre>
            </article>
          );
        })}
      </div>

      <div
        className={`mt-8 border p-6 ${
          locked
            ? "border-rule bg-surface-low"
            : "border-civic-green bg-[#EBF4F0]"
        }`}
      >
        <h2 className="flex flex-wrap items-center font-display text-[20px] font-medium text-ink">
          {locked
            ? `Export locked — ${approvedCount}/${pack.length} approved`
            : "Export unlocked"}
          <InfoTip label="Export">
            Downloads both a markdown file and a PDF of this Gate Pack for your
            records. Still not legal advice; still not auto-filed.
          </InfoTip>
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-on-surface-variant">
          {locked
            ? "Approve every section above. Then download the Gate Pack (.md + .pdf) and use it on the scheme portal."
            : nextStepsInstruction(result)}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StageBack onBack={onBack} label="Back to gate" />
          <button
            type="button"
            disabled={locked}
            onClick={onExport}
            className="bg-ink px-8 py-3.5 font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-surface hover:bg-body-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            {locked ? "Export locked" : "Download pack (.md + .pdf)"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function ComplaintPathApp() {
  const [step, setStep] = useState<FlowStep>("landing");
  const [letter, setLetter] = useState("");
  const [todayIso, setTodayIso] = useState("2026-10-22");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [dateOverride, setDateOverride] = useState("");
  const [firmOverride, setFirmOverride] = useState("");

  const pack = useMemo(() => result?.pack ?? [], [result]);
  const displayFirm =
    firmOverride.trim() || result?.extracted.firmName || undefined;

  async function analyse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letter, todayIso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");
      setResult(data as PipelineResult);
      setApproved({});
      setDateOverride("");
      setFirmOverride("");
      setStep("extract");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleApprove(id: string) {
    setApproved((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function exportPack() {
    if (!result) return;
    downloadPackFiles(result, approved);
    setStep("export");
  }

  function resetToLanding() {
    setStep("landing");
    setResult(null);
    setApproved({});
    setError(null);
    setDateOverride("");
    setFirmOverride("");
  }

  return (
    <div className="min-h-screen">
      <ShellHeader step={step} onBrand={resetToLanding} />
      <main>
        {(step === "landing" || step === "intake") && (
          <HomeLanding
            letter={letter}
            setLetter={setLetter}
            todayIso={todayIso}
            setTodayIso={setTodayIso}
            loading={loading}
            error={error}
            onAnalyse={analyse}
            onSample={() => setLetter(SAMPLE_LETTER)}
          />
        )}
        {step === "extract" && result && (
          <ExtractPanel
            result={result}
            dateOverride={dateOverride}
            setDateOverride={setDateOverride}
            firmOverride={firmOverride}
            setFirmOverride={setFirmOverride}
            onContinue={() => setStep("gate")}
            onBack={() => setStep("landing")}
          />
        )}
        {step === "gate" && result && (
          <GateDetermination
            result={result}
            firmDisplay={displayFirm}
            onContinuePack={() =>
              setStep(
                result.decision.targetScheme === "ICO" ? "ico" : "pack"
              )
            }
            onRestart={resetToLanding}
            onBack={() => setStep("extract")}
          />
        )}
        {step === "ico" && result && (
          <section className="mx-auto max-w-civic px-5 py-10 md:px-12">
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-civic-green">
              Step 5 · ICO special
            </p>
            <h1 className="mt-2 flex flex-wrap items-center font-display text-[28px] font-medium text-ink">
              Why this step exists
              <InfoTip label="ICO Special">
                Only shown when the gate routes you to the ICO. For FOS / Energy
                / parking you skip this step — that is expected, not a bug.
              </InfoTip>
            </h1>
            <p className="mt-3 max-w-2xl border-l-2 border-civic-green bg-[#EBF4F0] p-4 text-[15px] leading-6 text-body-ink">
              The ICO investigates data-protection compliance. It does{" "}
              <strong className="font-semibold">not</strong> usually award
              money like an ombudsman. If you only want damages, court is often
              the path — check the gate reasons. Otherwise continue to approve
              an ICO-oriented pack, then file on the ICO site yourself.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <StageBack onBack={() => setStep("gate")} label="Back to gate" />
              <button
                type="button"
                onClick={() => setStep("pack")}
                className="bg-ink px-8 py-3.5 font-label text-[12px] font-semibold uppercase tracking-[0.12em] text-surface hover:bg-body-ink"
              >
                Continue to human gate pack
              </button>
            </div>
          </section>
        )}
        {(step === "pack" || step === "export") && result && (
          <PackBuilder
            result={result}
            pack={pack}
            approved={approved}
            toggleApprove={toggleApprove}
            onExport={exportPack}
            onBack={() =>
              setStep(
                result.decision.targetScheme === "ICO" ? "ico" : "gate"
              )
            }
          />
        )}
      </main>
      <footer className="mt-8 border-t border-surface-highest bg-surface-low py-10">
        <div className="mx-auto grid max-w-civic gap-8 px-5 md:grid-cols-12 md:px-12">
          <div className="md:col-span-6">
            <p className="font-label text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
              Civic guarantee &amp; non-agency mandate
            </p>
            <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
              ComplaintPath is an independent guidance utility. Not a claims
              management company or legal practice. Not legal advice. You approve
              before export.
            </p>
          </div>
          <div className="md:col-span-6">
            <p className="font-label text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
              Recognised schemes (guidance)
            </p>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {SCHEME_LINKS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline decoration-outline-variant underline-offset-2 hover:text-civic-green"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
