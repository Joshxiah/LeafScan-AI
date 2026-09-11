/**
 * Sidebar navigation for the CAO admin platform.
 *
 * Every item routes to a real page. Log out lives in the footer,
 * under the office name.
 */

import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { LeafMark } from '../LeafMark';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'Reports', path: '/reports', icon: '📊' },
  { label: 'Farmers', path: '/farmers', icon: '👥' },
  { label: 'Agriculturists', path: '/agriculturists', icon: '🌾' },
  { label: 'Detections', path: '/detections', icon: '🔬' },
  { label: 'Diseases', path: '/diseases', icon: '🌿' },
  { label: 'Recommendations', path: '/recommendations', icon: '💊' },
];

export function Sidebar({ unreadReports }: { unreadReports?: number }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-leaf-800">
      {/* ---------- Brand ---------- */}
      <div className="flex items-center gap-3 border-b border-leaf-700 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
          <LeafMark className="h-6 w-6 text-leaf-600" />
        </div>

        <div>
          <p className="text-base font-bold text-white">LeafScan AI</p>
          <p className="text-xs text-leaf-300">Admin Platform</p>
        </div>
      </div>

      {/* ---------- Navigation ---------- */}
      <nav className="flex-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? 'bg-leaf-600 text-white' : 'text-leaf-100 hover:bg-leaf-700'
              }`
            }
          >
            <span className="w-5 text-center text-sm">{item.icon}</span>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {item.path === '/reports' && !!unreadReports && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadReports}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ---------- Footer ---------- */}
      <div className="border-t border-leaf-700 px-5 py-4">
        <p className="text-xs text-leaf-300">City Agriculture Office</p>
        <p className="text-xs text-leaf-400">Pagadian City</p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-leaf-100 transition-colors hover:bg-leaf-700"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
