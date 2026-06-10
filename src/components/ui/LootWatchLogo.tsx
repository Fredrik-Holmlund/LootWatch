interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  const G = '#C8A020';
  const F = '#44cf6c';
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* Shield body */}
      <path d="M10,14 L90,14 L90,58 Q90,80 50,92 Q10,80 10,58 Z"
        fill="#0d2a1a" stroke={G} strokeWidth="3.5" strokeLinejoin="round"/>

      {/* Shield inner border */}
      <path d="M16,19 L84,19 L84,57 Q84,76 50,87 Q16,76 16,57 Z"
        fill="none" stroke={G} strokeWidth="1.2" opacity={0.45}/>

      {/* Compass star */}
      <g transform="translate(50,22)">
        <polygon points="0,-9 2.2,-2 0,-4.5 -2.2,-2" fill={G}/>
        <polygon points="0,9 2.2,2 0,4.5 -2.2,2" fill={G}/>
        <polygon points="-9,0 -2,-2.2 -4.5,0 -2,2.2" fill={G}/>
        <polygon points="9,0 2,-2.2 4.5,0 2,2.2" fill={G}/>
        <polygon points="-6.4,-6.4 -1.5,-1.5 -3,-3 -1.5,-3" fill={G} opacity={0.65}/>
        <polygon points="6.4,-6.4 1.5,-1.5 3,-3 1.5,-3" fill={G} opacity={0.65}/>
        <polygon points="-6.4,6.4 -1.5,1.5 -3,3 -1.5,3" fill={G} opacity={0.65}/>
        <polygon points="6.4,6.4 1.5,1.5 3,3 1.5,3" fill={G} opacity={0.65}/>
        <circle cx="0" cy="0" r="2.8" fill={F}/>
        <circle cx="0" cy="0" r="1.3" fill={G}/>
      </g>

      {/* Chest body */}
      <rect x="25" y="57" width="50" height="26" rx="2.5"
        fill="#7a5008" stroke={G} strokeWidth="2.2"/>

      {/* Chest lid */}
      <path d="M25,57 L25,48 Q25,44 50,44 Q75,44 75,48 L75,57 Z"
        fill="#96620c" stroke={G} strokeWidth="2.2"/>

      {/* Lid highlight arc */}
      <path d="M29,55 Q50,46 71,55" stroke={G} strokeWidth="0.9" opacity={0.4}/>

      {/* Clasp band */}
      <rect x="25" y="55.5" width="50" height="4" fill={G} opacity={0.85}/>

      {/* Lock plate */}
      <rect x="43" y="51" width="14" height="11" rx="2.5" fill={G}/>
      <rect x="45.5" y="54" width="9" height="6" rx="1.5" fill="#7a5008"/>
      <circle cx="50" cy="56.5" r="1.8" fill={G}/>

      {/* Corner rivets */}
      <circle cx="30" cy="66" r="1.5" fill={G} opacity={0.7}/>
      <circle cx="70" cy="66" r="1.5" fill={G} opacity={0.7}/>
      <circle cx="30" cy="76" r="1.5" fill={G} opacity={0.7}/>
      <circle cx="70" cy="76" r="1.5" fill={G} opacity={0.7}/>

      {/* Green glow under chest */}
      <ellipse cx="50" cy="83" rx="22" ry="4" fill={F} opacity={0.15}/>

    </svg>
  );
}
