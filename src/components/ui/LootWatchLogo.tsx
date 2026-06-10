interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  const GD = '#7a5008';   // dark gold
  const F = '#44cf6c';

  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Isometric chest — 3 visible faces ── */}

      {/* Front face */}
      <polygon points="18,55 82,55 82,85 18,85" fill="#1c1000" stroke={G} strokeWidth="2.5" strokeLinejoin="round"/>

      {/* Top face */}
      <polygon points="18,55 82,55 95,40 31,40" fill="#2a1800" stroke={G} strokeWidth="2.5" strokeLinejoin="round"/>

      {/* Right side face */}
      <polygon points="82,55 95,40 95,70 82,85" fill="#110b00" stroke={G} strokeWidth="2.5" strokeLinejoin="round"/>

      {/* Lid front face (slightly raised) */}
      <polygon points="18,42 82,42 82,55 18,55" fill="#241400" stroke={G} strokeWidth="2" strokeLinejoin="round"/>

      {/* Lid top face */}
      <polygon points="18,42 82,42 95,28 31,28" fill="#301c00" stroke={G} strokeWidth="2" strokeLinejoin="round"/>

      {/* Lid right face */}
      <polygon points="82,42 95,28 95,40 82,55" fill="#1a0e00" stroke={G} strokeWidth="2" strokeLinejoin="round"/>

      {/* Hinge line */}
      <line x1="18" y1="55" x2="82" y2="55" stroke={G} strokeWidth="3" opacity={0.9}/>
      <line x1="82" y1="55" x2="95" y2="40" stroke={G} strokeWidth="3" opacity={0.9}/>

      {/* Lock — front face center */}
      <rect x="42" y="58" width="18" height="14" rx="2" fill={G}/>
      <rect x="45" y="61" width="12" height="8" rx="1.5" fill="#1c1000"/>
      <circle cx="51" cy="64" r="2.2" fill={G}/>
      <path d="M49.5,66.2 L52.5,66.2 L52,70 L50,70 Z" fill={G}/>

      {/* Corner rivets — front */}
      <circle cx="23" cy="60" r="1.8" fill={G} opacity={0.75}/>
      <circle cx="77" cy="60" r="1.8" fill={G} opacity={0.75}/>
      <circle cx="23" cy="80" r="1.8" fill={G} opacity={0.75}/>
      <circle cx="77" cy="80" r="1.8" fill={G} opacity={0.75}/>

      {/* Gold trim on top face diagonal */}
      <line x1="31" y1="28" x2="18" y2="42" stroke={G} strokeWidth="1.5" opacity={0.5}/>

      {/* Fel glow leaking from lid crack */}
      <line x1="18" y1="55" x2="82" y2="55" stroke={F} strokeWidth="1.5" opacity={0.5}/>
      <line x1="82" y1="55" x2="95" y2="40" stroke={F} strokeWidth="1.5" opacity={0.5}/>

      {/* Subtle glow under chest */}
      <ellipse cx="55" cy="87" rx="36" ry="4" fill={F} opacity={0.12}/>

    </svg>
  );
}
