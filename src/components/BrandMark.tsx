/** The Process Insight glyph (same drawing as public/process-insight.svg, minus the tile). */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="8 8 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* start → task, with a decision below: a tiny process flow */}
      <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 22v8c0 3 2 5 5 5h18" />
        <path d="M32 35v9" />
      </g>
      <circle cx="18" cy="17" r="6" fill="currentColor" />
      <rect x="38" y="28" width="14" height="14" rx="3" fill="currentColor" />
      <path d="M32 40l7 7-7 7-7-7z" fill="currentColor" fillOpacity="0.65" />
    </svg>
  );
}
