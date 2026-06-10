interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Low-poly crown — clean straight silhouette ── */}

      {/*
        Silhouette points:
        Left base: (8,82)  Right base: (92,82)
        Left wall top: (8,58)   Right wall top: (92,58)
        Left spike tip: (26,22)
        Center spike tip: (50,14)
        Right spike tip: (74,22)
        Inner valleys: (38,52) and (62,52)
      */}

      {/* Left spike — left face */}
      <polygon points="8,58 26,22 38,52" fill="#f0c840"/>
      {/* Left spike — right face */}
      <polygon points="26,22 38,52 38,58" fill="#c8a020"/>

      {/* Center spike — left face */}
      <polygon points="38,52 38,58 50,14" fill="#e8b428"/>
      {/* Center spike — right face */}
      <polygon points="62,52 62,58 50,14" fill="#c49a18"/>

      {/* Right spike — left face */}
      <polygon points="62,52 62,58 74,22" fill="#e0aa20"/>
      {/* Right spike — right face */}
      <polygon points="74,22 62,58 92,58" fill="#b08010"/>

      {/* Left wall */}
      <polygon points="8,58 38,58 8,82" fill="#d4a020"/>
      <polygon points="38,58 30,82 8,82" fill="#b88c14"/>

      {/* Center base */}
      <polygon points="38,58 62,58 38,82" fill="#e8b428"/>
      <polygon points="62,58 62,82 38,82" fill="#c8a020"/>

      {/* Right wall */}
      <polygon points="62,58 92,58 92,82" fill="#c49a18"/>
      <polygon points="62,58 70,82 92,82" fill="#a07810"/>

      {/* Bottom base — unify floor */}
      <polygon points="8,82 30,82 38,82 62,82 70,82 92,82 92,86 8,86" fill="#8a6608"/>

      {/* Gem — left spike */}
      <polygon points="26,15 32,22 26,29 20,22" fill="#28a74e"/>
      <polygon points="26,15 32,22 26,22" fill="#44cf6c"/>

      {/* Gem — center spike */}
      <polygon points="50,7 57,14 50,21 43,14" fill="#28a74e"/>
      <polygon points="50,7 57,14 50,14" fill="#44cf6c"/>

      {/* Gem — right spike */}
      <polygon points="74,15 80,22 74,29 68,22" fill="#28a74e"/>
      <polygon points="74,15 80,22 74,22" fill="#44cf6c"/>

    </svg>
  );
}
