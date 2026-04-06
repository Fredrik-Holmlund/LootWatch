import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Navigation, type NavTab } from './components/Navigation';
import { HistoryView } from './components/views/HistoryView';
import { CouncilView } from './components/views/CouncilView';
import { AdminView } from './components/views/AdminView';

function App() {
  const { user, profile, role, loading, signIn, signUp, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('history');

  // Loading splash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">⚔️</div>
          <p className="text-gray-600 text-sm">Loading LootLedger…</p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

  // If profile hasn't loaded yet (rare edge case), show spinner
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-600 text-sm">Setting up your account…</p>
      </div>
    );
  }

  // Council-only tab guard: redirect raiders away from restricted tabs
  const effectiveTab: NavTab =
    activeTab !== 'history' && role !== 'council' ? 'history' : activeTab;

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
        username={profile.username}
        onSignOut={signOut}
      />

      <main>
        {effectiveTab === 'history' && <HistoryView role={role} />}
        {effectiveTab === 'council' && role === 'council' && <CouncilView />}
        {effectiveTab === 'admin' && role === 'council' && <AdminView />}
      </main>
    </div>
  );
}

export default App;
