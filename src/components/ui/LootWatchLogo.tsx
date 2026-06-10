interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  const F = '#44cf6c';
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* Chest body */}
      <rect x="10" y="52" width="80" height="38" rx="5"
        fill="#1a0e00" stroke={G} strokeWidth="3"/>

      {/* Chest lid */}
      <path d="M10,52 L10,36 Q10,28 50,28 Q90,28 90,36 L90,52 Z"
        fill="#1a0e00" stroke={G} strokeWidth="3"/>

      {/* Lid arc highlight */}
      <path d="M16,48 Q50,32 84,48" stroke={G} strokeWidth="1.2" opacity={0.4}/>

      {/* Horizontal band / hinge */}
      <rect x="10" y="50" width="80" height="5" fill={G} opacity={0.9}/>

      {/* Lock plate */}
      <rect x="38" y="43" width="24" height="18" rx="4" fill={G}/>
      <rect x="42" y="47" width="16" height="10" rx="2.5" fill="#1a0e00"/>
      {/* Keyhole */}
      <circle cx="50" cy="51" r="3" fill={G}/>
      <path d="M48,54 L52,54 L51,59 L49,59 Z" fill={G}/>

      {/* Corner bands */}
      <rect x="9" y="50" width="6" height="22" rx="1.5" fill={G} opacity={0.7}/>
      <rect x="85" y="50" width="6" height="22" rx="1.5" fill={G} opacity={0.7}/>

      {/* Subtle green glow beneath */}
      <ellipse cx="50" cy="91" rx="34" ry="5" fill={F} opacity={0.15}/>

      {/* Lid glow top */}
      <ellipse cx="50" cy="28" rx="28" ry="4" fill={F} opacity={0.1}/>

    </svg>
  );
}
