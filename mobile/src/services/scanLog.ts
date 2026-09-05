/**
 * The farmer's real, on-device scan history.
 *
 * Every scan they actually complete (see the "View Diagnosis" step
 * in app/(app)/preview.tsx) is appended here via AsyncStorage. This
 * is what Home, History and the CAO report read - a farmer who has
 * not scanned anything yet sees zero everywhere, honestly.
 *
 * This is a STAND-IN for the real detections table (Phase 13 - see
 * backend/src/controllers/upload.controller.ts): once every scan is
 * uploaded AND classified by the AI model server-side, this file is
 * replaced by a `GET /api/detections` call. Every screen that reads
 * getScanLog() is already shaped for that swap.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanClassLabel } from '../data/scanStats';

const STORAGE_KEY = 'leafscan_scan_log';

/** Oldest entries are dropped past this, so on-device storage cannot grow forever. */
const MAX_ENTRIES = 200;

export interface ScanEntry {
  id: string;
  classLabel: ScanClassLabel;
  confidence: number;
  scannedAt: Date;
}

/** The on-disk shape - a Date cannot survive JSON.stringify, so it is stored as ISO text. */
interface StoredScanEntry {
  id: string;
  classLabel: ScanClassLabel;
  confidence: number;
  scannedAt: string;
}

/** Reads every logged scan, most recent first. Empty until the farmer scans something. */
export async function getScanLog(): Promise<ScanEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const stored = JSON.parse(raw) as StoredScanEntry[];
    return stored.map((entry) => ({ ...entry, scannedAt: new Date(entry.scannedAt) }));
  } catch (error) {
    console.error('[scanLog] Failed to read the scan log:', error);
    return [];
  }
}

/** Appends one completed scan and returns it. Fails quietly - a storage error should not block the app. */
export async function addScan(entry: Omit<ScanEntry, 'id'>): Promise<ScanEntry> {
  const newEntry: ScanEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };

  try {
    const existing = await getScanLog();
    const next = [newEntry, ...existing].slice(0, MAX_ENTRIES);

    const toStore: StoredScanEntry[] = next.map((scan) => ({
      ...scan,
      scannedAt: scan.scannedAt.toISOString(),
    }));

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('[scanLog] Failed to save the scan:', error);
  }

  return newEntry;
}
