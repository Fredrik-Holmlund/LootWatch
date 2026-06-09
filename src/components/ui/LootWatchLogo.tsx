interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  // viewBox 0 0 100 100
  // Outer eye: tips at (5,60) and (95,60), top (50,33), bottom (50,87)
  // Inner eye: same tips, top (50,44), bottom (50,76)
  // Crown base connects at ~(37,41) and (63,41) on upper-left/right outer eye edges
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Crown (3 peaks, line art) ── */}
      <path
        d="M37,41 L32,18 L41,26 L50,8 L59,26 L68,18 L63,41"
        stroke={G} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
      />

      {/* ── Outer eye (angular diamond) ── */}
      <path d="M5,60 L50,33 L95,60 L50,87 Z"
        stroke={G} strokeWidth="3" strokeLinejoin="round"/>

      {/* ── Inner eye (smaller concentric diamond, same tips) ── */}
      <path d="M5,60 L50,44 L95,60 L50,76 Z"
        stroke={G} strokeWidth="2.5" strokeLinejoin="round"/>

      {/* ── Iris ring ── */}
      <circle cx="50" cy="60" r="13" stroke={G} strokeWidth="2.5"/>

      {/* ── Upward triangle ▲ ── */}
      <polygon points="50,51 43,67 57,67" fill={G}/>

      {/* ── Bottom accent (small downward V below lower tip) ── */}
      <path d="M44,88 L50,95 L56,88"
        stroke={G} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>

    </svg>
  );
}
