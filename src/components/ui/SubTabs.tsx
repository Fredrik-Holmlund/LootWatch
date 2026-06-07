interface Tab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface SubTabsProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function SubTabs<T extends string>({ tabs, active, onChange }: SubTabsProps<T>) {
  return (
    <div className="flex gap-0 border-b border-[var(--color-lw-border)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            active === tab.id
              ? 'border-[var(--color-lw-gold-400)] text-[var(--color-lw-gold-300)]'
              : 'border-transparent text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)]',
          ].join(' ')}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="ml-1.5 text-xs text-[var(--color-lw-text-muted)]">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
