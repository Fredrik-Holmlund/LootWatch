import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppSettings } from './hooks/useAppSettings';
import { AuthForm } from './components/AuthForm';
import { SetPasswordForm } from './components/SetPasswordForm';
import { Navigation, type NavTab } from './components/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { HistoryView } from './components/views/HistoryView';
import { WishlistView } from './components/views/WishlistView';
import { AssignmentSheetView } from './components/assignments/AssignmentSheetView';
import { CouncilView } from './components/views/CouncilView';
import { AdminView } from './components/views/AdminView';
import { AbsenceView } from './components/views/AbsenceView';
import { CrossedSwordsLogo } from './components/ui/CrossedSwordsLogo';
import { canEdit, canEditAssignments } from './types';

function App() {
  const { user, profile, role, loading, signIn, signUp, signOut, isRecovery, updatePassword } = useAuth();
  const { settings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-lw-base)]">
        <div className="text-center space-y-4">
          <CrossedSwordsLogo className="w-10 h-10 mx-auto text-[var(--color-lw-purple-400)] animate-pulse" />
          <p className="text-[var(--color-lw-text-muted)] text-sm tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            Loading LootWatch…
          </p>
        </div>
      </div>
    );
  }

  if (isRecovery) return <SetPasswordForm onSetPassword={updatePassword} />;
  if (!user)      return <AuthForm onSignIn={signIn} onSignUp={signUp} />;

  const isPlanner = canEditAssignments(role);

  const raiderCanSee = (tab: NavTab) => {
    if (canEdit(role) || role === 'admin') return true;
    if (tab === 'assignments') return isPlanner || settings.show_assignments;
    if (tab === 'history')     return settings.show_history;
    if (tab === 'dashboard')   return true;
    if (tab === 'wishlist')    return true;
    if (tab === 'absence')     return true;
    return false;
  };

  const effectiveTab: NavTab =
    activeTab === 'admin'   && role !== 'admin'  ? 'dashboard'
    : activeTab === 'council' && !canEdit(role)  ? 'dashboard'
    : !raiderCanSee(activeTab)                   ? 'dashboard'
    : activeTab;

  function handleTabChange(tab: NavTab) {
    if (tab === 'admin'   && role !== 'admin') return;
    if (tab === 'council' && !canEdit(role))   return;
    if (!raiderCanSee(tab)) return;
    setActiveTab(tab);
  }

  return (
    <div className="min-h-screen bg-[var(--color-lw-base)] flex flex-col">
      <Navigation
        activeTab={effectiveTab}
        onTabChange={handleTabChange}
        role={role}
        settings={settings}
        username={profile?.username ?? user.email?.split('@')[0] ?? ''}
        onSignOut={signOut}
      />

      <main key={effectiveTab} className="animate-fade-in pb-10 px-5 pt-[calc(3.5rem+20px)] flex-1">
        <div className={[
          'mx-auto rounded-lg border border-white/[0.05] bg-[var(--color-lw-surface)]',
          'shadow-[0_2px_24px_rgba(0,0,0,0.6)]',
          effectiveTab === 'assignments' ? 'max-w-[1600px]' : 'max-w-7xl',
        ].join(' ')}>
          {effectiveTab === 'assignments' && <AssignmentSheetView role={role} username={profile?.username ?? user.email?.split('@')[0] ?? ''} />}
          {effectiveTab === 'dashboard'   && <DashboardView profile={profile} username={profile?.username ?? user.email?.split('@')[0] ?? ''} />}
          {effectiveTab === 'history'     && <HistoryView role={role} />}
          {effectiveTab === 'wishlist'    && <WishlistView profile={profile} role={role} />}
          {effectiveTab === 'absence'     && <AbsenceView profile={profile} role={role} userId={user.id} />}
          {effectiveTab === 'council'     && canEdit(role) && <CouncilView />}
          {effectiveTab === 'admin'       && role === 'admin' && <AdminView profile={profile} />}
        </div>
      </main>
      <footer className="mt-4 border-t border-white/[0.05] bg-[var(--color-lw-surface)]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CrossedSwordsLogo className="w-5 h-5 text-[var(--color-lw-fel-400)]" />
            <span className="text-sm font-semibold text-[var(--color-lw-text)]" style={{ fontFamily: 'var(--font-display)' }}>
              LootWatch
            </span>
          </div>
          <p className="text-xs text-[var(--color-lw-text-muted)] max-w-xl leading-relaxed">
            LootWatch is an independently developed guild tool for TBC Anniversary. With the ability to import data from
            RC Loot Council, Raid Helper and Warcraft Logs — LootWatch gives your guild management full visibility into
            loot history, attendance, priorities and raid assignments.
          </p>
          <p className="text-xs text-[var(--color-lw-text-muted)] shrink-0">
            &copy; 2026 <a href="https://lazsarus.com" className="hover:text-[var(--color-lw-fel-400)] transition-colors">Lazsarus.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
