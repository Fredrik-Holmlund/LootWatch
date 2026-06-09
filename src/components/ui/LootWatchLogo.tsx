interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Eye outline — wide almond, more curve on top ── */}
      <path d="M4,50 Q50,10 96,50 Q50,82 4,50 Z"
        stroke={G} strokeWidth="4" strokeLinejoin="round"/>

      {/* ── Iris ── */}
      <circle cx="50" cy="50" r="18" fill="#0a0d14" stroke={G} strokeWidth="3"/>

      {/* ── Slit pupil — vertical diamond ── */}
      <ellipse cx="50" cy="50" rx="5" ry="11" fill={G}/>

    </svg>
  );
}
