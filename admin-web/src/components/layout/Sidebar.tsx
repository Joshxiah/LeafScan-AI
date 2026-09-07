/**
 * Sidebar navigation for the CAO admin platform.
 *
 * Links to pages built in later phases are marked "Soon" and are
 * not clickable, so nothing in the interface leads to a broken
 * page.
 */

import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  phase?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'Reports', path: '/reports', icon: '📊' },
  { label: 'Farmers', path: '/farmers', icon: '👥' },
  { label: 'Detections', path: '/detections', icon: '🔬', phase: 16 },
  { label: 'Diseases', path: '/diseases', icon: '🌿', phase: 21 },
  { label: 'Recommendations', path: '/recommendations', icon: '💊', phase: 22 },
];

export function Sidebar({ pendingReports }: { pendingReports?: number }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-leaf-800">
      {/* ---------- Brand ---------- */}
      <div className="flex items-center gap-3 border-b border-leaf-700 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl">
          🌽
        </div>

        <div>
          <p className="text-base font-bold text-white">LeafScan AI</p>
          <p className="text-xs text-leaf-300">Admin Platform</p>
        </div>
      </div>

      {/* ---------- Navigation ---------- */}
      <nav className="flex-1 px-3 py-4">
        {NAV_ITEMS.map((item) =>
          item.phase ? (
            <div
              key={item.path}
              className="mb-1 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 opacity-40"
            >
              <span className="w-5 text-center text-sm">{item.icon}</span>
              <span className="flex-1 text-sm text-leaf-100">{item.label}</span>
              <span className="rounded bg-leaf-700 px-1.5 py-0.5 text-[10px] text-leaf-200">
                Soon
              </span>
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-leaf-600 text-white'
                    : 'text-leaf-100 hover:bg-leaf-700'
                }`
              }
            >
              <span className="w-5 text-center text-sm">{item.icon}</span>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.path === '/reports' && !!pendingReports && (
                <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-leaf-900">
                  {pendingReports}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>

      {/* ---------- Footer ---------- */}
      <div className="border-t border-leaf-700 px-5 py-4">
        <p className="text-xs text-leaf-300">City Agriculture Office</p>
        <p className="text-xs text-leaf-400">Pagadian City</p>
      </div>
    </aside>
  );
}
