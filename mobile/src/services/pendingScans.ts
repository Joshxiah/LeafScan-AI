/**
 * Scans taken while offline, waiting to be uploaded.
 *
 * Only scans queued by older app versions can be here: the app no
 * longer queues new ones, because classifying now needs the server.
 * Their stored verdict was a stand-in guess, so syncPendingScans()
 * uploads the photo and has the server classify it the next time the
 * phone can reach it. Queues are scoped
 * per userId for the same reason scanLog.ts is.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File as LocalFile, Paths } from 'expo-file-system';

import { ApiError } from './api';
import { uploadLeafImage } from './upload.service';
import { scanLeaf } from './detection.service';
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
 * Returns how many were uploaded and how many had to be dropped.
 */
export async function syncPendingScans(
  userId: number
): Promise<{ uploaded: number; dropped: number }> {
  if (isSyncing) return { uploaded: 0, dropped: 0 };
  isSyncing = true;

  let uploaded = 0;
  let dropped = 0;
  try {
    const queue = [...(await getPendingScans(userId))].reverse();

    for (const scan of queue) {
      try {
        const imagePath = scan.imagePath ?? (await uploadLeafImage(scan.localUri)).imagePath;
        // Scans queued by older app versions carry a stand-in verdict made
        // on the phone. Ignore it: the server classifies the photo itself.
        await scanLeaf(imagePath, scan.scannedAt);
      } catch (error) {
        console.log('[pendingScans] Upload deferred:', error);
        // Only a scan the server can NEVER accept is dropped, so it does not
        // block the whole queue forever: the photo is gone from the server
        // (IMAGE_NOT_FOUND), the scan time is out of range (older than 30
        // days), the photo is not a corn leaf (NOT_A_CORN_LEAF - retrying
        // gets the same answer), or the local file no longer exists. These are matched by
        // the error's `code`, never by status alone: a plain 404 can also
        // mean "Route not found" (a server that has no /scan yet), and any
        // other 400 could be a bug - both keep the scan queued. Drops are
        // counted so the farmer is told (see PendingScanSync).
        const neverAccepted =
          error instanceof ApiError &&
          (error.code === 'IMAGE_NOT_FOUND' ||
            error.code === 'SCAN_TIME_OUT_OF_RANGE' ||
            error.code === 'NOT_A_CORN_LEAF');
        if (neverAccepted || (!(error instanceof ApiError) && !photoExists(scan.localUri))) {
          await removePending(userId, scan.id);
          dropped += 1;
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
  if (uploaded > 0 || dropped > 0) listeners.forEach((callback) => callback());
  return { uploaded, dropped };
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
