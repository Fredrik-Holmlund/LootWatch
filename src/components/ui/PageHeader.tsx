import { useState, type ReactNode } from 'react';
import { HelpModal } from './HelpModal';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  helpContent?: string;
}

export function PageHeader({ title, subtitle, actions, helpContent }: PageHeaderProps) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-lw-text)] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[var(--color-lw-text-muted)] mt-1">{subtitle}</p>
            )}
          </div>
          {helpContent && (
            <button
              onClick={() => setShowHelp(true)}
              title="Help"
              className="w-5 h-5 rounded-full bg-[var(--color-lw-elevated)] border border-[var(--color-lw-border)] hover:border-[var(--color-lw-fel-400)]/50 hover:text-[var(--color-lw-fel-400)] text-[var(--color-lw-text-muted)] text-xs font-bold flex items-center justify-center transition-colors shrink-0 mt-0.5"
            >
              ?
            </button>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {showHelp && helpContent && (
        <HelpModal title={title} content={helpContent} onClose={() => setShowHelp(false)} />
      )}
    </>
  );
}
