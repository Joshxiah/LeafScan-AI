/**
 * Scans taken while offline, waiting to be uploaded.
 *
 * With no connection the Preview screen scans the leaf on the phone
 * (onDeviceScan.ts) and saves the photo here WITH that result, so the farmer
 * has their answer straight away and Home / History list it. Uploading is
 * only housekeeping: syncPendingScans() sends the photo the next time the
 * phone can reach the server, and the SERVER classifies it again - that is
 * the record the CAO sees (the phone's own verdict is never sent).
 *
 * Builds that cannot run the model (Expo Go, web) save the photo with no
 * verdict at all; it shows up as "waiting for internet" until the server has
 * scanned it. Queues are scoped per userId for the same reason scanLog.ts is.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File as LocalFile, Paths } from 'expo-file-system';

import { ApiError } from './api';
import { uploadLeafImage } from './upload.service';
import { scanLeaf } from './detection.service';
import {
  OnDeviceModelUnavailableError,
  OnDeviceVerdict,
  classifyOnDevice,
  isOnDeviceScanSupported,
} from './onDeviceScan';
import { ScanClassLabel } from '../data/scanStats';
import { ConfidenceLevel } from '../types';

const KEY_PREFIX = 'leafscan_pending_scans';
const MAX_PENDING = 100;

export interface PendingScan {
  id: string;
  /** Permanent on-device copy of the photo. */
  localUri: string;
  /**
   * The verdict the on-device model gave this photo, so it can be shown
   * before any internet. Undefined while no verdict exists yet (the model
   * is not available in this build, or the photo was queued before one
   * could be made). Replaced by the server's own result after the upload.
   */
  classLabel?: ScanClassLabel;
  confidence?: number;
  confidenceLevel?: ConfidenceLevel;
  /** The on-device scan already tried this photo and could not give a verdict (not a leaf / unreadable) - do not try again. */
  onDeviceTried?: boolean;
  scannedAt: string;
  /** Set when the photo already reached the server and only the detection record is missing. */
  imagePath?: string;
}

const listeners = new Set<() => void>();

/** Calls back whenever the queue changed behind the farmer's back (uploaded, or given a result), so lists can reload. */
export function onPendingSynced(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const keyFor = (userId: number) => `${KEY_PREFIX}_${userId}`;

/**
 * How many queued photos have no verdict yet - the ones the farmer can
 * only be told are "waiting". (Photos the phone has scanned on its own
 * have a verdict and are listed in Home / History like any other scan.)
 */
export async function countWaitingScans(userId: number): Promise<number> {
  return (await getWaitingScans(userId)).length;
}

/** A queued photo with no verdict yet, as Home and History list it. */
export interface WaitingPhoto {
  id: string;
  localUri: string;
  scannedAt: Date;
}

/**
 * The queued photos that have no verdict yet - only possible in a build
 * that cannot scan on the phone (Expo Go, web), or for a photo the on-device
 * model could not judge. Home and History list them as "waiting for
 * internet" and count them as scans the farmer took, but never as healthy
 * or diseased - nothing has classified them. Newest first.
 */
export async function getWaitingScans(userId: number): Promise<WaitingPhoto[]> {
  return (await getPendingScans(userId))
    .filter((scan) => scan.classLabel === undefined)
    .map((scan) => ({
      id: `waiting-${scan.id}`,
      localUri: scan.localUri,
      scannedAt: new Date(scan.scannedAt),
    }))
    .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());
}

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

/**
 * Queues one scan for upload and returns it. Pass the on-device `verdict`
 * when there is one, so the farmer's result is listed right away.
 */
export async function queuePendingScan(
  userId: number,
  scan: { imageUri: string; imagePath?: string; verdict?: OnDeviceVerdict }
): Promise<PendingScan> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: PendingScan = {
    id,
    localUri: persistPhoto(scan.imageUri, id),
    scannedAt: new Date().toISOString(),
    imagePath: scan.imagePath,
    ...(scan.verdict
      ? {
          classLabel: scan.verdict.classLabel,
          confidence: scan.verdict.confidence,
          confidenceLevel: scan.verdict.confidenceLevel,
        }
      : {}),
  };

  const existing = await getPendingScans(userId);
  await savePending(userId, [entry, ...existing].slice(0, MAX_PENDING));
  return entry;
}

let isSyncing = false;
let isClassifying = false;

/**
 * Gives every queued photo that has no verdict yet one from the on-device
 * model, so it shows a real result with no internet instead of "waiting".
 * Covers photos queued before this build could scan on the phone.
 *
 * A photo the model cannot judge (not a leaf, unreadable) is marked and left
 * alone: the server gets the final say when it is uploaded. Returns how many
 * photos got a verdict.
 */
