interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <img
      src="/logo.png"
      className={className}
      alt="LootWatch"
      style={{ imageRendering: 'auto' }}
    />
  );
}
