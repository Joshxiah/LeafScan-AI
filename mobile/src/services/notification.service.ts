/**
 * Farmer notification inbox.
 *
 * The CAO reviewing or acting on a report writes a notification
 * here (see backend/src/services/report.service.ts), so the farmer
 * learns what happened without checking the report screen.
 */

import { api } from './api';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  reportId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface ListNotificationsResult {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export async function listNotifications(page = 1, pageSize = 30): Promise<ListNotificationsResult> {
  return api.get<ListNotificationsResult>(`/notifications?page=${page}&pageSize=${pageSize}`);
}

export async function getUnreadCount(): Promise<number> {
  const result = await api.get<{ unreadCount: number }>('/notifications/unread-count');
  return result.unreadCount;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch<void>(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post<void>('/notifications/read-all');
}
