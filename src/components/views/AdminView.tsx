import { UserManagement } from '../admin/UserManagement';

export function AdminView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Admin</h2>
          <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
            Council Only
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Manage guild member roles and permissions</p>
      </div>

      {/* Info box */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-sm font-medium text-yellow-400 mb-1">⚔️ Council</p>
            <ul className="text-xs text-gray-500 space-y-0.5">
              <li>• Import CSV loot history</li>
              <li>• Award and delete entries</li>
              <li>• Edit notes on loot records</li>
              <li>• Manage priority notes</li>
              <li>• Promote / demote members</li>
            </ul>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-300 mb-1">🛡️ Raider</p>
            <ul className="text-xs text-gray-500 space-y-0.5">
              <li>• View loot history</li>
              <li>• View player summaries</li>
              <li>• Read-only access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User management table */}
      <UserManagement />
    </div>
  );
}