export async function classifyWaitingScansOnDevice(userId: number): Promise<number> {
  // The queue is read, changed and written back in pieces; never at the same time as a sync.
  if (!isOnDeviceScanSupported() || isSyncing || isClassifying) return 0;
  isClassifying = true;

  let classified = 0;
  try {
    const waiting = (await getPendingScans(userId)).filter(
      (scan) => scan.classLabel === undefined && !scan.onDeviceTried
    );

    for (const scan of waiting) {
      let changes: Partial<PendingScan>;
      try {
        const verdict = await classifyOnDevice(scan.localUri);
        changes = {
          classLabel: verdict.classLabel,
          confidence: verdict.confidence,
          confidenceLevel: verdict.confidenceLevel,
        };
        classified += 1;
      } catch (error) {
        if (error instanceof OnDeviceModelUnavailableError) break; // no model in this build: nothing to do
        console.log('[pendingScans] On-device scan skipped:', error);
        changes = { onDeviceTried: true };
      }
      await updatePending(userId, scan.id, changes);
    }
  } finally {
    isClassifying = false;
  }

  if (classified > 0) listeners.forEach((callback) => callback());
  return classified;
}

async function updatePending(
  userId: number,
  id: string,
  changes: Partial<PendingScan>
): Promise<void> {
  // Re-read so a scan queued meanwhile is not lost.
  const current = await getPendingScans(userId);
  await savePending(
    userId,
    current.map((scan) => (scan.id === id ? { ...scan, ...changes } : scan))
  );
}

/**
 * Uploads every queued scan, oldest first. Stops at the first failure
 * worth retrying (almost always "still offline", see isWorthRetrying) and
 * leaves the rest queued; a scan the server refuses is never retried.
 * Returns how many were uploaded, how many had to be dropped, and how many
 * the server's model found are not corn leaves (NOT_CORN: removed from the
 * queue, photo and all, and never saved to the history).
 */
export async function syncPendingScans(
  userId: number
): Promise<{ uploaded: number; dropped: number; notCorn: number }> {
  if (isSyncing || isClassifying) return { uploaded: 0, dropped: 0, notCorn: 0 };
  isSyncing = true;

  let uploaded = 0;
  let dropped = 0;
  let notCorn = 0;
  try {
    const queue = [...(await getPendingScans(userId))].reverse();

    for (const scan of queue) {
      try {
        const imagePath = scan.imagePath ?? (await uploadLeafImage(scan.localUri)).imagePath;
        // The verdict the phone made is only for showing the farmer an answer
        // meanwhile. It is never sent: the server classifies the photo itself.
        await scanLeaf(imagePath, scan.scannedAt);
      } catch (error) {
        console.log('[pendingScans] Upload deferred:', error);

        // The model says this is not a corn leaf: retrying gets the same answer, so
        // take it out of the queue (the phone's own verdict listed it in Home / History
        // until now) and count it apart from `dropped`, so the farmer gets a specific notice.
        if (error instanceof ApiError && error.code === 'NOT_CORN') {
          await removePending(userId, scan.id);
          deletePhoto(scan.localUri);
          notCorn += 1;
          continue;
        }

        // No connection (or the server is having a problem): keep this scan and
        // everything behind it, and try again on the next sync.
        if (isWorthRetrying(error, scan.localUri)) break;

        // Anything else is a "no" to THIS scan - the server answered with a 4xx
        // (photo gone from the server, older than 30 days, not a corn leaf, ...)
        // or the local photo is gone - and asking again gets the same answer. Drop
        // it so it does not block the rest of the queue, and count it so the
        // farmer is told (see PendingScanSync).
        await removePending(userId, scan.id);
        dropped += 1;
        continue;
      }

      await removePending(userId, scan.id);
      deletePhoto(scan.localUri);
      uploaded += 1;
    }
  } finally {
    isSyncing = false;
  }
  if (uploaded > 0 || dropped > 0 || notCorn > 0) listeners.forEach((callback) => callback());
  return { uploaded, dropped, notCorn };
}

async function removePending(userId: number, id: string): Promise<void> {
  // Re-read so a scan queued during the upload is not lost.
  const current = await getPendingScans(userId);
  await savePending(userId, current.filter((scan) => scan.id !== id));
}

/**
 * Whether a failed upload should be tried again on the next sync.
 *
 *   - No answer from the server (NETWORK_ERROR, REQUEST_TIMEOUT): offline or a weak signal.
 *   - The server itself failing (5xx, e.g. 503 while its AI service restarts): the scan is
 *     fine. Dropping here would wipe the whole queue in one pass during any server hiccup.
 *   - 401 / 403: the sign-in was rejected. AuthContext signs the farmer out, and the scan is
 *     still good for when they sign in again (the queue is kept per account).
 *
 * Every other 4xx is the server refusing this particular scan, so it is NOT retried.
 * A failure that did not come from the server at all (e.g. reading the photo) is retried
 * unless the photo itself is gone.
 */
function isWorthRetrying(error: unknown, localUri: string): boolean {
  if (!(error instanceof ApiError)) return photoExists(localUri);
  if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') return true;
  return error.status >= 500 || error.status === 401 || error.status === 403;
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
