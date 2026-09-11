/**
 * Top bar: the page title, notifications, and a profile button that
 * opens the CAO's profile page. Log out lives in the sidebar footer.
 */

import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../NotificationBell';

export function Topbar({ title }: { title: string }) {
  const { user } = useAuth();

  const initials = user?.fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-100"
          title="View your profile"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-600 text-sm font-semibold text-white">
            {initials ?? '?'}
          </div>

          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{user?.fullName ?? '-'}</p>
            <p className="text-xs text-gray-500">CAO Administrator</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
