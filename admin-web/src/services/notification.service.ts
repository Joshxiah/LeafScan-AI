/**
 * Notification calls + real-time stream for the CAO dashboard.
 */

import { api } from './api';
import { streamUrl } from './media';
import type { ListNotificationsResult } from '../types';

/** GET /api/notifications?page=1&pageSize=20 */
export async function listNotifications(page = 1, pageSize = 20): Promise<ListNotificationsResult> {
  return api.get<ListNotificationsResult>(`/notifications?page=${page}&pageSize=${pageSize}`);
}

/** GET /api/notifications/unread-count */
export async function getUnreadCount(): Promise<number> {
  const result = await api.get<{ unreadCount: number }>('/notifications/unread-count');
  return result.unreadCount;
}

/** PATCH /api/notifications/:id/read */
export async function markRead(id: number): Promise<void> {
  await api.patch<void>(`/notifications/${id}/read`);
}

/** POST /api/notifications/read-all */
export async function markAllRead(): Promise<void> {
  await api.post<void>('/notifications/read-all');
}

/**
 * Opens the Server-Sent Events stream. `onEvent` fires for every
 * `notification` event the backend pushes for this user. Returns a
 * function that closes the connection.
 */
export function subscribeToNotifications(onEvent: () => void): () => void {
  let source: EventSource | null = null;
  let closed = false;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    source = new EventSource(streamUrl('/notifications/stream'));

    source.addEventListener('notification', () => onEvent());

    source.onerror = () => {
      // EventSource retries on its own, but a dropped token or a
      // restarted backend can wedge it; force a clean reconnect.
      source?.close();
      if (closed) return;
      if (retry) clearTimeout(retry);
      retry = setTimeout(connect, 4000);
    };
  };

  connect();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    source?.close();
  };
}
