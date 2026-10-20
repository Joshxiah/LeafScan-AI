/**
 * Uploads scans taken offline as soon as the phone can reach the
 * server again. Renders nothing; mounted once inside the signed-in
 * layout. Tries on start, whenever the app returns to the foreground,
 * and every 20 seconds while the app is open (no-op when the queue
 * is empty).
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { getPendingScans, syncPendingScans } from '../services/pendingScans';

const RETRY_MS = 20000;

export function PendingScanSync() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    async function trySync() {
      if (userId === undefined) return;
      const queue = await getPendingScans(userId);
      if (queue.length > 0) {
        await syncPendingScans(userId);
      }
    }

    trySync();
    const timer = setInterval(trySync, RETRY_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') trySync();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [userId]);

  return null;
}
