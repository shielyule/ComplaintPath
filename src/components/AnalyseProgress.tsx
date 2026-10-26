"use client";

import { useEffect, useState } from "react";

const STAGES = [
  {
    id: "contact",
    label: "Contacting AI runtime",
    detail: "Nightshift (Nemotron) · xAI Grok backup",
  },
  {
    id: "extract",
    label: "AI reading your letter",
    detail: "Extracting firm, dates, Final Response / deadlock signals",
  },
  {
    id: "data",
    label: "Loading scheme clocks",
    detail: "Zetaris scheme rules · Bright Data portal check",
  },
  {
    id: "gate",
    label: "Running hard gates",
    detail: "Eligible · Premature · Out of Time · Wrong Door — in code, not inventing dates",
  },
  {
    id: "pack",
    label: "Drafting pack I–IV",
    detail: "Meterless World Model · human-approve sections",
  },
] as const;

/** Staged progress while /api/run is in flight. */
export function AnalyseProgress({ active }: { active: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setIdx(0);
      return;
    }
    setIdx(0);
    const timers = [
      window.setTimeout(() => setIdx(1), 1800),
      window.setTimeout(() => setIdx(2), 4500),
      window.setTimeout(() => setIdx(3), 8000),
      window.setTimeout(() => setIdx(4), 12000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="mt-4 border border-ink bg-white p-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-ink"
          aria-hidden
        />
        <div>
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-civic-green">
            Live agent pipeline
          </p>
          <p className="font-display text-[18px] text-ink">{STAGES[idx]!.label}</p>
          <p className="text-[13px] text-on-surface-variant">
            {STAGES[idx]!.detail}
          </p>
        </div>
      </div>
      <ol className="mt-5 space-y-2">
        {STAGES.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <li
              key={s.id}
              className={`flex items-center gap-3 font-label text-[12px] uppercase tracking-[0.06em] ${
                current
                  ? "font-semibold text-ink"
                  : done
                    ? "text-civic-green"
                    : "text-outline-variant"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                  current
                    ? "border-ink bg-ink text-surface"
                    : done
                      ? "border-civic-green bg-[#EBF4F0] text-civic-green"
                      : "border-outline-variant"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
