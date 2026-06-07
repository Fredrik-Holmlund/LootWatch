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
  }

  return (
    <div className="min-h-screen bg-[var(--color-lw-base)]">
      <Navigation
        activeTab={effectiveTab}
        onTabChange={handleTabChange}
        role={role}
        settings={settings}
        username={profile?.username ?? user.email?.split('@')[0] ?? ''}
        onSignOut={signOut}
      />

      <main key={effectiveTab} className="pt-14 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          {effectiveTab === 'dashboard'   && <DashboardView />}
          {effectiveTab === 'history'     && <HistoryView role={role} />}
          {effectiveTab === 'wishlist'    && <WishlistView profile={profile} role={role} />}
          {effectiveTab === 'assignments' && <AssignmentSheetView role={role} username={profile?.username ?? user.email?.split('@')[0] ?? ''} />}
          {effectiveTab === 'absence'     && <AbsenceView profile={profile} role={role} userId={user.id} />}
          {effectiveTab === 'council'     && canEdit(role) && <CouncilView />}
          {effectiveTab === 'admin'       && role === 'admin' && <AdminView profile={profile} />}
        </div>
      </main>
    </div>
  );
}

export default App;
