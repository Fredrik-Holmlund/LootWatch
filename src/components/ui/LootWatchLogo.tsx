interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  // viewBox 0 0 100 85
  // Eye center: (50, 55). Upper eyelid control (50,22), lower (50,88).
  // Crown: 5 peaks rising above upper eyelid, closing along eyelid curve.
  // Iris: 12 radial spokes from center to ring, upward triangle ▲ covers center.
  const G = '#C8A020'; // gold
  const D = '#151008'; // near-black

  return (
    <svg className={className} viewBox="0 0 100 85" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Eye dark interior ── */}
      <path d="M3,55 Q50,22 97,55 Q50,88 3,55Z" fill={D}/>

      {/* ── Crown (gold filled, closes along upper eyelid) ── */}
      <path
        d="M13,49 L18,34 L25,42 L33,22 L41,38 L50,8 L59,38 L67,22 L75,42 L82,34 L87,49 Q50,30 13,49Z"
        fill={G} strokeLinejoin="round"
      />

      {/* ── Eye outline ── */}
      <path d="M3,55 Q50,22 97,55 Q50,88 3,55Z"
        stroke={G} strokeWidth="3.5" strokeLinejoin="round"/>

      {/* ── Crown outline (on top of eye stroke) ── */}
      <path
        d="M13,49 L18,34 L25,42 L33,22 L41,38 L50,8 L59,38 L67,22 L75,42 L82,34 L87,49"
        stroke={G} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>

      {/* ── Iris ring ── */}
      <circle cx="50" cy="55" r="13" fill={D} stroke={G} strokeWidth="2.5"/>

      {/* ── 12 radial spokes (from center to iris ring) ── */}
      <g stroke={G} strokeWidth="1.2" strokeLinecap="butt">
        <line x1="50" y1="55" x2="63"   y2="55"/>
        <line x1="50" y1="55" x2="61.3" y2="61.5"/>
        <line x1="50" y1="55" x2="56.5" y2="66.3"/>
        <line x1="50" y1="55" x2="50"   y2="68"/>
        <line x1="50" y1="55" x2="43.5" y2="66.3"/>
        <line x1="50" y1="55" x2="38.7" y2="61.5"/>
        <line x1="50" y1="55" x2="37"   y2="55"/>
        <line x1="50" y1="55" x2="38.7" y2="48.5"/>
        <line x1="50" y1="55" x2="43.5" y2="43.7"/>
        <line x1="50" y1="55" x2="50"   y2="42"/>
        <line x1="50" y1="55" x2="56.5" y2="43.7"/>
        <line x1="50" y1="55" x2="61.3" y2="48.5"/>
      </g>

      {/* ── Triangle pupil ▲ (covers spoke centres) ── */}
      <polygon points="50,47 44,62 56,62" fill={G}/>

    </svg>
  );
}
