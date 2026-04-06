import type { UserRole } from '../types';

export type NavTab = 'history' | 'council' | 'admin';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: UserRole | null;
  username: string | null;
  onSignOut: () => void;
}

export function Navigation({ activeTab, onTabChange, role, username, onSignOut }: NavigationProps) {
  const isCouncil = role === 'council';

  const tabs: { id: NavTab; label: string; councilOnly?: boolean }[] = [
    { id: 'history', label: 'History' },
    { id: 'council', label: 'Council', councilOnly: true },
    { id: 'admin', label: 'Admin', councilOnly: true },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl">⚔️</span>
            <span className="font-bold text-yellow-400 tracking-tight">LootLedger</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 flex-1">
            {tabs.map((tab) => {
              if (tab.councilOnly && !isCouncil) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-300">{username}</p>
              <p className="text-xs text-gray-600 capitalize">{role}</p>
            </div>
            <button
              onClick={onSignOut}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 border border-gray-800 rounded-md hover:border-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
