/**
 * Scans taken while offline, waiting to be uploaded.
 *
 * The (stand-in) diagnosis is made on the phone, so a farmer with no
 * signal can still scan a leaf and read the result. The photo is
 * copied somewhere permanent and the scan is queued here;
 * syncPendingScans() uploads the photo and records the detection on
 * the server the next time the phone can reach it. Queues are scoped
 * per userId for the same reason scanLog.ts is.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File as LocalFile, Paths } from 'expo-file-system';

import { ApiError } from './api';
import { uploadLeafImage } from './upload.service';
import { recordDetection } from './detection.service';
import { ScanClassLabel } from '../data/scanStats';

const KEY_PREFIX = 'leafscan_pending_scans';
const MAX_PENDING = 100;

export interface PendingScan {
  id: string;
  /** Permanent on-device copy of the photo. */
  localUri: string;
  classLabel: ScanClassLabel;
  confidence: number;
  scannedAt: string;
  /** Set when the photo already reached the server and only the detection record is missing. */
  imagePath?: string;
}

const listeners = new Set<() => void>();

/** Calls back whenever queued scans have just been uploaded, so lists can reload. */
export function onPendingSynced(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const keyFor = (userId: number) => `${KEY_PREFIX}_${userId}`;

export async function getPendingScans(userId: number): Promise<PendingScan[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as PendingScan[]) : [];
  } catch (error) {
    console.error('[pendingScans] Failed to read the queue:', error);
    return [];
  }
}

async function savePending(userId: number, scans: PendingScan[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(scans));
}

/** The camera/picker cache can be cleared by the OS, so keep our own copy. */
function persistPhoto(uri: string, id: string): string {
  if (Platform.OS === 'web') return uri;

  try {
    const dir = new Directory(Paths.document, 'pending-scans');
    dir.create({ idempotent: true });
    const extension = /\.(png|webp)$/i.exec(uri)?.[0] ?? '.jpg';
    const target = new LocalFile(dir, `${id}${extension}`);
    new LocalFile(uri).copy(target);
    return target.uri;
  } catch (error) {
    console.warn('[pendingScans] Could not copy the photo, using the original:', error);
    return uri;
  }
}

/** Queues one scan for upload and returns it. */
export async function queuePendingScan(
  userId: number,
  scan: { imageUri: string; classLabel: ScanClassLabel; confidence: number; imagePath?: string }
): Promise<PendingScan> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: PendingScan = {
    id,
    localUri: persistPhoto(scan.imageUri, id),
    classLabel: scan.classLabel,
    confidence: scan.confidence,
    scannedAt: new Date().toISOString(),
    imagePath: scan.imagePath,
  };

  const existing = await getPendingScans(userId);
  await savePending(userId, [entry, ...existing].slice(0, MAX_PENDING));
  return entry;
}

let isSyncing = false;

/**
 * Uploads every queued scan, oldest first. Stops at the first
 * failure (almost always "still offline") and leaves the rest queued.
 * Returns how many were uploaded.
 */
export async function syncPendingScans(userId: number): Promise<number> {
  if (isSyncing) return 0;
  isSyncing = true;

  let uploaded = 0;
  try {
    const queue = [...(await getPendingScans(userId))].reverse();

    for (const scan of queue) {
      try {
        const imagePath = scan.imagePath ?? (await uploadLeafImage(scan.localUri)).imagePath;
        await recordDetection({
          imagePath,
          predictedClass: scan.classLabel,
          confidenceScore: scan.confidence,
          detectedAt: scan.scannedAt,
        });
      } catch (error) {
        console.log('[pendingScans] Upload deferred:', error);
        // A file that no longer exists will never upload - drop it
        // rather than blocking the whole queue forever.
        if (!(error instanceof ApiError) && !photoExists(scan.localUri)) {
          await removePending(userId, scan.id);
          continue;
        }
        break;
      }

      await removePending(userId, scan.id);
      deletePhoto(scan.localUri);
      uploaded += 1;
    }
  } finally {
    isSyncing = false;
  }
  if (uploaded > 0) listeners.forEach((callback) => callback());
  return uploaded;
}

async function removePending(userId: number, id: string): Promise<void> {
  // Re-read so a scan queued during the upload is not lost.
  const current = await getPendingScans(userId);
  await savePending(userId, current.filter((scan) => scan.id !== id));
}

function photoExists(uri: string): boolean {
  if (Platform.OS === 'web') return true;
  try {
    return new LocalFile(uri).exists;
  } catch {
    return true;
  }
}

function deletePhoto(uri: string): void {
  if (Platform.OS === 'web' || !uri.includes('pending-scans')) return;
  try {
    new LocalFile(uri).delete();
  } catch {
    // Leftover file is harmless.
  }
}
