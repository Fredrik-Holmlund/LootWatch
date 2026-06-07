import { useState } from 'react';
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
  sidebarOpen?: boolean;
  onCloseSidebar?: () => void;
}

const roleColor: Record<string, string> = {
  admin:   'text-red-400',
  council: 'text-[var(--color-lw-gold-300)]',
  planner: 'text-[var(--color-lw-purple-400)]',
  raider:  'text-[var(--color-lw-text-sub)]',
};

export function Navigation({ activeTab, onTabChange, role, settings, username, onSignOut, onCloseSidebar }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
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

  function handleTabChange(tab: NavTab) {
    onTabChange(tab);
    setMobileOpen(false);
    onCloseSidebar?.();
  }

  const roleKey = role ?? 'raider';

  return (
    <>
      {/* Top navigation bar */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <CrossedSwordsLogo className="w-5 h-5 text-[var(--color-lw-purple-400)]" />
            <span
              className="text-sm font-semibold tracking-wide text-[var(--color-lw-text)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              LootWatch
            </span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={[
                    'relative px-3 py-2 text-sm font-medium transition-colors rounded-md',
                    active
                      ? 'text-[var(--color-lw-text)]'
                      : 'text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:bg-[var(--color-lw-elevated)]/60',
                  ].join(' ')}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-[var(--color-lw-purple-400)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: user info + sign out */}
          <div className="hidden lg:flex items-center gap-3 ml-auto shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--color-lw-border)] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[var(--color-lw-text-sub)] uppercase">
                  {(username ?? '?')[0]}
                </span>
              </div>
              <div className="leading-none">
                <p className="text-xs font-medium text-[var(--color-lw-text)]">{username}</p>
                <p className={`text-[10px] capitalize font-semibold ${roleColor[roleKey]}`}>{role}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-lw-border)] text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)] hover:border-[var(--color-lw-border)] transition-colors"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden ml-auto p-2 rounded-md text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:bg-[var(--color-lw-elevated)] transition-colors"
            aria-label="Open menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-14 inset-x-0 z-40 bg-[var(--color-lw-surface)] border-b border-[var(--color-lw-border)] lg:hidden">
            <nav className="max-w-7xl mx-auto px-4 py-2 space-y-0.5">
              {visibleTabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={[
                      'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                      active
                        ? 'bg-[var(--color-lw-purple-500)]/15 text-[var(--color-lw-purple-400)]'
                        : 'text-[var(--color-lw-text-sub)] hover:bg-[var(--color-lw-elevated)] hover:text-[var(--color-lw-text)]',
                    ].join(' ')}
                  >
                    {active && <span className="w-1 h-4 rounded-full bg-[var(--color-lw-purple-400)]" />}
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="max-w-7xl mx-auto px-4 py-3 border-t border-[var(--color-lw-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--color-lw-border)] flex items-center justify-center">
                  <span className="text-xs font-bold text-[var(--color-lw-text-sub)] uppercase">{(username ?? '?')[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-lw-text)]">{username}</p>
                  <p className={`text-xs capitalize font-semibold ${roleColor[roleKey]}`}>{role}</p>
                </div>
              </div>
              <button onClick={onSignOut} className="text-xs text-[var(--color-lw-text-muted)] hover:text-[var(--color-lw-text)] transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
