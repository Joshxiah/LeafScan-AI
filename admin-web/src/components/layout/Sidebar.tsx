/**
 * Sidebar navigation for the CAO admin platform.
 *
 * Every item routes to a real page. Log out lives at the top of the
 * footer, above the partner logos and the office name.
 */

import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import { PartnerLogos, CopyrightLine } from '../PartnerFooter';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
  { label: 'Reports', path: '/reports', icon: '📊' },
  { label: 'Users', path: '/farmers', icon: '👥' },
  { label: 'Agriculturists', path: '/agriculturists', icon: '🌾' },
  { label: 'Detections', path: '/detections', icon: '🔬' },
  { label: 'Diseases', path: '/diseases', icon: '🌿' },
  { label: 'Recommendations', path: '/recommendations', icon: '💊' },
];

export function Sidebar({ unreadReports }: { unreadReports?: number }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  // The Log out button only asks; the dialog's "Yes" is what signs out.
  const [askLogout, setAskLogout] = useState(false);

  // Escape closes the dialog, same as Cancel.
  useEffect(() => {
    if (!askLogout) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAskLogout(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [askLogout]);

  function handleLogout() {
    setAskLogout(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-leaf-800">
      {/* ---------- Brand ---------- */}
      <div className="flex items-center gap-4 border-b border-leaf-700 px-5 py-5">
        <img src={logo} alt="LeafScan AI" className="h-10 w-10 shrink-0 object-contain" />

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
        <button
          type="button"
          onClick={() => setAskLogout(true)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-leaf-100 transition-colors hover:bg-leaf-700"
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

        <PartnerLogos className="my-4 justify-center" />

        <p className="text-xs text-leaf-300">City Agriculture Office</p>
        <p className="text-xs text-leaf-400">Pagadian City</p>

        <CopyrightLine className="mt-3 text-center text-[10px] text-leaf-400" />
      </div>

      {askLogout && (
        <LogoutConfirm onConfirm={handleLogout} onCancel={() => setAskLogout(false)} />
      )}
    </aside>
  );
}

/**
 * "Are you sure?" pop-up for Log out. Looks like the confirm dialog on the
 * Users page (Cancel on the left, the red action on the right). Clicking
 * outside it cancels.
 */
function LogoutConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="logout-confirm-title" className="text-base font-semibold text-gray-900">
          Log out?
        </h3>
        <p className="mt-2 text-sm text-gray-600">Are you sure you want to log out?</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
