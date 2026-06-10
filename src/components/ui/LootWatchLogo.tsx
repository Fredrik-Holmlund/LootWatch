interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Low-poly chest — triangular facets ── */}

      {/* === LID === */}
      {/* Lid — top-left triangle */}
      <polygon points="12,38 50,28 50,46" fill="#e8b830"/>
      {/* Lid — top-right triangle */}
      <polygon points="88,38 50,28 50,46" fill="#c49a18"/>
      {/* Lid — bottom-left triangle */}
      <polygon points="12,38 50,46 12,52" fill="#d4a820"/>
      {/* Lid — bottom-right triangle */}
      <polygon points="88,38 50,46 88,52" fill="#a07e10"/>
      {/* Lid — center diamond */}
      <polygon points="50,28 88,38 50,46 12,38" fill="#f0c840" opacity="0.0"/>

      {/* === BODY === */}
      {/* Body — upper-left */}
      <polygon points="12,52 50,52 30,68" fill="#c49a18"/>
      {/* Body — upper-right */}
      <polygon points="88,52 50,52 70,68" fill="#8a6c0a"/>
      {/* Body — upper-center */}
      <polygon points="50,52 70,68 30,68" fill="#b08a14"/>
      {/* Body — lower-left */}
      <polygon points="12,52 30,68 12,84" fill="#d4a820"/>
      {/* Body — lower-right */}
      <polygon points="88,52 70,68 88,84" fill="#7a5c08"/>
      {/* Body — lower-center-left */}
      <polygon points="30,68 12,84 50,84" fill="#b89016"/>
      {/* Body — lower-center-right */}
      <polygon points="70,68 88,84 50,84" fill="#9a7810"/>
      {/* Body — bottom strip */}
      <polygon points="30,68 70,68 50,84" fill="#c8a020"/>

      {/* === LOCK === */}
      {/* Lock plate — left facet */}
      <polygon points="43,55 50,53 50,63 43,65" fill="#f0d060"/>
      {/* Lock plate — right facet */}
      <polygon points="57,55 50,53 50,63 57,65" fill="#c8a020"/>
      {/* Keyhole circle */}
      <circle cx="50" cy="59" r="3.5" fill="#1a0e00"/>
      <polygon points="48,61 52,61 51.5,66 48.5,66" fill="#1a0e00"/>

      {/* === HINGE LINE (seam) === */}
      <line x1="12" y1="52" x2="88" y2="52" stroke="#1a0e00" strokeWidth="1.5" opacity="0.6"/>

      {/* === OUTLINE edges === */}
      {/* Lid outline */}
      <polyline points="12,52 12,38 50,28 88,38 88,52" fill="none" stroke="#1a0e00" strokeWidth="1.2" strokeLinejoin="round" opacity="0.5"/>
      {/* Body outline */}
      <polyline points="12,52 12,84 88,84 88,52" fill="none" stroke="#1a0e00" strokeWidth="1.2" strokeLinejoin="round" opacity="0.5"/>

      {/* === FEL green accent — glowing seam === */}
      <line x1="16" y1="52" x2="84" y2="52" stroke="#44cf6c" strokeWidth="1" opacity="0.45"/>

    </svg>
  );
}
