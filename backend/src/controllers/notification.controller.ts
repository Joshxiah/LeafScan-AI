/**
 * HTTP handlers for a user's in-app notification inbox.
 *
 * Every route here is "own data only": the recipient id is taken
 * from the verified token, never from the request, so one user can
 * never read or clear another's notifications.
 */

import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { ApiError } from '../utils/ApiError';
import { subscribe } from '../utils/sse';

/** GET /api/notifications?page=1&pageSize=20 */
export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized('Authentication required');

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

  const result = await notificationService.listForUser(req.user.userId, page, pageSize);
  res.status(200).json({ success: true, data: result });
}

/** GET /api/notifications/unread-count */
export async function unreadCount(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized('Authentication required');
  const count = await notificationService.getUnreadCount(req.user.userId);
  res.status(200).json({ success: true, data: { unreadCount: count } });
}

/** PATCH /api/notifications/:id/read */
export async function markRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized('Authentication required');

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest('Invalid notification id');

  await notificationService.markRead(req.user.userId, id);
  res.status(200).json({ success: true, message: 'Notification marked as read' });
}

/** POST /api/notifications/read-all */
export async function markAllRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized('Authentication required');
  await notificationService.markAllRead(req.user.userId);
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
}

/**
 * GET /api/notifications/stream?token=...
 * Holds the connection open and pushes a `notification` event
 * whenever one is created for this user.
 */
export function stream(req: Request, res: Response): void {
  if (!req.user) throw ApiError.unauthorized('Authentication required');
  subscribe(req.user.userId, res);
  // No res.end() - subscribe() keeps it open until the client leaves.
}
