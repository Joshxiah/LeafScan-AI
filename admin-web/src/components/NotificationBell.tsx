/**
 * Notification bell for the top bar.
 *
 * Shows the CAO's unread count and, on click, a dropdown of recent
 * notifications. Clicking one marks it read and jumps to the
 * report it refers to. Updates live via NotificationsContext's
 * shared SSE connection.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotifications } from '../context/NotificationsContext';

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  function handleOpenNotification(id: number, isRead: boolean, reportId: number | null) {
    if (!isRead) void markRead(id);
    setIsOpen(false);
    if (reportId) navigate(`/reports?open=${reportId}`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <span className="text-lg leading-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-medium text-leaf-700 hover:text-leaf-800"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-400">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleOpenNotification(n.id, n.isRead, n.reportId)}
                    className={`flex w-full flex-col gap-0.5 border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50 ${
                      n.isRead ? '' : 'bg-leaf-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-leaf-600" />
                      )}
                      <p
                        className={`flex-1 text-sm ${
                          n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="pl-4 text-xs leading-4 text-gray-500">{n.body}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
