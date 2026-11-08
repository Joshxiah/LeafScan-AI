/**
 * Uploads scans taken offline as soon as the phone can reach the
 * server again, and has the server classify them. Renders nothing;
 * mounted once inside the signed-in layout. Tries on start, whenever
 * the app returns to the foreground, and every 20 seconds while the
 * app is open (no-op when the queue is empty). Syncing only happens
 * while the app is open. Tells the farmer when queued photos have
 * been scanned.
 *
 * Whatever is still queued afterwards could not be uploaded (no
 * internet), so any of those photos that has no result yet is scanned
 * by the phone itself - the farmer never has to wait for a connection
 * to see a diagnosis.
 */

import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isDefinitelyOffline } from '../services/connectivity';
import {
  classifyWaitingScansOnDevice,
  getPendingScans,
  syncPendingScans,
} from '../services/pendingScans';

const RETRY_MS = 20000;

export function PendingScanSync() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    async function trySync() {
      if (userId === undefined) return;
      const queue = await getPendingScans(userId);
      if (queue.length > 0) {
        // No point trying to upload with no internet (on Wi-Fi without internet
        // each try hangs for a minute); go straight to scanning on the phone.
        if (!(await isDefinitelyOffline())) {
          const { uploaded, dropped } = await syncPendingScans(userId);
          if (dropped > 0) {
            Alert.alert(t.common.scansNotSyncedTitle, t.common.scansNotSynced(dropped));
          } else if (uploaded > 0) {
            // Tell the farmer their offline photos now have a result.
            Alert.alert(t.common.scansSyncedTitle, t.common.scansSynced(uploaded));
          }
        }

        // Still queued = could not be uploaded: give those photos a result on the phone.
        await classifyWaitingScansOnDevice(userId);
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
  }, [userId, t]);

  return null;
}
