/**
 * Shared notification + unread state for the whole admin shell.
 *
 * One place owns:
 *   - the CAO's notification inbox (bell in the top bar)
 *   - the count of unread reports (badge on the Reports nav item)
 *   - a single Server-Sent Events connection that refreshes both
 *     the instant a farmer files or the CAO acts on a report
 *
 * `eventSeq` bumps on every incoming event so a page (e.g. Reports)
 * can put it in an effect's dependency list and reload itself live.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import * as notificationService from '../services/notification.service';
import { listReports } from '../services/report.service';
import { useAuth } from './AuthContext';
import type { NotificationItem } from '../types';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  reportsUnreadCount: number;
  /** Increments once per incoming real-time event. */
  eventSeq: number;
  reload: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Optimistically drop one from the reports-unread badge when a report is opened. */
  noteReportOpened: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reportsUnreadCount, setReportsUnreadCount] = useState(0);
  const [eventSeq, setEventSeq] = useState(0);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [inbox, reports] = await Promise.all([
        notificationService.listNotifications(1, 20),
        listReports({ pageSize: 1 }),
      ]);
      if (!isMountedRef.current) return;
      setNotifications(inbox.notifications);
      setUnreadCount(inbox.unreadCount);
      setReportsUnreadCount(reports.unreadCount);
    } catch {
      /* a transient fetch failure just leaves the last known counts */
    }
  }, [isAuthenticated]);

  // Initial load + whenever auth flips on.
  useEffect(() => {
    if (isAuthenticated) void reload();
    else {
      setNotifications([]);
      setUnreadCount(0);
      setReportsUnreadCount(0);
    }
  }, [isAuthenticated, reload]);

  // Real-time stream.
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = notificationService.subscribeToNotifications(() => {
      setEventSeq((n) => n + 1);
      void reload();
    });
    return unsubscribe;
  }, [isAuthenticated, reload]);

  const markRead = useCallback(
    async (id: number) => {
      setNotifications((list) =>
        list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await notificationService.markRead(id);
      } finally {
        void reload();
      }
    },
    [reload]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } finally {
      void reload();
    }
  }, [reload]);

  const noteReportOpened = useCallback(() => {
    setReportsUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        reportsUnreadCount,
        eventSeq,
        reload,
        markRead,
        markAllRead,
        noteReportOpened,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used inside a NotificationsProvider');
  }
  return context;
}
