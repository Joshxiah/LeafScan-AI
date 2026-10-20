/**
 * Records and reads the farmer's leaf scans on the backend.
 *
 * The phone still runs the stand-in classifier (pickMockDiagnosis
 * in src/data/scanStats.ts); recordDetection() writes the result to
 * the server's `detections` table so it shows up on the CAO's
 * Detections page and dashboard, and loadFarmerScans() reads it back
 * for Home / History / the CAO report - the exact same rows the CAO
 * sees, rather than the on-device log, which only ever reflects this
 * one phone and can drift (or leak between accounts on a shared
 * device - see scanLog.ts).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';
import { ScanClassLabel } from '../data/scanStats';
import { ScanEntry, getScanLog } from './scanLog';
import { getPendingScans } from './pendingScans';

export interface RecordDetectionPayload {
  /** Relative path from a prior POST /api/uploads ("uploads/xxx.jpg"). */
  imagePath: string;
  predictedClass: ScanClassLabel;
  /** 0-100, as shown on the Diagnosis screen. */
  confidenceScore: number;
  /** ISO time the leaf was scanned - only set when uploading a scan queued offline. */
  detectedAt?: string;
}

export async function recordDetection(payload: RecordDetectionPayload): Promise<void> {
  await api.post<unknown>('/detections', payload);
}

/** One row of GET /api/detections, trimmed to what a farmer's own screens need. */
export interface RemoteDetection {
  id: number;
  predictedClass: string;
  confidenceScore: number;
  imagePath: string;
  detectedAt: string;
}

interface ListDetectionsResponse {
  detections: RemoteDetection[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * The signed-in farmer's own detections. The backend pins this to
 * their own account regardless of role, so there is no risk of ever
 * fetching someone else's - see backend/src/controllers/detection.controller.ts.
 * One large page is enough for a farmer's whole history in practice;
 * `total` from the server stays the source of truth either way.
 */
export async function listMyDetections(): Promise<RemoteDetection[]> {
  const PAGE_SIZE = 100; // the backend's maximum
  const all: RemoteDetection[] = [];

  for (let page = 1; ; page++) {
    const result = await api.get<ListDetectionsResponse>(
      `/detections?page=${page}&pageSize=${PAGE_SIZE}`
    );
    all.push(...result.detections);
    if (all.length >= result.total || result.detections.length < PAGE_SIZE) break;
  }
  return all;
}

const cacheKeyFor = (userId: number) => `leafscan_detections_cache_${userId}`;

/** Last list the server gave us, so offline screens show the same scans as online ones. */
async function readCache(userId: number): Promise<RemoteDetection[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(userId));
    return raw ? (JSON.parse(raw) as RemoteDetection[]) : null;
  } catch {
    return null;
  }
}

/** Matches the original predicted class exactly, same as the CAO dashboard (the review layer never changes it - see detection.service.ts on the backend). */
function toScanEntry(detection: RemoteDetection): ScanEntry {
  return {
    id: `detection-${detection.id}`,
    classLabel: detection.predictedClass as ScanClassLabel,
    confidence: Math.round(detection.confidenceScore),
    scannedAt: new Date(detection.detectedAt),
    imagePath: detection.imagePath,
  };
}

/**
 * The farmer's scan history for Home, History and the CAO report.
 * Backend-first, so these screens can never disagree with what the
 * CAO sees; falls back to the on-device log only when the backend
 * request itself fails (e.g. no connection).
 */
export async function loadFarmerScans(userId: number): Promise<ScanEntry[]> {
  // Scans taken offline that have not reached the server yet.
  const pending: ScanEntry[] = (await getPendingScans(userId)).map((scan) => ({
    id: `pending-${scan.id}`,
    classLabel: scan.classLabel,
    confidence: scan.confidence,
    scannedAt: new Date(scan.scannedAt),
    localUri: scan.localUri,
    pending: true,
  }));

  let saved: ScanEntry[];
  try {
    const remote = await listMyDetections();
    AsyncStorage.setItem(cacheKeyFor(userId), JSON.stringify(remote)).catch(() => {});
    saved = remote.map(toScanEntry);
  } catch (error) {
    console.log('[detections] Offline - using the last list from the server:', error);
    const cached = await readCache(userId);
    saved = cached ? cached.map(toScanEntry) : await getScanLog(userId);
  }

  return [...pending, ...saved].sort(
    (a, b) => b.scannedAt.getTime() - a.scannedAt.getTime()
  );
}
