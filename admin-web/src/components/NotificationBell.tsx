/**
 * Notification bell for the top bar.
 *
 * Shows the CAO's unread count and, on click, a dropdown of recent
 * notifications - styled to match the farmer app's own notification
 * screen (a leaf-badge card per item, unread ones filled in and
 * highlighted). Clicking one marks it read and jumps to the report
 * it refers to. Updates live via NotificationsContext's shared SSE
 * connection.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotifications } from '../context/NotificationsContext';
import { BellMark } from './BellMark';
import { LeafMark } from './LeafMark';

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
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  function handleOpenNotification(id: number, isRead: boolean, reportId: number | null) {
    if (!isRead) void markRead(id);
    setIsOpen(false);
    if (reportId) navigate(`/reports?open=${reportId}`);
  }

  async function handleConfirmClear() {
    setIsClearing(true);
    try {
      await clearAll();
    } finally {
      setIsClearing(false);
      setConfirmClear(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-leaf-600 shadow-sm hover:bg-leaf-50"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <BellMark className="h-[18px] w-[18px]" />
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
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="text-xs font-medium text-leaf-700 hover:text-leaf-800"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    title="Clear all notifications"
                    aria-label="Clear all notifications"
                    className="text-gray-400 hover:text-red-600"
                  >
                    <TrashMark className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto bg-gray-50/60 p-2.5">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-400">
                  No notifications yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleOpenNotification(n.id, n.isRead, n.reportId)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                        n.isRead
                          ? 'border-gray-100 bg-white hover:bg-gray-50'
                          : 'border-leaf-200 bg-leaf-50 hover:bg-leaf-100/70'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          n.isRead ? 'bg-leaf-50 text-leaf-600' : 'bg-leaf-600 text-white'
                        }`}
                      >
                        <LeafMark className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span
                            className={`flex-1 truncate text-sm ${
                              n.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                            }`}
                          >
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                          )}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block text-xs leading-4 text-gray-500">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-gray-400">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {confirmClear && (
        <ConfirmClearDialog
          isClearing={isClearing}
          onConfirm={() => void handleConfirmClear()}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

function ConfirmClearDialog({
  isClearing,
  onConfirm,
  onCancel,
}: {
  isClearing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900">Clear all notifications?</h3>
        <p className="mt-2 text-sm text-gray-600">
          This removes every notification in your inbox. There is no undo.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={isClearing}
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isClearing}
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isClearing ? 'Clearing…' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Plain-line trash icon, kept local since it is only ever used here. */
function TrashMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
