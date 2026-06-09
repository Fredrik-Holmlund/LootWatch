interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeading({ children, className = '' }: SectionHeadingProps) {
  return (
    <h3
      className={[
        "text-xs font-bold text-[var(--color-lw-text-muted)] uppercase tracking-widest",
        "flex items-center gap-3",
        "before:content-[''] before:flex-1 before:h-px before:bg-[var(--color-lw-border)]",
        "after:content-[''] after:flex-1 after:h-px after:bg-[var(--color-lw-border)]",
        className,
      ].join(' ')}
    >
      {children}
    </h3>
  );
}
