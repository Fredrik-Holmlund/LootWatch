interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  // Eye tips at (5,58) and (95,58)
  // Outer eye: top arc peaks at (50,24), bottom arc at (50,80) — more curve on top
  // Inner eye: top arc peaks at (50,36), bottom arc at (50,70)
  // Crown base sits on the top arc at roughly x=36 and x=64
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Crown (3 peaks, line art) ── */}
      <path
        d="M36,40 L30,16 L40,26 L50,7 L60,26 L70,16 L64,40"
        stroke={G} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
      />

      {/* ── Outer eye (curved almond) ── */}
      <path d="M5,58 Q50,22 95,58 Q50,84 5,58 Z"
        stroke={G} strokeWidth="3" strokeLinejoin="round"/>

      {/* ── Inner eye (concentric, same tips) ── */}
      <path d="M5,58 Q50,36 95,58 Q50,72 5,58 Z"
        stroke={G} strokeWidth="2" strokeLinejoin="round"/>

      {/* ── Iris ring ── */}
      <circle cx="50" cy="55" r="12" stroke={G} strokeWidth="2.5"/>

      {/* ── Upward triangle ▲ ── */}
      <polygon points="50,47 43,62 57,62" fill={G}/>

      {/* ── Bottom accent (small downward V below lower tip) ── */}
      <path d="M44,85 L50,92 L56,85"
        stroke={G} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>

    </svg>
  );
}
