interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Crown — floats above eye, not touching ── */}
      <path
        d="M30,38 L24,14 L37,26 L50,6 L63,26 L76,14 L70,38"
        stroke={G} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"
      />

      {/* ── Eye outline — single almond, asymmetric arcs ── */}
      <path d="M5,62 Q50,26 95,62 Q50,88 5,62 Z"
        stroke={G} strokeWidth="3" strokeLinejoin="round"/>

      {/* ── Iris — filled dark circle with gold ring ── */}
      <circle cx="50" cy="62" r="16" fill="#0a0d14" stroke={G} strokeWidth="2.5"/>

      {/* ── Pupil triangle ▲ ── */}
      <polygon points="50,53 41,70 59,70" fill={G}/>

    </svg>
  );
}
