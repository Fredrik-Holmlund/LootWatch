interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  const F = '#44cf6c';
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* Shield body */}
      <path d="M10,12 L90,12 L90,58 Q90,82 50,94 Q10,82 10,58 Z"
        fill="#0d2a1a" stroke={G} strokeWidth="3.5" strokeLinejoin="round"/>

      {/* Shield inner border */}
      <path d="M16,18 L84,18 L84,57 Q84,78 50,89 Q16,78 16,57 Z"
        fill="none" stroke={G} strokeWidth="1.2" opacity={0.45}/>

      {/* Chest — centered, rotated ~-8deg */}
      <g transform="translate(50,54) rotate(-8)">
        {/* Chest body */}
        <rect x="-24" y="0" width="48" height="24" rx="2.5"
          fill="#7a5008" stroke={G} strokeWidth="2.2"/>

        {/* Chest lid */}
        <path d="M-24,0 L-24,-10 Q-24,-14 0,-14 Q24,-14 24,-10 L24,0 Z"
          fill="#96620c" stroke={G} strokeWidth="2.2"/>

        {/* Lid highlight arc */}
        <path d="M-20,-2 Q0,-11 20,-2" stroke={G} strokeWidth="0.9" opacity={0.4}/>

        {/* Clasp band */}
        <rect x="-24" y="-1" width="48" height="4" fill={G} opacity={0.85}/>

        {/* Lock plate */}
        <rect x="-7" y="-5" width="14" height="11" rx="2.5" fill={G}/>
        <rect x="-4.5" y="-2" width="9" height="6" rx="1.5" fill="#7a5008"/>
        <circle cx="0" cy="0.5" r="1.8" fill={G}/>

        {/* Corner rivets */}
        <circle cx="-19" cy="8" r="1.5" fill={G} opacity={0.7}/>
        <circle cx="19" cy="8" r="1.5" fill={G} opacity={0.7}/>
        <circle cx="-19" cy="18" r="1.5" fill={G} opacity={0.7}/>
        <circle cx="19" cy="18" r="1.5" fill={G} opacity={0.7}/>

        {/* Green glow under chest */}
        <ellipse cx="0" cy="26" rx="20" ry="4" fill={F} opacity={0.18}/>
      </g>

    </svg>
  );
}
