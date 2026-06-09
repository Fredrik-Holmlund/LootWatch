interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  // Left tip: (13,52), Right tip: (87,48)
  // Upper arc peaks at (50,18), lower arc at (50,74)
  // Left tail sweeps down-left, right tail sweeps up-right
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Upper eyelid ── */}
      <path d="M13,52 Q50,18 87,48"
        stroke={G} strokeWidth="3.5" strokeLinecap="round"/>

      {/* ── Lower eyelid ── */}
      <path d="M13,52 Q50,74 87,48"
        stroke={G} strokeWidth="3.5" strokeLinecap="round"/>

      {/* ── Left tail — sweeps down-left ── */}
      <path d="M13,52 Q7,59 4,68"
        stroke={G} strokeWidth="3.5" strokeLinecap="round"/>

      {/* ── Right tail — sweeps up-right ── */}
      <path d="M87,48 Q93,42 96,33"
        stroke={G} strokeWidth="3.5" strokeLinecap="round"/>

      {/* ── Iris ring ── */}
      <circle cx="50" cy="48" r="14" stroke={G} strokeWidth="3"/>

      {/* ── Spiral — clockwise, expanding outward from near-center ── */}
      <path d="M51,48 C51,45 55,44 55,47 C55,52 51,56 47,55 C42,54 40,50 41,46 C42,40 48,37 54,38 C61,39 63,46 62,52"
        stroke={G} strokeWidth="2.5" strokeLinecap="round"/>

    </svg>
  );
}
