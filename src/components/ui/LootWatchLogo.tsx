interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Low-poly eye ── */}

      {/* Upper lid — left facets */}
      <polygon points="10,50 35,50 22,32" fill="#e8b830"/>
      <polygon points="35,50 50,50 35,26" fill="#c49a18"/>
      <polygon points="22,32 35,50 35,26" fill="#d4a820"/>

      {/* Upper lid — right facets */}
      <polygon points="50,50 65,50 65,26" fill="#c49a18"/>
      <polygon points="65,50 90,50 78,32" fill="#a07e10"/>
      <polygon points="65,26 65,50 78,32" fill="#b08a14"/>

      {/* Top peak */}
      <polygon points="35,26 50,18 65,26 50,50" fill="#f0c840"/>

      {/* Lower lid — left facets */}
      <polygon points="10,50 35,50 22,66" fill="#b08a14"/>
      <polygon points="35,50 50,50 38,70" fill="#c49a18"/>
      <polygon points="22,66 35,50 38,70" fill="#9a7810"/>

      {/* Lower lid — right facets */}
      <polygon points="50,50 65,50 62,70" fill="#b08a14"/>
      <polygon points="65,50 90,50 78,66" fill="#8a6c0a"/>
      <polygon points="62,70 65,50 78,66" fill="#9a7810"/>

      {/* Bottom valley */}
      <polygon points="38,70 50,78 62,70 50,50" fill="#c8a020"/>

      {/* Iris — green low-poly */}
      <polygon points="50,50 38,44 42,56" fill="#28a74e"/>
      <polygon points="50,50 62,44 58,56" fill="#1d8a3c"/>
      <polygon points="50,50 38,44 50,38 62,44" fill="#44cf6c"/>
      <polygon points="50,50 38,56 50,62 62,56" fill="#28a74e"/>

      {/* Pupil */}
      <circle cx="50" cy="50" r="6" fill="#0a1208"/>
      <circle cx="48" cy="48" r="1.5" fill="#44cf6c" opacity="0.6}"/>

    </svg>
  );
}
