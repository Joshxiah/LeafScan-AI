/**
 * In-app notifications for both sides of the reporting workflow.
 *
 *   - A farmer files a report        -> every active admin is notified
 *   - The CAO changes a report's status -> that report's farmer is notified
 *
 * Rows live in the `notifications` table (see
 * database/add_report_workflow.sql). Delivery is real-time: create()
 * also pushes the new row down any open SSE stream for the
 * recipient (src/utils/sse.ts).
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { publish } from '../utils/sse';

export type NotificationType = 'report_submitted' | 'report_status';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  reportId: number | null;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationRow extends RowDataPacket {
  id: number;
  type: string;
  title: string;
  body: string | null;
  report_id: number | null;
  is_read: number;
  created_at: Date;
}

function toItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    reportId: row.report_id,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  };
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  reportId?: number | null;
}

/**
 * Writes one notification per recipient and streams it to any that
 * are currently connected. Never throws into the caller's happy
 * path - a failed notification must not roll back a report.
 */
export async function createForUsers(
  userIds: number[],
  input: CreateNotificationInput
): Promise<void> {
  const unique = [...new Set(userIds)].filter((id) => Number.isInteger(id) && id > 0);
  if (unique.length === 0) return;

  try {
    const values = unique.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const params = unique.flatMap((userId) => [
      userId,
      input.type,
      input.title,
      input.body ?? null,
      input.reportId ?? null,
    ]);

    await pool.query<ResultSetHeader>(
      `INSERT INTO notifications (user_id, type, title, body, report_id)
       VALUES ${values}`,
      params
    );

    // Tell every connected recipient their unread count moved, and
    // hand them the fresh item so a toast can render without a refetch.
    publish(unique, 'notification', {
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      reportId: input.reportId ?? null,
    });
  } catch (error) {
    console.error('[notifications] failed to create:', error);
  }
}

/** All active admin user ids - the recipients when a report is filed. */
export async function getAdminUserIds(): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE role = 'admin' AND is_active = 1`
  );
  return rows.map((r) => Number(r.id));
}

export interface ListNotificationsResult {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export async function listForUser(
  userId: number,
  page: number,
  pageSize: number
): Promise<ListNotificationsResult> {
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.query<NotificationRow[]>(
    `SELECT id, type, title, body, report_id, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [userId, pageSize, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread
     FROM notifications WHERE user_id = ?`,
    [userId]
  );

  return {
    notifications: rows.map(toItem),
    total: Number(countRows[0].total ?? 0),
    unreadCount: Number(countRows[0].unread ?? 0),
    page,
    pageSize,
  };
}

export async function getUnreadCount(userId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return Number(rows[0].unread ?? 0);
}

export async function markRead(userId: number, id: number): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE notifications SET is_read = 1, read_at = NOW()
     WHERE id = ? AND user_id = ? AND is_read = 0`,
    [id, userId]
  );
  if (result.affectedRows === 0) {
    // Already read, or not this user's - either way nothing to do,
    // but a genuinely missing row is worth a 404.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM notifications WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    if (rows.length === 0) throw ApiError.notFound('Notification not found');
  }
}

export async function markAllRead(userId: number): Promise<void> {
  await pool.query(
    `UPDATE notifications SET is_read = 1, read_at = NOW()
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
}
