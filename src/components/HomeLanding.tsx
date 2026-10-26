"use client";

import { useRef, useState } from "react";
import { ingestLetterFile } from "@/lib/clientIngest";
import { LetterExamplesModal } from "./LetterExamplesModal";
import { BrandWordmark } from "./BrandMark";
import { InfoTip } from "./InfoTip";
import { AnalyseProgress } from "./AnalyseProgress";

const PLACEHOLDER =
  "Dear Customer, we write regarding your formal complaint dated 12th February… This constitutes our Final Response under our statutory obligations…";

const DOORS = [
  {
    id: "01",
    act: "FSMA 2000",
    title: "Financial Ombudsman Service (FOS)",
    body: "Authorised by the Financial Services and Markets Act 2000. Resolves disputes on retail banking, lending, mortgages, consumer credit, and insurance.",
    rows: [
      ["Limitation", "6 months from Final Response"],
      ["Binding award limit", "Up to £430,000"],
    ],
    standards:
      "Need a Final Response (or 8 weeks’ silence). File within 6 months of the FRL date (DISP 2.8). Active firms → FOS, not FSCS.",
  },
  {
    id: "02",
    act: "REMA 2011",
    title: "Energy Ombudsman",
    body: "Independent redress for energy suppliers. Typically requires deadlock or eight weeks after raising the complaint with the supplier.",
    rows: [
      ["Window", "8 weeks or deadlock letter"],
      ["Effect", "Legally binding on suppliers"],
    ],
    standards:
      "Raise with the supplier first. Escalate after deadlock letter or ~8 weeks. File within 12 months of the deadlock / final position.",
  },
  {
    id: "03",
    act: "Housing Act 1996",
    title: "Housing Ombudsman",
    body: "Social housing and registered landlords. ComplaintPath flags this path for awareness; deep routing in this build focuses on FOS, Energy, and ICO.",
    rows: [
      ["Scope", "Social housing & registered trusts"],
      ["Special powers", "Severe maladministration findings"],
    ],
    standards:
      "Exhaust the landlord’s complaints process (including the democratic filter where required) before the Housing Ombudsman.",
  },
  {
    id: "04",
    act: "Legal Services Act",
    title: "Legal Ombudsman (LeO)",
    body: "Poor service from regulated legal professionals in England and Wales — solicitors, barristers, licensed conveyancers.",
    rows: [
      ["Time limit", "1 year from act/omission"],
      ["Redress", "Fee refunds, compensation"],
    ],
    standards:
      "Usually complain to the firm first, then LeO within the published time limits. Not a substitute for court on negligence quantum.",
  },
  {
    id: "05",
    act: "DPA 2018 / UK GDPR",
    title: "Information Commissioner's Office (ICO)",
    body: "UK information rights authority. Handles SAR failures and unauthorised disclosures. Issues regulatory findings — not ombudsman money awards.",
    rows: [
      ["SAR window", "30 calendar days"],
      ["Cost", "£0 (statutory)"],
    ],
    standards:
      "Raise with the organisation’s DPO first. ICO is for compliance — financial damages alone usually belong in court, not the ICO portal.",
    dualTrack: true,
  },
];

type Props = {
  letter: string;
  setLetter: (v: string) => void;
  todayIso: string;
  setTodayIso: (v: string) => void;
  loading: boolean;
  error: string | null;
  onAnalyse: () => void;
  onSample: () => void;
};

