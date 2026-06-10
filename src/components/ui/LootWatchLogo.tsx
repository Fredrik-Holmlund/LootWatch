interface LootWatchLogoProps {
  className?: string;
  variant?: 'chest' | 'gem';
}

export function LootWatchLogo({ className = 'w-8 h-8', variant = 'gem' }: LootWatchLogoProps) {
  const G = '#C8A020';
  const F = '#44cf6c';

  if (variant === 'chest') {
    return (
      <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">
        {/* Chest body */}
        <rect x="12" y="53" width="76" height="36" rx="5" fill="#1a0e00" stroke={G} strokeWidth="3"/>
        {/* Chest lid */}
        <path d="M12,53 L12,38 Q12,30 50,30 Q88,30 88,38 L88,53 Z"
          fill="#1a0e00" stroke={G} strokeWidth="3"/>
        {/* Lid arc */}
        <path d="M18,49 Q50,34 82,49" stroke={G} strokeWidth="1.2" opacity={0.4}/>
        {/* Hinge band */}
        <rect x="12" y="51" width="76" height="5" fill={G} opacity={0.9}/>
        {/* Lock */}
        <rect x="38" y="44" width="24" height="18" rx="4" fill={G}/>
        <rect x="42" y="48" width="16" height="10" rx="2.5" fill="#1a0e00"/>
        <circle cx="50" cy="52" r="3" fill={G}/>
        <path d="M48,55 L52,55 L51,60 L49,60 Z" fill={G}/>
        {/* Corner bands */}
        <rect x="11" y="51" width="6" height="20" rx="1.5" fill={G} opacity={0.7}/>
        <rect x="83" y="51" width="6" height="20" rx="1.5" fill={G} opacity={0.7}/>
        {/* Glows */}
        <ellipse cx="50" cy="90" rx="32" ry="4" fill={F} opacity={0.15}/>
        <ellipse cx="50" cy="30" rx="26" ry="4" fill={F} opacity={0.1}/>
      </svg>
    );
  }

  // Geometric gem variant
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">
      {/* Outer gem outline */}
      <polygon points="50,6 88,30 88,70 50,94 12,70 12,30"
        fill="#0a1a0d" stroke={G} strokeWidth="2.5"/>

      {/* Inner facet lines from top */}
      <line x1="50" y1="6"  x2="50" y2="34" stroke={G} strokeWidth="1" opacity={0.5}/>
      <line x1="88" y1="30" x2="50" y2="34" stroke={G} strokeWidth="1" opacity={0.5}/>
      <line x1="12" y1="30" x2="50" y2="34" stroke={G} strokeWidth="1" opacity={0.5}/>

      {/* Inner facet lines from bottom */}
      <line x1="50" y1="94" x2="50" y2="66" stroke={G} strokeWidth="1" opacity={0.5}/>
      <line x1="88" y1="70" x2="50" y2="66" stroke={G} strokeWidth="1" opacity={0.5}/>
      <line x1="12" y1="70" x2="50" y2="66" stroke={G} strokeWidth="1" opacity={0.5}/>

      {/* Center girdle ring */}
      <polygon points="50,34 75,50 50,66 25,50"
        fill="none" stroke={G} strokeWidth="1.5" opacity={0.6}/>

      {/* Top facet fill — lighter */}
      <polygon points="50,6 88,30 50,34 12,30" fill={G} opacity={0.08}/>

      {/* Center gem highlight */}
      <polygon points="50,34 75,50 50,66 25,50" fill={F} opacity={0.12}/>

      {/* Bright center sparkle */}
      <circle cx="50" cy="50" r="4" fill={F} opacity={0.6}/>
      <circle cx="50" cy="50" r="2" fill={G}/>

      {/* Corner glints */}
      <circle cx="50" cy="6"  r="2" fill={G} opacity={0.8}/>
      <circle cx="88" cy="30" r="2" fill={G} opacity={0.8}/>
      <circle cx="88" cy="70" r="2" fill={G} opacity={0.8}/>
      <circle cx="50" cy="94" r="2" fill={G} opacity={0.8}/>
      <circle cx="12" cy="70" r="2" fill={G} opacity={0.8}/>
      <circle cx="12" cy="30" r="2" fill={G} opacity={0.8}/>
    </svg>
  );
}
