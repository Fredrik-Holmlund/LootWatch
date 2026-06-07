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
  const [activeTab, setActiveTab] = useState<NavTab>('wishlist');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-lw-base)]">
        <div className="text-center space-y-4">
          <CrossedSwordsLogo className="w-10 h-10 mx-auto text-[var(--color-lw-gold-400)] animate-pulse" />
          <p className="text-[var(--color-lw-text-muted)] text-sm tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            Loading LootWatch…
          </p>
        </div>
      </div>
    );
  }

  if (isRecovery) return <SetPasswordForm onSetPassword={updatePassword} />;
  if (!user)      return <AuthForm onSignIn={signIn} onSignUp={signUp} />;

  const raiderCanSee = (tab: NavTab) => {
    if (canEdit(role) || role === 'admin') return true;
    if (tab === 'assignments') return canEditAssignments(role) || settings.show_assignments;
    if (tab === 'dashboard')   return settings.show_dashboard;
    if (tab === 'history')     return settings.show_history;
    if (tab === 'wishlist')    return true;
    if (tab === 'absence')     return true;
    return false;
  };

  const effectiveTab: NavTab =
    activeTab === 'admin'   && role !== 'admin'  ? 'wishlist'
    : activeTab === 'council' && !canEdit(role)  ? 'wishlist'
    : !raiderCanSee(activeTab)                   ? 'wishlist'
    : activeTab;

  function handleTabChange(tab: NavTab) {
    if (tab === 'admin'   && role !== 'admin') return;
    if (tab === 'council' && !canEdit(role))   return;
    if (!raiderCanSee(tab)) return;
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-lw-base)]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Navigation
        activeTab={effectiveTab}
        onTabChange={handleTabChange}
        role={role}
        settings={settings}
        username={profile?.username ?? user.email?.split('@')[0] ?? ''}
        onSignOut={signOut}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-56">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-[var(--color-lw-border)] bg-[var(--color-lw-surface)]/90 backdrop-blur lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[var(--color-lw-text-sub)] hover:text-[var(--color-lw-text)] hover:bg-[var(--color-lw-elevated)] transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <CrossedSwordsLogo className="w-5 h-5 text-[var(--color-lw-gold-400)]" />
          <span
            className="text-sm font-semibold text-[var(--color-lw-gold-300)] tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            LootWatch
          </span>
        </header>

        <main key={effectiveTab} className="flex-1 animate-fade-in">
          {effectiveTab === 'dashboard'   && <DashboardView />}
          {effectiveTab === 'history'     && <HistoryView role={role} />}
          {effectiveTab === 'wishlist'    && <WishlistView profile={profile} role={role} />}
          {effectiveTab === 'assignments' && <AssignmentSheetView role={role} username={profile?.username ?? user.email?.split('@')[0] ?? ''} />}
          {effectiveTab === 'absence'     && <AbsenceView profile={profile} role={role} userId={user.id} />}
          {effectiveTab === 'council'     && canEdit(role) && <CouncilView />}
          {effectiveTab === 'admin'       && role === 'admin' && <AdminView profile={profile} />}
        </main>
      </div>
    </div>
  );
}

export default App;
