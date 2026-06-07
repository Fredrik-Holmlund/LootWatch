import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'active' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const variantClass: Record<string, string> = {
  default: 'border border-[var(--color-lw-border)] text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:border-[var(--color-lw-fel-500)]/40 hover:bg-[var(--color-lw-elevated)]',
  active:  'border border-[var(--color-lw-fel-500)]/50 text-[var(--color-lw-fel-400)] bg-[var(--color-lw-fel-500)]/10',
  ghost:   'text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] hover:bg-[var(--color-lw-elevated)]',
  danger:  'border border-red-900/40 text-red-400 hover:bg-red-950/40',
};

const sizeClass: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({ variant = 'default', size = 'sm', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={[
        'font-medium rounded-lg transition-colors',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
