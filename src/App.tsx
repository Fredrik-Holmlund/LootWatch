import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppSettings } from './hooks/useAppSettings';
import { AuthForm } from './components/AuthForm';
import { Navigation, type NavTab } from './components/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { HistoryView } from './components/views/HistoryView';
import { WishlistView } from './components/views/WishlistView';
import { CouncilView } from './components/views/CouncilView';
import { AdminView } from './components/views/AdminView';
import { canEdit } from './types';

function App() {
  const { user, profile, role, loading, signIn, signUp, signOut } = useAuth();
  const { settings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<NavTab>('wishlist');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">⚔️</div>
          <p className="text-gray-600 text-sm">Loading LootWatch…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

  // Raiders can only access tabs that are enabled in app settings
  const raiderCanSee = (tab: NavTab) => {
    if (canEdit(role) || role === 'admin') return true;
    if (tab === 'dashboard') return settings.show_dashboard;
    if (tab === 'history') return settings.show_history;
    if (tab === 'wishlist') return true;
    return false;
  };

  const effectiveTab: NavTab =
    activeTab === 'admin' && role !== 'admin' ? 'wishlist'
    : activeTab === 'council' && !canEdit(role) ? 'wishlist'
    : !raiderCanSee(activeTab) ? 'wishlist'
    : activeTab;

  function handleTabChange(tab: NavTab) {
    if (tab === 'admin' && role !== 'admin') return;
    if (tab === 'council' && !canEdit(role)) return;
    if (!raiderCanSee(tab)) return;
    setActiveTab(tab);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation
        activeTab={effectiveTab}
        onTabChange={handleTabChange}
        role={role}
        settings={settings}
        username={profile?.username ?? user.email?.split('@')[0] ?? ''}
        onSignOut={signOut}
      />

      <main>
        {effectiveTab === 'dashboard' && <DashboardView />}
        {effectiveTab === 'history' && <HistoryView role={role} />}
        {effectiveTab === 'wishlist' && <WishlistView profile={profile} role={role} />}
        {effectiveTab === 'council' && canEdit(role) && <CouncilView />}
        {effectiveTab === 'admin' && role === 'admin' && <AdminView profile={profile} />}
      </main>
    </div>
  );
}

export default App;
