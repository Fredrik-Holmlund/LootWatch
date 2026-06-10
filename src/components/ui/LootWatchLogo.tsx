interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">

      {/* ── Low-poly crown ── */}

      {/* Left spike */}
      <polygon points="10,72 10,44 28,58" fill="#d4a820"/>
      <polygon points="10,44 24,24 28,58" fill="#f0c840"/>
      <polygon points="24,24 38,58 28,58" fill="#e8b830"/>

      {/* Center spike */}
      <polygon points="28,58 38,58 50,18" fill="#f0c840"/>
      <polygon points="38,58 62,58 50,18" fill="#e0b028"/>
      <polygon points="50,18 62,58 72,58" fill="#f0c840"/>

      {/* Right spike */}
      <polygon points="72,58 76,24 62,58" fill="#e8b830"/>
      <polygon points="76,24 90,44 72,58" fill="#f0c840"/>
      <polygon points="90,44 90,72 72,58" fill="#d4a820"/>

      {/* Base — left section */}
      <polygon points="10,72 28,58 38,58 30,72" fill="#c49a18"/>
      <polygon points="10,72 30,72 18,84" fill="#b08a14"/>

      {/* Base — center section */}
      <polygon points="30,72 38,58 62,58 70,72" fill="#e8b830"/>
      <polygon points="30,72 70,72 50,84" fill="#c8a020"/>

      {/* Base — right section */}
      <polygon points="70,72 72,58 90,72" fill="#c49a18"/>
      <polygon points="70,72 90,72 82,84" fill="#b08a14"/>

      {/* Bottom base strip */}
      <polygon points="18,84 50,84 30,72" fill="#a07e10"/>
      <polygon points="50,84 82,84 70,72" fill="#a07e10"/>

      {/* Gems on spike tips */}
      <circle cx="24" cy="24" r="4" fill="#44cf6c"/>
      <polygon points="24,20 28,24 24,28 20,24" fill="#28a74e"/>
      <circle cx="24" cy="24" r="2" fill="#44cf6c"/>

      <circle cx="50" cy="18" r="5" fill="#44cf6c"/>
      <polygon points="50,13 55,18 50,23 45,18" fill="#28a74e"/>
      <circle cx="50" cy="18" r="2.5" fill="#44cf6c"/>

      <circle cx="76" cy="24" r="4" fill="#44cf6c"/>
      <polygon points="76,20 80,24 76,28 72,24" fill="#28a74e"/>
      <circle cx="76" cy="24" r="2" fill="#44cf6c"/>

    </svg>
  );
}
