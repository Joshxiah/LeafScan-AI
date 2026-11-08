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
 * Uploads every queued scan, oldest first. Stops at the first
 * failure (almost always "still offline") and leaves the rest queued.
 * Returns how many were uploaded and how many had to be dropped.
 */
export async function syncPendingScans(
  userId: number
): Promise<{ uploaded: number; dropped: number }> {
  if (isSyncing || isClassifying) return { uploaded: 0, dropped: 0 };
  isSyncing = true;

  let uploaded = 0;
  let dropped = 0;
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
