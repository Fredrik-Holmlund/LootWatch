import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
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
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

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

  const effectiveTab: NavTab =
    activeTab === 'admin' && role !== 'admin' ? 'dashboard'
    : activeTab === 'council' && !canEdit(role) ? 'dashboard'
    : activeTab;

  function handleTabChange(tab: NavTab) {
    if (tab === 'admin' && role !== 'admin') return;
    if (tab === 'council' && !canEdit(role)) return;
    setActiveTab(tab);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation
        activeTab={effectiveTab}
        onTabChange={handleTabChange}
        role={role}
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
