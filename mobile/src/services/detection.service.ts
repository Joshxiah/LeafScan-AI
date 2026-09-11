/**
 * Records a finished leaf scan on the backend.
 *
 * The phone still runs the stand-in classifier (pickMockDiagnosis
 * in src/data/scanStats.ts) and keeps its own on-device log for
 * Home / History; this call ALSO writes the scan to the server's
 * `detections` table so it shows up on the CAO's Detections page
 * and dashboard. Best-effort - a failure here must never block the
 * farmer from seeing their result.
 */

import { api } from './api';
import { ScanClassLabel } from '../data/scanStats';

export interface RecordDetectionPayload {
  /** Relative path from a prior POST /api/uploads ("uploads/xxx.jpg"). */
  imagePath: string;
  predictedClass: ScanClassLabel;
  /** 0-100, as shown on the Diagnosis screen. */
  confidenceScore: number;
}

export async function recordDetection(payload: RecordDetectionPayload): Promise<void> {
  await api.post<unknown>('/detections', payload);
}
