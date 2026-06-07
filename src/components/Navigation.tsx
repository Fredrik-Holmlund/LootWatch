import { canEdit, canEditAssignments } from '../types';
import type { UserRole } from '../types';
import type { AppSettings } from '../hooks/useAppSettings';
import { CrossedSwordsLogo } from './ui/CrossedSwordsLogo';

export type NavTab = 'dashboard' | 'history' | 'wishlist' | 'assignments' | 'council' | 'admin' | 'absence';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole | null;
  settings: AppSettings;
  username: string | null;
  onSignOut: () => void;
}

const roleColor: Record<string, string> = {
  admin:   'text-red-400',
  council: 'text-[var(--color-lw-gold-300)]',
  planner: 'text-blue-400',
  raider:  'text-[var(--color-lw-text-sub)]',
};

const roleBg: Record<string, string> = {
  admin:   'bg-red-950/60 border-red-900/40',
  council: 'bg-yellow-950/40 border-yellow-900/30',
  planner: 'bg-blue-950/50 border-blue-900/30',
  raider:  'bg-[var(--color-lw-elevated)] border-[var(--color-lw-border)]',
};

function NavIcon({ id }: { id: NavTab }) {
  const cls = 'w-4 h-4 shrink-0';
  switch (id) {
    case 'dashboard':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'history':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4l2.5 2.5" />
          <path d="M3.05 11a9 9 0 1 0 .5-3M3 4v4h4" />
        </svg>
      );
    case 'wishlist':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'absence':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M9 15h.01M12 15h.01M15 15h.01" />
        </svg>
      );
    case 'assignments':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case 'council':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
        </svg>
      );
    case 'admin':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
      );
  }
}

export function Navigation({ activeTab, onTabChange, role, settings, username, onSignOut }: NavigationProps) {
  const isPrivileged = canEdit(role) || role === 'admin';
  const isPlanner = canEditAssignments(role);

  const tabs: { id: NavTab; label: string; requireCouncil?: boolean; requireAdmin?: boolean }[] = [
    { id: 'dashboard',   label: 'Dashboard' },
    { id: 'history',     label: 'History' },
    { id: 'wishlist',    label: 'Wishlist' },
    { id: 'absence',     label: 'Absence' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'council',     label: 'Council',  requireCouncil: true },
    { id: 'admin',       label: 'Admin',    requireAdmin: true },
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (tab.requireAdmin && role !== 'admin') return false;
    if (tab.requireCouncil && !canEdit(role)) return false;
    if (!isPrivileged && tab.id === 'dashboard' && !settings.show_dashboard) return false;
    if (!isPrivileged && tab.id === 'history' && !settings.show_history) return false;
    if (!isPrivileged && !isPlanner && tab.id === 'assignments' && !settings.show_assignments) return false;
    return true;
  });

  const roleKey = role ?? 'raider';

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-56 border-r border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--color-lw-border-sub)]">
        <CrossedSwordsLogo className="w-6 h-6 shrink-0 text-[var(--color-lw-gold-400)]" />
        <span
          className="text-base font-semibold tracking-wide text-[var(--color-lw-gold-300)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          LootWatch
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visibleTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--color-lw-purple-500)]/15 text-white'
                  : 'text-[var(--color-lw-text-sub)] hover:bg-[var(--color-lw-elevated)] hover:text-[var(--color-lw-text)]',
              ].join(' ')}
            >
              {active && (
                <span className="absolute left-0 inset-y-1.5 w-0.5 rounded-full bg-[var(--color-lw-purple-400)]" />
              )}
              <span className={active ? 'text-[var(--color-lw-purple-400)]' : 'text-[var(--color-lw-text-muted)] group-hover:text-[var(--color-lw-text-sub)]'}>
                <NavIcon id={tab.id} />
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[var(--color-lw-border-sub)] space-y-2">
        <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${roleBg[roleKey] ?? roleBg.raider}`}>
          <div className="w-7 h-7 rounded-full bg-[var(--color-lw-border)] flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-[var(--color-lw-text-sub)] uppercase">
              {(username ?? '?')[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--color-lw-text)] truncate leading-tight">{username}</p>
            <p className={`text-xs capitalize font-semibold leading-tight ${roleColor[roleKey] ?? roleColor.raider}`}>{role}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text-sub)] hover:bg-[var(--color-lw-elevated)] transition-colors"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
