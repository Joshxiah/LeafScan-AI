/**
 * The farmer's on-device scan history - now only a fallback.
 *
 * Home, History and the CAO report all read `GET /api/detections`
 * through loadFarmerScans() in detection.service.ts, which is the
 * same table the CAO's own dashboard reads. This file only fills in
 * when that request fails (no connection), which is also why every
 * key here is scoped to a userId: an earlier version kept ONE global
 * AsyncStorage key for every account, so switching farmers on the
 * same phone (or a shared demo device) leaked the previous farmer's
 * scans into "Recent Scans" and inflated the CAO report's totals.
 * Scoping by userId means a farmer can only ever fall back to their
 * own device history.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanClassLabel } from '../data/scanStats';

const STORAGE_KEY_PREFIX = 'leafscan_scan_log';

function storageKeyFor(userId: number): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

/** Oldest entries are dropped past this, so on-device storage cannot grow forever. */
const MAX_ENTRIES = 200;

export interface ScanEntry {
  id: string;
  classLabel: ScanClassLabel;
  confidence: number;
  scannedAt: Date;
  /** Relative path of the uploaded photo ("uploads/xxx.jpg"), when the scan was uploaded. */
  imagePath?: string;
  /** Absolute URL of the uploaded photo, for immediate display. */
  imageUrl?: string;
}

/** The on-disk shape - a Date cannot survive JSON.stringify, so it is stored as ISO text. */
interface StoredScanEntry {
  id: string;
  classLabel: ScanClassLabel;
  confidence: number;
  scannedAt: string;
  imagePath?: string;
  imageUrl?: string;
}

/** Reads this farmer's logged scans, most recent first. Empty until they scan something on this device. */
export async function getScanLog(userId: number): Promise<ScanEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKeyFor(userId));
    if (!raw) return [];

    const stored = JSON.parse(raw) as StoredScanEntry[];
    return stored.map((entry) => ({ ...entry, scannedAt: new Date(entry.scannedAt) }));
  } catch (error) {
    console.error('[scanLog] Failed to read the scan log:', error);
    return [];
  }
}

/** Appends one completed scan and returns it. Fails quietly - a storage error should not block the app. */
export async function addScan(
  userId: number,
  entry: Omit<ScanEntry, 'id'>
): Promise<ScanEntry> {
  const newEntry: ScanEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };

  try {
    const existing = await getScanLog(userId);
    const next = [newEntry, ...existing].slice(0, MAX_ENTRIES);

    const toStore: StoredScanEntry[] = next.map((scan) => ({
      ...scan,
      scannedAt: scan.scannedAt.toISOString(),
    }));

    await AsyncStorage.setItem(storageKeyFor(userId), JSON.stringify(toStore));
  } catch (error) {
    console.error('[scanLog] Failed to save the scan:', error);
  }

  return newEntry;
}
