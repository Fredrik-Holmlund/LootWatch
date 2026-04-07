import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Navigation, type NavTab } from './components/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { HistoryView } from './components/views/HistoryView';
import { CouncilView } from './components/views/CouncilView';
import { AdminView } from './components/views/AdminView';

function App() {
  const { user, profile, role, loading, signIn, signUp, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Loading splash
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

  // Auth gate
  if (!user) {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

  // Council-only tab guard: redirect non-council away from restricted tabs
  const effectiveTab: NavTab =
    (activeTab === 'council' || activeTab === 'admin') && role !== 'council'
      ? 'dashboard'
      : activeTab;

  function handleTabChange(tab: NavTab) {
    if ((tab === 'council' || tab === 'admin') && role !== 'council') return;
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
        {effectiveTab === 'council' && role === 'council' && <CouncilView />}
        {effectiveTab === 'admin' && role === 'council' && <AdminView />}
      </main>
    </div>
  );
}

export default App;
