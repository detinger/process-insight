export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      {/* Three stacked chevrons — process layers flowing forward */}
      <path d="M2 7.5 L7 10 L2 12.5"  stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M7 7.5 L12 10 L7 12.5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" strokeOpacity="0.7" />
      <path d="M12 7.5 L17 10 L12 12.5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" strokeOpacity="0.4" />
    </svg>
  );
}
