/**
 * Outbreak report submission for LeafScan AI.
 *
 * POST /api/reports - protected, farmer only. The backend trusts
 * the counts and breakdown sent here rather than recomputing them,
 * since they are a snapshot of the farmer's own on-device scan log
 * (src/services/scanLog.ts) - there is no server-side scan history
 * yet (Phase 13).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';
import { ScanClassLabel } from '../data/scanStats';

export interface ReportBreakdownItem {
  classLabel: ScanClassLabel;
  displayName: string;
  count: number;
}

/** One of the farmer's own scan photos, so the CAO can verify the finding. */
export interface ReportImagePayload {
  imagePath: string;
  classLabel?: string;
  displayName?: string;
  confidenceScore?: number;
  riskLevel?: 'none' | 'low' | 'moderate' | 'high';
}

export interface SubmitReportPayload {
  barangay?: string;
  municipality?: string;
  totalScans: number;
  affectedScans: number;
  healthyScans: number;
  diseaseBreakdown: ReportBreakdownItem[];
  images?: ReportImagePayload[];
  estimatedAreaHectares?: number;
  remarks?: string;
}

export async function submitReport(payload: SubmitReportPayload): Promise<{ id: number }> {
  return api.post<{ id: number }>('/reports', payload);
}

// ---------- Which scans a report has already covered ----------
//
// A report summarises the farmer's scans, so without this every submit
// re-sent the same scans and the CAO received the same report again
// and again. Once a report goes through, its scans are remembered here
// (per user, like the other on-device stores) and the Report screen
// offers only scans taken since. Kept on the phone only: a reinstall or
// a second phone starts over.

const REPORTED_KEY_PREFIX = 'leafscan_reported_scans';
/** Newest ids kept; far more than a farmer scans between two reports. */
const MAX_REPORTED_IDS = 2000;

const reportedKeyFor = (userId: number) => `${REPORTED_KEY_PREFIX}_${userId}`;

/** ScanEntry ids already included in a submitted report. */
export async function getReportedScanIds(userId: number): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(reportedKeyFor(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch (error) {
    console.error('[report] Failed to read the reported scans:', error);
    return new Set();
  }
}

/** Remembers that these scans went out in a report. Never throws - the report itself already succeeded. */
export async function markScansReported(userId: number, scanIds: string[]): Promise<void> {
  try {
    const all = [...(await getReportedScanIds(userId)), ...scanIds];
    const unique = [...new Set(all)].slice(-MAX_REPORTED_IDS);
    await AsyncStorage.setItem(reportedKeyFor(userId), JSON.stringify(unique));
  } catch (error) {
    console.error('[report] Failed to save the reported scans:', error);
  }
}
