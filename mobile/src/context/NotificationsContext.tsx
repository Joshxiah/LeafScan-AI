/**
 * Farmer-side notification state.
 *
 * Holds the unread count and the recent list, refreshed when a
 * screen gains focus and on a slow poll while the app is open.
 * (React Native has no built-in EventSource; a 30s poll plus a
 * focus refresh keeps this current without a new dependency.)
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
import { AppState } from 'react-native';

import { useAuth } from './AuthContext';
import * as notificationService from '../services/notification.service';
import type { NotificationItem } from '../services/notification.service';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  loadFailed: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const POLL_MS = 30_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  // The offline demo session has no real JWT - the API would 401.
  const canSync = !!user && !!token && token !== 'demo-session-token';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!canSync) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoading(true);
    try {
      const result = await notificationService.listNotifications(1, 30);
      if (!mountedRef.current) return;
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setLoadFailed(false);
    } catch {
      if (mountedRef.current) setLoadFailed(true);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [canSync]);

  // Initial + on login.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Slow poll while the app is in the foreground.
  useEffect(() => {
    if (!canSync) return;
    const id = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [canSync, refresh]);

  const markRead = useCallback(
    async (id: number) => {
      setNotifications((list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await notificationService.markNotificationRead(id);
      } catch {
        /* the optimistic update stands; next refresh reconciles */
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllNotificationsRead();
    } catch {
      /* next refresh reconciles */
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, isLoading, loadFailed, refresh, markRead, markAllRead }}
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
