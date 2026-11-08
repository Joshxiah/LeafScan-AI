/**
 * Records and reads the farmer's leaf scans on the backend.
 *
 * scanLeaf() sends an uploaded photo to the server, which classifies
 * it with the real MobileNetV2 model and records the scan in the
 * `detections` table (CAO Detections page and dashboard).
 * The phone never sends its own verdict (the one it makes offline, see
 * onDeviceScan.ts, is only shown meanwhile). loadFarmerScans() reads the
 * rows back for Home / History / the CAO report - the exact same rows the CAO
 * sees, rather than the on-device log, which only ever reflects this
 * one phone and can drift (or leak between accounts on a shared
 * device - see scanLog.ts).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';
import { ScanClassLabel } from '../data/scanStats';
import { ConfidenceLevel, RiskLevel } from '../types';
import { ScanEntry, getScanLog } from './scanLog';
import { getPendingScans } from './pendingScans';

/** What POST /api/detections/scan returns inside "data" (only the parts the phone uses). */
interface ScanLeafResponse {
  /** The saved detections row - the same values GET /api/detections gives back later. */
  detection: {
    id: number;
    confidenceLevel: ConfidenceLevel;
    /** From diseases.default_risk_level for the predicted class. */
    riskLevel: RiskLevel;
  };
  prediction: {
    classLabel: ScanClassLabel;
    /** 0-100 */
    confidence: number;
  };
}

/** What scanLeaf() hands back: the verdict, how sure the AI is, and how dangerous the disease is. */
export interface ScanLeafResult {
  classLabel: ScanClassLabel;
  /** 0-100, one decimal place (e.g. 96.6). */
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  riskLevel: RiskLevel;
  /** detections.id of the row the server just saved. */
  detectionId: number;
}

/**
 * The confidence score as the screens show it: one decimal place (96.64 -> 96.6).
 * Used for a fresh scan and for a row read back from the server, so the same
 * scan never reads differently on the result screen and in History.
 */
function roundToOneDecimal(score: number): number {
  return Math.round(score * 10) / 10;
}

/**
 * Has the server classify an already-uploaded photo and record the
 * scan. `imagePath` is the "uploads/xxx.jpg" from POST /api/uploads.
 * Throws ApiError: 503 when the AI service is down, 404 if the photo
 * is gone, 0 / 408 with no connection.
 */
export async function scanLeaf(
  imagePath: string,
  /** ISO time the leaf was actually scanned - only for scans queued before they could be sent. */
  detectedAt?: string
): Promise<ScanLeafResult> {
  const result = await api.post<ScanLeafResponse>('/detections/scan', {
    imagePath,
    ...(detectedAt ? { detectedAt } : {}),
  });
  return {
    classLabel: result.prediction.classLabel,
    confidence: roundToOneDecimal(result.prediction.confidence),
    confidenceLevel: result.detection.confidenceLevel,
    riskLevel: result.detection.riskLevel,
    detectionId: result.detection.id,
  };
}

/** One row of GET /api/detections, trimmed to what a farmer's own screens need. */
export interface RemoteDetection {
  id: number;
  predictedClass: string;
  confidenceScore: number;
  /**
   * How sure the AI was / how dangerous the disease is. The server sends
   * both on every row; they are optional here only because a list cached
   * on the phone by an older app version does not have them.
   */
  confidenceLevel?: ConfidenceLevel;
  riskLevel?: RiskLevel;
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
    confidence: roundToOneDecimal(detection.confidenceScore),
    confidenceLevel: detection.confidenceLevel,
    riskLevel: detection.riskLevel,
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
  // Scans taken offline that have not reached the server yet. The ones the
  // phone scanned on its own have a verdict, listed here like any other scan
  // (marked `pending` until the upload). A photo with no verdict at all shows
  // as "waiting for internet" instead (see getWaitingScans).
  const pending: ScanEntry[] = (await getPendingScans(userId)).flatMap(
    (scan): ScanEntry[] =>
      scan.classLabel === undefined || scan.confidence === undefined
        ? []
        : [
            {
              id: `pending-${scan.id}`,
              classLabel: scan.classLabel,
              confidence: scan.confidence,
              confidenceLevel: scan.confidenceLevel,
              scannedAt: new Date(scan.scannedAt),
              localUri: scan.localUri,
              pending: true,
            },
          ]
  );

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
