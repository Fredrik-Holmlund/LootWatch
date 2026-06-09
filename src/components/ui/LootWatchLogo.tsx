interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  // Circle: center (100,128), r=70. Top of circle = y=58.
  // Crown peaks well above y=58 so they clearly read as a crown.
  return (
    <svg className={className} viewBox="0 0 200 222" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Full silhouette: crown + circle */}
        <clipPath id="lwfc">
          <path d="M62,62 L66,48 L78,24 L90,48 L100,8 L110,48 L122,24 L134,48 L138,62 A70,70,0,1,1,62,62Z"/>
        </clipPath>
        {/* Circle only */}
        <clipPath id="lwcc">
          <circle cx="100" cy="128" r="70"/>
        </clipPath>
      </defs>

      {/* ── Base gold fill ── */}
      <path
        d="M62,62 L66,48 L78,24 L90,48 L100,8 L110,48 L122,24 L134,48 L138,62 A70,70,0,1,1,62,62Z"
        fill="#C09818"
      />

      {/* ── Circle facets (8 sectors, bright top → dark bottom) ── */}
      <g clipPath="url(#lwcc)">
        <polygon points="100,128 100,58 149,77"   fill="#EBC840"/>
        <polygon points="100,128 149,77  170,128"  fill="#D0A020"/>
        <polygon points="100,128 170,128 149,179" fill="#A87010"/>
        <polygon points="100,128 149,179 100,198" fill="#886008"/>
        <polygon points="100,128 100,198 51,179"  fill="#886008"/>
        <polygon points="100,128 51,179  30,128"  fill="#A87010"/>
        <polygon points="100,128 30,128  51,77"   fill="#D0A020"/>
        <polygon points="100,128 51,77   100,58"  fill="#EBC840"/>
      </g>

      {/* ── Crown facet shading ── */}
      {/* Left wing: shoulder → left peak → valley */}
      <polygon clipPath="url(#lwfc)" points="62,62 66,48 78,24 90,48 100,66" fill="#D0A020"/>
      {/* Center peak: brightest point of crown */}
      <polygon clipPath="url(#lwfc)" points="90,48 100,8 110,48" fill="#F4DE48"/>
      {/* Right wing */}
      <polygon clipPath="url(#lwfc)" points="100,66 110,48 122,24 134,48 138,62" fill="#D0A020"/>

      {/* ── Radial facet lines (circle) ── */}
      <g clipPath="url(#lwcc)" stroke="#1C1208" strokeWidth="1.5" strokeLinecap="round">
        <line x1="100" y1="128" x2="100" y2="58"/>
        <line x1="100" y1="128" x2="149" y2="77"/>
        <line x1="100" y1="128" x2="170" y2="128"/>
        <line x1="100" y1="128" x2="149" y2="179"/>
        <line x1="100" y1="128" x2="100" y2="198"/>
        <line x1="100" y1="128" x2="51"  y2="179"/>
        <line x1="100" y1="128" x2="30"  y2="128"/>
        <line x1="100" y1="128" x2="51"  y2="77"/>
      </g>

      {/* ── Crown outline — thick so it reads clearly at small sizes ── */}
      <g stroke="#1C1208" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Main zigzag silhouette */}
        <polyline points="62,62 66,48 78,24 90,48 100,8 110,48 122,24 134,48 138,62"/>
        {/* Inner valley lines (creates crown "base" visual) */}
        <line x1="90" y1="48" x2="100" y2="66"/>
        <line x1="100" y1="66" x2="110" y2="48"/>
        {/* Horizontal base of crown where it meets circle */}
        <line x1="62" y1="62" x2="90"  y2="62"/>
        <line x1="110" y1="62" x2="138" y2="62"/>
      </g>

      {/* ── Orbit sash band (behind eye) ── */}
      <g clipPath="url(#lwcc)">
        <ellipse cx="100" cy="134" rx="76" ry="16" transform="rotate(-18 100 134)"
          fill="none" stroke="#1C1208" strokeWidth="18"/>
        <ellipse cx="100" cy="134" rx="76" ry="16" transform="rotate(-18 100 134)"
          fill="none" stroke="#B08014" strokeWidth="11"/>
      </g>

      {/* ── Eye outer (dark eyelid surround) ── */}
      <path d="M34,128 Q64,84 100,84 Q136,84 166,128 Q136,172 100,172 Q64,172 34,128Z" fill="#1C1208"/>

      {/* ── Eye inner (gold) ── */}
      <path d="M46,128 Q72,97 100,97 Q128,97 154,128 Q128,159 100,159 Q72,159 46,128Z" fill="#C09818"/>

      {/* ── Iris ── */}
      <circle cx="100" cy="128" r="26" fill="#8B6308"/>
      <circle cx="100" cy="128" r="26" fill="none" stroke="#D8AE24" strokeWidth="2.5"/>

      {/* ── Triangle pupil ▽ ── */}
      <polygon points="83,117 117,117 100,146" fill="#1C1208"/>

      {/* ── Outer stroke ── */}
      <path
        d="M62,62 L66,48 L78,24 L90,48 L100,8 L110,48 L122,24 L134,48 L138,62 A70,70,0,1,1,62,62Z"
        fill="none" stroke="#1C1208" strokeWidth="3.5" strokeLinejoin="round"
      />
    </svg>
  );
}
