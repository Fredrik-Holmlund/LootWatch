interface LootWatchLogoProps {
  className?: string;
}

export function LootWatchLogo({ className = 'w-8 h-8' }: LootWatchLogoProps) {
  return (
    <img
      src="/logo.png"
      width={256}
      height={256}
      className={className}
      style={{ objectFit: 'contain' }}
      alt="LootWatch"
    />
  );
}
