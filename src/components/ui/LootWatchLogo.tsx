interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <svg className={className} viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Crown (sits on upper eyelid) ── */}
      <path
        d="M24,52 L24,37 L38,18 L50,30 L60,6 L70,30 L82,18 L96,37 L96,52 Q78,41 60,40 Q42,41 24,52Z"
        fill="#C8A020" stroke="#1a1005" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
      />
      {/* Crown center peak highlight */}
      <polygon points="50,30 60,6 70,30" fill="#F0D040" opacity="0.6"/>

      {/* ── Eye outer (dark eyelid) ── */}
      <path d="M4,56 Q60,20 116,56 Q60,92 4,56Z" fill="#1a1005"/>

      {/* ── Eye inner (gold sclera) ── */}
      <path d="M14,56 Q60,28 106,56 Q60,84 14,56Z" fill="#C8A020"/>

      {/* ── Iris ── */}
      <circle cx="60" cy="56" r="17" fill="#8B6008"/>
      <circle cx="60" cy="56" r="17" fill="none" stroke="#D8AE24" strokeWidth="2"/>

      {/* ── Pupil — downward triangle ▽ ── */}
      <polygon points="46,48 74,48 60,70" fill="#1a1005"/>

    </svg>
  );
}
