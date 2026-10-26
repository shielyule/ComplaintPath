"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Small “i” control with a plain-English explanation popover. */
export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`About: ${label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink bg-white font-label text-[10px] font-bold leading-none text-ink hover:bg-surface-low"
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="dialog"
          className="absolute left-0 top-6 z-50 w-[min(320px,calc(100vw-2rem))] border border-ink bg-surface p-3 text-left shadow-none"
        >
          <span className="block font-label text-[10px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            {label}
          </span>
          <span className="mt-1.5 block text-[13px] leading-5 text-body-ink">
            {children}
          </span>
        </span>
      )}
    </span>
  );
}

export function StageBack({
  onBack,
  label = "Back",
}: {
  onBack: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="border border-outline-variant px-4 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:bg-surface-low"
    >
      ← {label}
    </button>
  );
}
