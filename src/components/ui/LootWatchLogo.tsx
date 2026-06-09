interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <svg className={className} viewBox="0 0 200 215" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* clip to full crown+circle silhouette */}
        <clipPath id="lwfc">
          <path d="M64,56 L68,46 L80,35 L92,46 L100,22 L108,46 L120,35 L132,46 L136,56 A72,72,0,1,1,64,56Z"/>
        </clipPath>
        {/* clip to circle only */}
        <clipPath id="lwcc">
          <circle cx="100" cy="120" r="72"/>
        </clipPath>
      </defs>

      {/* ── Base fill (medium gold) ── */}
      <path
        d="M64,56 L68,46 L80,35 L92,46 L100,22 L108,46 L120,35 L132,46 L136,56 A72,72,0,1,1,64,56Z"
        fill="#C09818"
      />

      {/* ── Circle facet panels (8 sectors, lit from top) ── */}
      <g clipPath="url(#lwcc)">
        <polygon points="100,120 100,48 151,69"   fill="#EBC840"/>
        <polygon points="100,120 151,69  172,120"  fill="#D0A020"/>
        <polygon points="100,120 172,120 151,171" fill="#A87010"/>
        <polygon points="100,120 151,171 100,192" fill="#886008"/>
        <polygon points="100,120 100,192 49,171"  fill="#886008"/>
        <polygon points="100,120 49,171  28,120"  fill="#A87010"/>
        <polygon points="100,120 28,120  49,69"   fill="#D0A020"/>
        <polygon points="100,120 49,69   100,48"  fill="#EBC840"/>
      </g>

      {/* ── Crown facet panels ── */}
      <polygon clipPath="url(#lwfc)" points="64,56 68,46 80,35 92,46 100,58" fill="#D8AA20"/>
      <polygon clipPath="url(#lwfc)" points="92,46 100,22 108,46"             fill="#F2DC44"/>
      <polygon clipPath="url(#lwfc)" points="100,58 108,46 120,35 132,46 136,56" fill="#D8AA20"/>

      {/* ── Radial facet lines from circle centre ── */}
      <g clipPath="url(#lwcc)" stroke="#1C1208" strokeWidth="1.6" strokeLinecap="round">
        <line x1="100" y1="120" x2="100" y2="48"/>
        <line x1="100" y1="120" x2="151" y2="69"/>
        <line x1="100" y1="120" x2="172" y2="120"/>
        <line x1="100" y1="120" x2="151" y2="171"/>
        <line x1="100" y1="120" x2="100" y2="192"/>
        <line x1="100" y1="120" x2="49"  y2="171"/>
        <line x1="100" y1="120" x2="28"  y2="120"/>
        <line x1="100" y1="120" x2="49"  y2="69"/>
      </g>

      {/* ── Crown outline ── */}
      <g stroke="#1C1208" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="64,56 68,46 80,35 92,46 100,22 108,46 120,35 132,46 136,56"/>
        <line x1="92" y1="46" x2="100" y2="58"/>
        <line x1="100" y1="58" x2="108" y2="46"/>
      </g>

      {/* ── Orbit / sash band (drawn under eye) ── */}
      <g clipPath="url(#lwcc)">
        {/* dark shell of band */}
        <ellipse cx="100" cy="126" rx="78" ry="16" transform="rotate(-18 100 126)"
          fill="none" stroke="#1C1208" strokeWidth="18"/>
        {/* gold fill of band */}
        <ellipse cx="100" cy="126" rx="78" ry="16" transform="rotate(-18 100 126)"
          fill="none" stroke="#B08014" strokeWidth="11"/>
      </g>

      {/* ── Eye outer — dark eyelid surround ── */}
      <path d="M36,120 Q66,78 100,78 Q134,78 164,120 Q134,162 100,162 Q66,162 36,120Z" fill="#1C1208"/>

      {/* ── Eye inner — gold region ── */}
      <path d="M48,120 Q74,91 100,91 Q126,91 152,120 Q126,149 100,149 Q74,149 48,120Z" fill="#C09818"/>

      {/* ── Iris ── */}
      <circle cx="100" cy="120" r="26" fill="#8B6308"/>
      <circle cx="100" cy="120" r="26" fill="none" stroke="#D8AE24" strokeWidth="2.5"/>

      {/* ── Downward triangle pupil (▽) ── */}
      <polygon points="83,109 117,109 100,138" fill="#1C1208"/>

      {/* ── Outer stroke (full silhouette) ── */}
      <path
        d="M64,56 L68,46 L80,35 L92,46 L100,22 L108,46 L120,35 L132,46 L136,56 A72,72,0,1,1,64,56Z"
        fill="none" stroke="#1C1208" strokeWidth="3.5" strokeLinejoin="round"
      />
    </svg>
  );
}