export function HomeLanding({
  letter,
  setLetter,
  todayIso,
  setTodayIso,
  loading,
  error,
  onAnalyse,
  onSample,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const intakeRef = useRef<HTMLElement>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [openDoor, setOpenDoor] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);

  async function handleFiles(files: FileList | File[] | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadStatus(`Reading ${file.name}…`);
    try {
      const text = await ingestLetterFile(file);
      setLetter(text);
      setUploadStatus(`Loaded from ${file.name} — review text, then analyse.`);
      intakeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setUploadStatus(e instanceof Error ? e.message : "Upload failed");
    }
  }

  return (
    <div className="mx-auto max-w-civic px-5 py-8 md:px-12 md:py-10">
      <LetterExamplesModal
        open={examplesOpen}
        onClose={() => setExamplesOpen(false)}
      />
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden border border-outline-variant/40 bg-surface-low">
        <div
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(#74777b_0.75px,transparent_0.75px)] [background-size:16px_16px]"
          aria-hidden
        />
        <div className="relative z-10 grid items-center gap-8 p-6 md:grid-cols-12 md:p-12 lg:p-16">
          <div className="flex flex-col space-y-6 md:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-secondary/30 bg-secondary-container/40 px-2 py-0.5 font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-civic-green">
                UK statutory router
              </span>
              <span className="font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                Ombudsman, regulator, or statutory appeal body
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="leading-none">
                <BrandWordmark className="font-display text-[2.5rem] font-normal tracking-tight md:text-[44px]" />
              </h1>
              <h2 className="font-display text-[26px] font-medium leading-tight text-ink md:text-[32px]">
                Find the right UK complaint path.
              </h2>
            </div>
            <p className="max-w-xl text-[17px] leading-7 text-on-surface-variant">
              Paste the organisation&apos;s written reply after you complained —
              usually a <strong className="font-semibold text-ink">Final
              Response</strong>, <strong className="font-semibold text-ink">deadlock</strong>,
              or rejection email. We check clocks and doors, then build a pack{" "}
              <em>you</em> approve before you file — not legal advice.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() =>
                  intakeRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="inline-flex items-center justify-center bg-ink px-7 py-3.5 font-label text-[14px] font-semibold tracking-wide text-surface hover:bg-body-ink"
              >
                Paste your letter
              </button>
              <button
                type="button"
                onClick={() => setExamplesOpen(true)}
                className="inline-flex items-center justify-center border border-ink px-5 py-3.5 font-label text-[12px] font-semibold uppercase tracking-[0.08em] text-ink hover:bg-white"
              >
                What do these letters look like?
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-left text-[14px] font-medium text-ink underline decoration-outline-variant underline-offset-4 hover:text-civic-green"
              >
                Or drop a scanned PDF / photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/40 pt-4 font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
              <span className="text-civic-green">Free to unrepresented citizens</span>
              <span className="text-outline-variant">•</span>
              <span>Strictly non-adversarial</span>
              <span className="text-outline-variant">•</span>
              <span className="text-crimson">Enforces statutory limitation clocks</span>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="mx-auto max-w-[420px] border border-outline-variant/50 bg-white p-6 md:p-8">
              <div className="mb-5 flex items-start justify-between border-b border-surface-highest pb-4">
                <div>
                  <span className="block font-label text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                    Despatch motif
                  </span>
                  <span className="font-label text-[11px] text-on-surface-variant">
                    Ref: CP-STAT-2026/EX
                  </span>
                </div>
                <div className="-rotate-3 border border-outline bg-surface-low px-3 py-1 text-center">
                  <span className="block font-label text-[9px] font-bold uppercase tracking-widest text-ink">
                    London
                  </span>
                  <span className="block font-label text-[8px] text-on-surface-variant">
                    Statutory gateway
                  </span>
                </div>
              </div>
              <div className="space-y-3 font-label text-[11px] leading-relaxed text-on-surface-variant">
                <div className="flex items-baseline justify-between border-b border-surface-container pb-1 text-ink">
                  <span>FINAL RESPONSE PROTOCOL</span>
                  <span className="bg-secondary-container/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-civic-green">
                    Ready for audit
                  </span>
                </div>
                <p className="py-1 font-display text-[18px] italic leading-snug text-ink">
                  “We confirm this represents our final statement on matter
                  reference #7821…”
                </p>
                <div className="h-2 w-3/4 bg-surface-highest" />
                <div className="h-2 w-full bg-surface-container" />
                <div className="h-2 w-5/6 bg-surface-low" />
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-surface-highest pt-4">
                <div>
                  <span className="block font-label text-[10px] uppercase text-ink">
                    Ombudsman desk
                  </span>
                  <span className="font-label text-[10px] text-on-surface-variant">
                    Arbitration enrolment
                  </span>
                </div>
                <span className="font-label text-[10px] tracking-wider text-civic-green">
                  SEC. 229 PATTERN
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Citizen intake */}
      <section
        ref={intakeRef}
        id="intake-drawer"
        className="mb-10 border border-outline-variant/40 bg-white p-6 md:p-10"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex flex-wrap items-center font-display text-[20px] font-medium text-ink">
            Citizen Intake Workspace
            <InfoTip label="What goes here">
              Paste or upload the firm&apos;s reply to your complaint — not your
              original complaint letter. Best: Final Response, deadlock letter,
              DPO final position, or parking appeal rejection.
            </InfoTip>
          </h2>
          <span className="font-label text-[10px] uppercase tracking-[0.08em] text-on-surface-variant">
            Plain text · PDF · PNG · JPEG
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-[13px] leading-5 text-on-surface-variant">
          Paste your formal deadlock letter, rejection email, or final resolution
          notice — or upload a PDF / screenshot. The router extracts dates,
          references, and the respondent, then applies hard scheme gates. Wrong
          door or late filing is blocked before you waste a submission.
        </p>

        <div
          className={`mt-4 border ${
            dragOver ? "border-ink bg-surface-low" : "border-outline-variant bg-surface-low"
          }`}
        >
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={7}
            spellCheck={false}
            placeholder={PLACEHOLDER}
            className="w-full resize-y border-0 bg-transparent p-4 text-[14px] leading-6 text-ink outline-none placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.06em] text-on-surface-variant">
            As-of date
            <input
              type="date"
              value={todayIso}
              onChange={(e) => setTodayIso(e.target.value)}
              className="border border-rule bg-white px-2 py-1 font-body text-[13px] text-ink outline-none focus:border-ink"
            />
          </label>
          <button
            type="button"
            onClick={onSample}
            className="font-label text-[11px] uppercase tracking-[0.06em] text-on-surface-variant underline underline-offset-4"
          >
            Insert sample letter
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="font-label text-[11px] uppercase tracking-[0.06em] text-ink underline underline-offset-4"
          >
            Upload PDF or image
          </button>
        </div>

        {uploadStatus && (
          <p className="mt-3 text-[13px] text-on-surface-variant">{uploadStatus}</p>
        )}
        {error && (
          <p className="mt-3 border border-crimson bg-[#FBF3F2] px-3 py-2 text-[13px] text-crimson">
            {error}
          </p>
        )}

        <AnalyseProgress active={loading} />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-civic-green" aria-hidden />
              Live AI extract · gates in code
            </span>
            <span className="text-outline-variant">•</span>
            <span>You approve before export</span>
          </div>
          <button
            type="button"
            disabled={loading || letter.trim().length < 40}
            onClick={onAnalyse}
            className="bg-ink px-6 py-2.5 font-label text-[12px] font-semibold uppercase tracking-[0.1em] text-surface hover:bg-body-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Running agent pipeline…" : "Analyse gateway requirements"}
          </button>
        </div>
      </section>

      {/* Doors guidance */}
      <section className="mb-10 space-y-8">
        <div className="border-b border-surface-highest pb-6">
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-civic-green">
            Procedural architecture
          </p>
          <h2 className="mt-1 flex flex-wrap items-center font-display text-[28px] font-medium tracking-tight text-ink md:text-[32px]">
            Pick the Right Statutory Door
            <InfoTip label="You do not pick the door">
              These cards explain the landscape. After you analyse a letter, the
              router chooses the door from the text and the clocks — you do not
              click a door to start a case.
            </InfoTip>
          </h2>
          <p className="mt-3 max-w-3xl text-[17px] leading-7 text-on-surface-variant">
            Parliament establishes independent redress portals backed by law. A
            complaint sent to the wrong ombudsman — or too early — can be
            discarded without stopping your limitation clock. ComplaintPath
            chooses the door from your letter; the cards below explain what each
            scheme is for.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DOORS.map((door) => (
            <article
              key={door.id}
              className={`flex flex-col justify-between border border-outline-variant/40 bg-surface-low p-6 transition-colors hover:border-ink ${
                door.dualTrack ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
                  <span className="font-label text-[10px] uppercase tracking-[0.1em] text-on-surface-variant">
                    Statutory door {door.id}
                  </span>
                  <span className="bg-secondary-container/30 px-2 py-0.5 font-label text-[10px] text-civic-green">
                    {door.act}
                  </span>
                </div>
                {door.dualTrack ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-display text-[20px] text-ink">
                        {door.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
                        {door.body}
                      </p>
                    </div>
                    <div className="border border-outline-variant/30 bg-surface-container p-4">
                      <span className="block font-label text-[10px] font-semibold uppercase text-ink">
                        The ICO dual-track mechanism
                      </span>
                      <p className="mt-2 text-[12px] leading-relaxed text-on-surface-variant">
                        Unlike dispute ombudsmen, the ICO issues regulatory
                        determinations rather than financial awards — useful for
                        later court filings, not a damages cheque.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-display text-[20px] text-ink">
                      {door.title}
                    </h3>
                    <p className="mt-2 mb-4 text-[13px] leading-5 text-on-surface-variant">
                      {door.body}
                    </p>
                  </>
                )}
              </div>
              <div className="mt-4 space-y-3 border-t border-outline-variant/20 pt-3">
                {door.rows.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 font-label text-[11px] text-on-surface-variant"
                  >
                    <span>{k}:</span>
                    <span className="text-right font-semibold text-ink">{v}</span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setOpenDoor(openDoor === door.id ? null : door.id)
                  }
                  className="mt-2 w-full border border-ink py-2 text-center font-label text-[12px] font-semibold uppercase tracking-[0.08em] text-ink hover:bg-surface-high"
                >
                  {openDoor === door.id
                    ? "Hide door standards"
                    : `Review door ${door.id} standards`}
                </button>
                {openDoor === door.id && (
                  <p className="border border-rule bg-white p-3 text-[13px] leading-5 text-body-ink">
                    {door.standards}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-10 border-y border-surface-highest bg-surface-container py-10 px-6 md:px-10">
        <p className="font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-civic-green">
          The statutory sequence
        </p>
        <h3 className="mt-2 font-display text-[28px] font-medium text-ink md:text-[32px]">
          How an unrepresented citizen progresses through the Gateway
        </h3>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.08em] text-civic-green">
              Step 01 · Identification
            </p>
            <h4 className="mt-1 font-display text-[20px] text-ink">
              Deadlock auditing
            </h4>
            <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
              We check for a final response / deadlock — or whether the 8-week
              cooling-off window has run — before any portal filing.
            </p>
          </div>
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.08em] text-civic-green">
              Step 02 · Assembly
            </p>
            <h4 className="mt-1 font-display text-[20px] text-ink">
              The gate pack
            </h4>
            <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
              Facts are shaped into statutory headings. You approve each section
              before export unlocks.
            </p>
          </div>
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.08em] text-civic-green">
              Step 03 · Despatch
            </p>
            <h4 className="mt-1 font-display text-[20px] text-ink">
              Audited submission
            </h4>
            <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
              Download the pack for the scheme portal. Late, premature, or
              wrong-door paths stay locked.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 flex flex-col items-start justify-between gap-6 border border-outline-variant/40 bg-white p-8 md:flex-row md:items-center">
        <div>
          <h4 className="font-display text-[20px] text-ink">
            Statutory neutrality pledge
          </h4>
          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-on-surface-variant">
            ComplaintPath is not a claims management company and holds no
            financial relationship with regulated firms. You keep ownership of
            your submission. Not legal advice.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            intakeRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          className="shrink-0 bg-ink px-5 py-2.5 font-label text-[12px] font-semibold uppercase tracking-[0.1em] text-surface hover:bg-body-ink"
        >
          Start with your letter
        </button>
      </section>
    </div>
  );
}
