export function CrossedSwordsLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Sword 2 (NE tip → SW handle) — drawn behind ── */}

      {/* Blade: tapered triangle, tip at (28,3), base at guard */}
      <polygon points="28,3 8.6,22.4 11.4,19.6" fill="currentColor" opacity="0.75" />

      {/* Crossguard: perpendicular bar */}
      <line x1="8.0" y1="17.0" x2="14.0" y2="23.0"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Grip: wrapped handle */}
      <line x1="10.5" y1="22.5" x2="6" y2="27"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />

      {/* Pommel: round knob */}
      <circle cx="4.8" cy="28.2" r="2.2" fill="currentColor" />


      {/* ── Sword 1 (NW tip → SE handle) — drawn in front ── */}

      {/* Blade: tapered triangle, tip at (4,3) */}
      <polygon points="4,3 23.4,19.6 20.6,22.4" fill="currentColor" />

      {/* Fuller (ridge reflection) for metallic depth */}
      <line x1="5" y1="4.5" x2="19.5" y2="19"
            stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.18" />

      {/* Crossguard */}
      <line x1="24.0" y1="17.0" x2="18.0" y2="23.0"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Grip */}
      <line x1="21.5" y1="22.5" x2="26" y2="27"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />

      {/* Pommel */}
      <circle cx="27.2" cy="28.2" r="2.2" fill="currentColor" />
    </svg>
  );
}
