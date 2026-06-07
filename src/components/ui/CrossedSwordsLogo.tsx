export function CrossedSwordsLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top-left blade — sweeps from center to upper-left tip */}
      <path d="M14,13 C8,6 2,2 2,2 C4,6 8,10 11,12 Z" fill="currentColor" />

      {/* Top-right blade — mirror of top-left */}
      <path d="M18,13 C24,6 30,2 30,2 C28,6 24,10 21,12 Z" fill="currentColor" />

      {/* Bottom-left blade — hooks downward */}
      <path d="M11,20 C5,24 2,30 2,30 C6,28 10,24 13,20 Z" fill="currentColor" opacity="0.8" />

      {/* Bottom-right blade — mirror of bottom-left */}
      <path d="M21,20 C27,24 30,30 30,30 C26,28 22,24 19,20 Z" fill="currentColor" opacity="0.8" />

      {/* Center medallion */}
      <circle cx="16" cy="16" r="5.5" fill="currentColor" />
      {/* Inner ring detail */}
      <circle cx="16" cy="16" r="2.8" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      {/* Center dot */}
      <circle cx="16" cy="16" r="1" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}
