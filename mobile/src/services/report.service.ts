/**
 * Outbreak report submission for LeafScan AI.
 *
 * POST /api/reports - protected, farmer only. The backend trusts
 * the counts and breakdown sent here rather than recomputing them,
 * since they are a snapshot of the farmer's own on-device scan log
 * (src/services/scanLog.ts) - there is no server-side scan history
 * yet (Phase 13).
 */

import { api } from './api';
import { ScanClassLabel } from '../data/scanStats';

export interface ReportBreakdownItem {
  classLabel: ScanClassLabel;
  displayName: string;
  count: number;
}

export interface SubmitReportPayload {
  barangay?: string;
  municipality?: string;
  totalScans: number;
  affectedScans: number;
  healthyScans: number;
  diseaseBreakdown: ReportBreakdownItem[];
  estimatedAreaHectares?: number;
  remarks?: string;
}

export async function submitReport(payload: SubmitReportPayload): Promise<{ id: number }> {
  return api.post<{ id: number }>('/reports', payload);
}
