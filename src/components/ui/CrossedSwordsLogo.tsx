export function CrossedSwordsLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sword 1: top-left to bottom-right */}
      {/* Blade */}
      <line x1="4" y1="4" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Guard */}
      <line x1="18" y1="14" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="22" x2="18" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Grip */}
      <line x1="22" y1="22" x2="26" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pommel */}
      <circle cx="27" cy="27" r="1.5" fill="currentColor" />

      {/* Sword 2: top-right to bottom-left */}
      {/* Blade */}
      <line x1="28" y1="4" x2="10" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Guard */}
      <line x1="14" y1="14" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="22" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Grip */}
      <line x1="10" y1="22" x2="6" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pommel */}
      <circle cx="5" cy="27" r="1.5" fill="currentColor" />
    </svg>
  );
}
