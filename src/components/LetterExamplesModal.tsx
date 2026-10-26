"use client";

const EXAMPLES = [
  {
    href: "/examples/01_bank_final_response_fos.pdf",
    title: "Bank Final Response (FOS)",
    blurb:
      "The firm finished investigating and rejected your claim. Often says “Final Response” and mentions the Financial Ombudsman within 6 months.",
  },
  {
    href: "/examples/02_energy_deadlock_letter.pdf",
    title: "Energy deadlock letter",
    blurb:
      "Your supplier says talks have ended (“deadlock”) and points you to the Energy Ombudsman — not a bank letter.",
  },
  {
    href: "/examples/03_ico_dpo_response.pdf",
    title: "DPO / data protection reply",
    blurb:
      "An organisation’s Data Protection Officer answers a SAR or data complaint. May lead to the ICO (compliance), not a money award.",
  },
  {
    href: "/examples/04_parking_operator_rejection.pdf",
    title: "Private parking rejection",
    blurb:
      "A private parking firm rejects your appeal, often with a POPLA code. Wrong door if you send this to FOS.",
  },
  {
    href: "/examples/05_premature_holding_reply.pdf",
    title: "Holding / acknowledgement (premature)",
    blurb:
      "“We are still investigating” — not a Final Response yet. Escalating now is usually too early (Premature).",
  },
];

export function LetterExamplesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="letter-examples-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-ink bg-surface p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-civic-green">
              What to paste or upload
            </p>
            <h2
              id="letter-examples-title"
              className="mt-1 font-display text-[24px] font-medium text-ink"
            >
              Rejection &amp; final response documents
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-outline-variant px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.08em] text-ink hover:bg-surface-low"
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-[15px] leading-6 text-on-surface-variant">
          ComplaintPath reads the firm’s written reply after you complained —
          not your original complaint, and not a random invoice. Look for words
          like <em>Final Response</em>, <em>deadlock</em>, <em>we will not
          uphold</em>, or <em>you may refer to the Ombudsman</em>.
        </p>

        <ul className="mt-6 space-y-4">
          {EXAMPLES.map((ex) => (
            <li
              key={ex.href}
              className="border border-rule bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-[18px] text-ink">{ex.title}</h3>
                  <p className="mt-1 text-[13px] leading-5 text-on-surface-variant">
                    {ex.blurb}
                  </p>
                </div>
                <a
                  href={ex.href}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 border border-ink px-3 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-ink hover:bg-surface-low"
                >
                  Open PDF
                </a>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[12px] leading-5 text-on-surface-variant">
          Examples are fictional for demo use. Not real correspondence. Not
          legal advice.
        </p>
      </div>
    </div>
  );
}
