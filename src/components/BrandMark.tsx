/** ComplaintPath monogram: serif C + civic green path-dot. */
export function BrandMark({
  className = "h-10 w-10",
  title = "ComplaintPath",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <text
        x="6"
        y="50"
        fontFamily="Georgia, 'Times New Roman', Times, serif"
        fontSize="54"
        fontWeight={500}
        fill="#111c24"
      >
        C
      </text>
      <circle cx="48" cy="34" r="9" fill="#174334" />
      <rect x="37" y="50" width="22" height="4.5" rx={0.5} fill="#111c24" />
    </svg>
  );
}

/** Two-tone wordmark: Complaint (ink) + Path (civic green). */
export function BrandWordmark({
  className = "font-display text-[24px] font-medium leading-tight tracking-tight",
}: {
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="text-ink">Complaint</span>
      <span className="text-civic-green">Path</span>
    </span>
  );
}
