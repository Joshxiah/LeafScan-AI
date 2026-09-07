/**
 * Top bar showing the page title and the signed-in administrator.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../NotificationBell';

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

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

        <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-100"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-600 text-sm font-semibold text-white">
            {initials ?? '?'}
          </div>

          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {user?.fullName ?? '-'}
            </p>
            <p className="text-xs text-gray-500">CAO Administrator</p>
          </div>

          <span className="text-xs text-gray-400">▾</span>
        </button>

        {isMenuOpen && (
          <>
            {/* Invisible full-screen layer: clicking anywhere
                outside the menu closes it. */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />

            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {user?.email ?? (user?.username ? `@${user.username}` : '')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Log Out
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  );
}
